import { getCurrencyConfig } from "@/lib/countries";

export type CurrencyGroup<T> = {
  countryCode: string;
  currencyCode: string;
  countryName: string;
  items: T[];
};

export function groupByCurrency<T extends { countryCode?: string; currencyCode?: string }>(items: T[]): CurrencyGroup<T>[] {
  const groups = new Map<string, CurrencyGroup<T>>();

  for (const item of items) {
    const currency = getCurrencyConfig({
      countryCode: item.countryCode,
      currencyCode: item.currencyCode
    });
    const key = `${currency.countryCode}:${currency.currencyCode}`;
    const group = groups.get(key) ?? {
      countryCode: currency.countryCode,
      currencyCode: currency.currencyCode,
      countryName: currency.countryName,
      items: []
    };
    group.items.push(item);
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((left, right) =>
    left.countryName.localeCompare(right.countryName)
  );
}
