import { supportedCountries } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";

export function CountryScopeForm({ countryCode, label = "País / moneda" }: { countryCode: string; label?: string }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-2">
      <Field label={label}>
        <Select name="countryCode" defaultValue={countryCode} className="min-h-10 min-w-52">
          {supportedCountries.map((country) => (
            <option key={country.countryCode} value={country.countryCode}>
              {country.countryName} · {country.currencyCode}
            </option>
          ))}
        </Select>
      </Field>
      <Button type="submit" variant="secondary" className="min-h-10">Ver cartera</Button>
    </form>
  );
}
