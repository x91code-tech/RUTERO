export type CurrencyConfig = {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  locale: string;
  timeZone: string;
  fractionDigits: number;
};

export const supportedCountries: CurrencyConfig[] = [
  {
    countryCode: "VE",
    countryName: "Venezuela",
    currencyCode: "VES",
    currencyName: "Bolívar digital",
    locale: "es-VE",
    timeZone: "America/Caracas",
    fractionDigits: 2
  },
  {
    countryCode: "US",
    countryName: "Estados Unidos",
    currencyCode: "USD",
    currencyName: "Dólar estadounidense",
    locale: "en-US",
    timeZone: "America/New_York",
    fractionDigits: 2
  },
  {
    countryCode: "CO",
    countryName: "Colombia",
    currencyCode: "COP",
    currencyName: "Peso colombiano",
    locale: "es-CO",
    timeZone: "America/Bogota",
    fractionDigits: 0
  },
  {
    countryCode: "PA",
    countryName: "Panamá",
    currencyCode: "USD",
    currencyName: "Dólar estadounidense",
    locale: "es-PA",
    timeZone: "America/Panama",
    fractionDigits: 2
  },
  {
    countryCode: "BR",
    countryName: "Brasil",
    currencyCode: "BRL",
    currencyName: "Real brasileño",
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    fractionDigits: 2
  },
  {
    countryCode: "MX",
    countryName: "México",
    currencyCode: "MXN",
    currencyName: "Peso mexicano",
    locale: "es-MX",
    timeZone: "America/Mexico_City",
    fractionDigits: 2
  },
  {
    countryCode: "PE",
    countryName: "Perú",
    currencyCode: "PEN",
    currencyName: "Sol peruano",
    locale: "es-PE",
    timeZone: "America/Lima",
    fractionDigits: 2
  },
  {
    countryCode: "CL",
    countryName: "Chile",
    currencyCode: "CLP",
    currencyName: "Peso chileno",
    locale: "es-CL",
    timeZone: "America/Santiago",
    fractionDigits: 0
  },
  {
    countryCode: "DO",
    countryName: "República Dominicana",
    currencyCode: "DOP",
    currencyName: "Peso dominicano",
    locale: "es-DO",
    timeZone: "America/Santo_Domingo",
    fractionDigits: 2
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
    fractionDigits: input?.fractionDigits ?? base.fractionDigits
  };
}
