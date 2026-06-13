export type CurrencyConfig = {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  locale: string;
  timeZone: string;
  fractionDigits: number;
  clientDocumentRequirements: ClientDocumentRequirement[];
};

export type ClientDocumentRequirement = {
  type: string;
  label: string;
  required: boolean;
  description: string;
};

export const supportedCountries: CurrencyConfig[] = [
  {
    countryCode: "VE",
    countryName: "Venezuela",
    currencyCode: "VES",
    currencyName: "Bolívar digital",
    locale: "es-VE",
    timeZone: "America/Caracas",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "RIF", label: "RIF", required: true, description: "Registro de Información Fiscal del negocio." },
      { type: "CEDULA", label: "Cédula del responsable", required: true, description: "Documento de identidad del encargado o titular." },
      { type: "LOCAL_PHOTO", label: "Foto del local", required: false, description: "Foto de fachada o punto de venta." }
    ]
  },
  {
    countryCode: "US",
    countryName: "Estados Unidos",
    currencyCode: "USD",
    currencyName: "Dólar estadounidense",
    locale: "en-US",
    timeZone: "America/New_York",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "EIN", label: "EIN", required: true, description: "Employer Identification Number si aplica." },
      { type: "STATE_ID", label: "ID del responsable", required: true, description: "Documento de identidad del responsable." },
      { type: "BUSINESS_LICENSE", label: "Licencia comercial", required: false, description: "Permiso o licencia local del negocio." }
    ]
  },
  {
    countryCode: "CO",
    countryName: "Colombia",
    currencyCode: "COP",
    currencyName: "Peso colombiano",
    locale: "es-CO",
    timeZone: "America/Bogota",
    fractionDigits: 0,
    clientDocumentRequirements: [
      { type: "NIT", label: "NIT", required: true, description: "Número de Identificación Tributaria." },
      { type: "CEDULA", label: "Cédula del responsable", required: true, description: "Documento del encargado del comercio." },
      { type: "CAMARA_COMERCIO", label: "Cámara de comercio", required: false, description: "Certificado mercantil si aplica." }
    ]
  },
  {
    countryCode: "PA",
    countryName: "Panamá",
    currencyCode: "USD",
    currencyName: "Dólar estadounidense",
    locale: "es-PA",
    timeZone: "America/Panama",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "RUC", label: "RUC", required: true, description: "Registro Único de Contribuyente." },
      { type: "CEDULA", label: "Cédula o pasaporte", required: true, description: "Documento del representante." },
      { type: "AVISO_OPERACION", label: "Aviso de operación", required: false, description: "Permiso comercial si aplica." }
    ]
  },
  {
    countryCode: "BR",
    countryName: "Brasil",
    currencyCode: "BRL",
    currencyName: "Real brasileño",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "CNPJ", label: "CNPJ", required: true, description: "Cadastro Nacional da Pessoa Jurídica." },
      { type: "CPF", label: "CPF del responsable", required: true, description: "Documento fiscal del responsable." },
      { type: "INSCRICAO_ESTADUAL", label: "Inscripción estadual", required: false, description: "Registro estadual si aplica." }
    ]
  },
  {
    countryCode: "MX",
    countryName: "México",
    currencyCode: "MXN",
    currencyName: "Peso mexicano",
    locale: "es-MX",
    timeZone: "America/Mexico_City",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "RFC", label: "RFC", required: true, description: "Registro Federal de Contribuyentes." },
      { type: "INE", label: "INE del responsable", required: true, description: "Identificación oficial del encargado." },
      { type: "CONSTANCIA_FISCAL", label: "Constancia fiscal", required: false, description: "Constancia de situación fiscal." }
    ]
  },
  {
    countryCode: "PE",
    countryName: "Perú",
    currencyCode: "PEN",
    currencyName: "Sol peruano",
    locale: "es-PE",
    timeZone: "America/Lima",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "RUC", label: "RUC", required: true, description: "Registro Único de Contribuyentes." },
      { type: "DNI", label: "DNI del responsable", required: true, description: "Documento nacional de identidad." },
      { type: "LICENCIA_FUNCIONAMIENTO", label: "Licencia de funcionamiento", required: false, description: "Permiso municipal si aplica." }
    ]
  },
  {
    countryCode: "CL",
    countryName: "Chile",
    currencyCode: "CLP",
    currencyName: "Peso chileno",
    locale: "es-CL",
    timeZone: "America/Santiago",
    fractionDigits: 0,
    clientDocumentRequirements: [
      { type: "RUT", label: "RUT", required: true, description: "Rol Único Tributario." },
      { type: "CEDULA", label: "Cédula del responsable", required: true, description: "Documento de identidad del encargado." },
      { type: "PATENTE_COMERCIAL", label: "Patente comercial", required: false, description: "Patente municipal si aplica." }
    ]
  },
  {
    countryCode: "DO",
    countryName: "República Dominicana",
    currencyCode: "DOP",
    currencyName: "Peso dominicano",
    locale: "es-DO",
    timeZone: "America/Santo_Domingo",
    fractionDigits: 2,
    clientDocumentRequirements: [
      { type: "RNC", label: "RNC", required: true, description: "Registro Nacional de Contribuyentes." },
      { type: "CEDULA", label: "Cédula del responsable", required: true, description: "Documento de identidad del responsable." },
      { type: "REGISTRO_MERCANTIL", label: "Registro mercantil", required: false, description: "Documento mercantil si aplica." }
    ]
  }
];

export const defaultCurrencyConfig = supportedCountries[0];

export function getCurrencyConfig(input?: Partial<CurrencyConfig> | null): CurrencyConfig {
  const countryMatch = supportedCountries.find((country) => country.countryCode === input?.countryCode);
  const currencyMatch = supportedCountries.find((country) => country.currencyCode === input?.currencyCode);
  const base = countryMatch ?? currencyMatch ?? defaultCurrencyConfig;

  return {
    ...base,
    ...input,
    countryCode: input?.countryCode ?? base.countryCode,
    countryName: input?.countryName ?? base.countryName,
    currencyCode: input?.currencyCode ?? base.currencyCode,
    currencyName: input?.currencyName ?? base.currencyName,
    locale: input?.locale ?? base.locale,
    timeZone: input?.timeZone ?? base.timeZone,
    fractionDigits: input?.fractionDigits ?? base.fractionDigits,
    clientDocumentRequirements: input?.clientDocumentRequirements ?? base.clientDocumentRequirements
  };
}

export function getClientDocumentRequirements(countryCode: string) {
  return getCurrencyConfig({ countryCode }).clientDocumentRequirements;
}
