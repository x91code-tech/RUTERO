import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function readBuildId() {
  try {
    return (await readFile(join(process.cwd(), ".next", "BUILD_ID"), "utf8")).trim();
  } catch {
    return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NODE_ENV ?? "development";
  }
}

export async function GET() {
  const buildId = await readBuildId();
  return NextResponse.json(
    { buildId },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0"
      }
    }
  );
}
