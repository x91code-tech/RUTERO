import { Button } from "@/components/ui/button";
import { CashMovementFields } from "@/components/forms/cash-movement-fields";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { getDefaultInterestPercent, getDefaultTermDays, paymentFrequencyLabels } from "@/lib/company-settings";
import { demoClients, demoCompany } from "@/lib/demo-data";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { createCollectionAction, createExpenseAction, createLoanAction, createSaleAction } from "@/server/actions/financial-actions";
import type { Client, Company, Loan } from "@/lib/types";

type MovementFormProps = {
  clients?: Client[];
  company?: Company;
  loans?: Loan[];
  defaultClientId?: string;
};

function todayInputValue() {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getFormData(input?: MovementFormProps) {
  const company = input?.company ?? demoCompany;
  const clients = input?.clients?.length ? input.clients : demoClients;
  return {
    company,
    clients,
    loans: input?.loans ?? [],
    paymentOptions: getPaymentMethodsForCountry(company.countryCode)
  };
}

export function LoanForm(props: MovementFormProps) {
  const { clients, company } = getFormData(props);
  const defaultInterestPercent = getDefaultInterestPercent(company.defaultInterestRate);
  const defaultTermDays = getDefaultTermDays(company.defaultTermDays);

  return (
    <form action={createLoanAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={props.defaultClientId ?? clients[0]?.id}>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Monto entregado">
          <Input name="principalAmount" type="number" defaultValue="100" min="0" step="0.01" />
        </Field>
        <Field label="Dias de pago">
          <Input name="termDays" type="number" defaultValue={defaultTermDays} min="1" step="1" />
        </Field>
      </div>
      <input type="hidden" name="interestRatePercent" value={defaultInterestPercent} />
      <input type="hidden" name="paymentFrequency" value={company.paymentFrequency ?? "DAILY"} />
      <Field label="Fecha de inicio">
        <Input name="startDate" type="date" defaultValue={todayInputValue()} />
      </Field>
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        RUTERO calcula {defaultInterestPercent}% de ganancia en frecuencia {paymentFrequencyLabels[company.paymentFrequency ?? "DAILY"].toLowerCase()}.
      </div>
      <Field label="Notas">
        <Textarea name="notes" placeholder="Condiciones, referencia o acuerdo con el cliente" />
      </Field>
      <Button type="submit">Crear prestamo</Button>
    </form>
  );
}

export function SaleForm(props: MovementFormProps) {
  const { clients, paymentOptions } = getFormData(props);
  const defaultPaymentMethod = paymentOptions.find((method) => method.category === "cash")?.code ?? paymentOptions[0]?.code;

  return (
    <form action={createSaleAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={clients[0]?.id}>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Producto o concepto">
        <Input name="product" defaultValue="Pedido mixto" />
      </Field>
      <Field label="Monto">
        <Input name="amount" type="number" defaultValue="120" min="0" step="0.01" />
      </Field>
      <Field label="Metodo de pago">
        <Select name="paymentMethod" defaultValue={defaultPaymentMethod}>
          {paymentOptions.map((method) => (
            <option key={method.code} value={method.code}>
              {method.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fecha">
        <Input name="date" type="date" defaultValue={todayInputValue()} />
      </Field>
      <Field label="Observacion">
        <Textarea name="observation" placeholder="Agrega una nota si aplica" />
      </Field>
      <Button type="submit">Registrar venta</Button>
    </form>
  );
}

export function CollectionForm(props: MovementFormProps) {
  const { clients, loans, paymentOptions } = getFormData(props);
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVE" && loan.balance > 0);
  const defaultPaymentMethod = paymentOptions.find((method) => method.category === "cash")?.code ?? paymentOptions[0]?.code;
  const paymentTypes = [
    ["INSTALLMENT", "Cuota del dia"],
    ["ADVANCE", "Cuota adelantada"],
    ["SETTLEMENT", "Pago total"],
    ["RENEWAL", "Pago para renovar"],
    ["MANUAL", "Manual"],
    ["ADDITIONAL", "Adicional"]
  ];
  const applications = [
    ["NORMAL", "Normal: mora, interes y capital"],
    ["CAPITAL_INTEREST", "Interes + capital"],
    ["CAPITAL_ONLY", "Solo capital"],
    ["INTEREST_ONLY", "Solo interes"],
    ["LATE_FEE", "Solo mora"],
    ["ADDITIONAL_WITH_BALANCE", "Adicional que descuenta saldo"],
    ["ADDITIONAL_NO_BALANCE", "Adicional sin descontar saldo"]
  ];

  return (
    <form action={createCollectionAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={props.defaultClientId ?? clients[0]?.id}>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Prestamo">
        <Select name="loanId" defaultValue="">
          <option value="">Recaudo general del cliente</option>
          {activeLoans.map((loan) => {
            const client = clients.find((item) => item.id === loan.clientId);
            return (
              <option key={loan.id} value={loan.id}>
                {client?.name} - saldo {loan.balance.toFixed(2)} - cuota {loan.dailyPayment.toFixed(2)}
              </option>
            );
          })}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Referencia de saldo">
          <Input value="Se calcula al guardar" readOnly />
        </Field>
        <Field label="Monto pagado">
          <Input name="amount" type="number" defaultValue="100" min="0" step="0.01" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de pago">
          <Select name="paymentType" defaultValue="INSTALLMENT">
            {paymentTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Aplicar a">
          <Select name="application" defaultValue="NORMAL">
            {applications.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Metodo de pago">
        <Select name="paymentMethod" defaultValue={defaultPaymentMethod}>
          {paymentOptions.map((method) => (
            <option key={method.code} value={method.code}>
              {method.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Fecha">
        <Input name="date" type="date" defaultValue={todayInputValue()} />
      </Field>
      <Field label="Observacion">
        <Textarea name="observation" placeholder="Ejemplo: abono semanal confirmado" />
      </Field>
      <Button type="submit">Registrar recaudo</Button>
    </form>
  );
}

export function ExpenseForm(props: MovementFormProps) {
  const { paymentOptions } = getFormData(props);

  return (
    <form action={createExpenseAction} className="grid gap-4">
      <CashMovementFields defaultDate={todayInputValue()} paymentOptions={paymentOptions} />
      <Button type="submit">Registrar movimiento</Button>
    </form>
  );
}
