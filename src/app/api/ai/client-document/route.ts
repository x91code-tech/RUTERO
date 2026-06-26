import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const GEMINI_MODEL = "gemini-2.0-flash";

type GeminiPart = {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
};

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? "{}";
}

async function callGemini(parts: GeminiPart[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error: "GEMINI_API_KEY no esta configurada en el servidor.",
      status: 500
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              fullName: { type: "STRING" },
              document: { type: "STRING" },
              phone: { type: "STRING" },
              address: { type: "STRING" },
              birthDate: { type: "STRING" },
              confidence: { type: "NUMBER" },
              warnings: {
                type: "ARRAY",
                items: { type: "STRING" }
              }
            },
            required: ["fullName", "document", "confidence", "warnings"]
          }
        }
      })
    }
  );

  if (!response.ok) {
    await response.text();
    if (response.status === 429) {
      return {
        error: "Gemini no pudo leer el documento porque la API esta sin cuota disponible. Revisa el plan, billing o limite del proyecto en Google AI Studio.",
        status: 429
      };
    }

    if (response.status === 400 || response.status === 403) {
      return {
        error: "Gemini rechazo la solicitud. Revisa que la API key sea valida y tenga permisos activos.",
        status: response.status
      };
    }

    return {
      error: `Gemini no pudo procesar la imagen. Error ${response.status}.`,
      status: 502
    };
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return { data: JSON.parse(extractJson(text)) };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Sube una foto del documento." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "La imagen no puede pasar de 5 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await callGemini([
    {
      text:
        "Extrae datos de este documento de identidad para crear un cliente en RUTERO. " +
        "Responde solo JSON. Usa espanol. Si un dato no se ve claro, dejalo vacio y agrega una advertencia. " +
        "No inventes datos. Normaliza el documento manteniendo letras, guiones o prefijos visibles."
    },
    {
      inline_data: {
        mime_type: file.type,
        data: buffer.toString("base64")
      }
    }
  ]);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
