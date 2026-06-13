import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { demoClients, demoCompany } from "@/lib/demo-data";
import { getPaymentMethodsForCountry } from "@/lib/payment-methods";
import { createCollectionAction, createExpenseAction, createSaleAction } from "@/server/actions/financial-actions";
import type { Client, Company } from "@/lib/types";

type MovementFormProps = {
  clients?: Client[];
  company?: Company;
};

function getFormData(input?: MovementFormProps) {
  const company = input?.company ?? demoCompany;
  const clients = input?.clients?.length ? input.clients : demoClients;
  return {
    company,
    clients,
    paymentOptions: getPaymentMethodsForCountry(company.countryCode)
  };
}

export function SaleForm(props: MovementFormProps) {
  const { clients, paymentOptions } = getFormData(props);

  return (
    <form action={createSaleAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={clients[0]?.id}>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      </Field>
      <Field label="Producto o concepto"><Input name="product" defaultValue="Pedido mixto" /></Field>
      <Field label="Monto"><Input name="amount" type="number" defaultValue="120" min="0" step="0.01" /></Field>
      <Field label="Método de pago">
        <Select name="paymentMethod" defaultValue="CASH_USD">
          {paymentOptions.map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
        </Select>
      </Field>
      <Field label="Fecha"><Input name="date" type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Observación"><Textarea name="observation" placeholder="Agrega una nota si aplica" /></Field>
      <Button type="submit">Registrar venta</Button>
    </form>
  );
}

export function CollectionForm(props: MovementFormProps) {
  const { clients, paymentOptions } = getFormData(props);

  return (
    <form action={createCollectionAction} className="grid gap-4">
      <Field label="Cliente">
        <Select name="clientId" defaultValue={clients[0]?.id}>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Saldo anterior"><Input value="640.00" readOnly /></Field>
        <Field label="Monto pagado"><Input name="amount" type="number" defaultValue="100" min="0" step="0.01" /></Field>
      </div>
      <Field label="Método de pago">
        <Select name="paymentMethod" defaultValue="PAGO_MOVIL">
          {paymentOptions.map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
        </Select>
      </Field>
      <Field label="Fecha"><Input name="date" type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Observación"><Textarea name="observation" placeholder="Ejemplo: abono semanal confirmado" /></Field>
      <Button type="submit">Registrar recaudo</Button>
    </form>
  );
}

export function ExpenseForm(props: MovementFormProps) {
  const { paymentOptions } = getFormData(props);

  return (
    <form action={createExpenseAction} className="grid gap-4">
      <Field label="Tipo de gasto">
        <Select name="type" defaultValue="Gasolina">
          {["Gasolina", "Comida", "Transporte", "Material", "Otro"].map((type) => <option key={type}>{type}</option>)}
        </Select>
      </Field>
      <Field label="Monto"><Input name="amount" type="number" defaultValue="25" min="0" step="0.01" /></Field>
      <Field label="Método de pago">
        <Select name="paymentMethod" defaultValue="CASH_USD">
          {paymentOptions.map((method) => <option key={method.code} value={method.code}>{method.label}</option>)}
        </Select>
      </Field>
      <Field label="Fecha"><Input name="date" type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Comentario"><Textarea name="comment" defaultValue="Gasto operativo de ruta" /></Field>
      <Button type="submit">Registrar gasto</Button>
    </form>
  );
}
