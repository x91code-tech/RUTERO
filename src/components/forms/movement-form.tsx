import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { demoClients } from "@/lib/demo-data";

const paymentOptions = [
  ["CASH", "Efectivo"],
  ["TRANSFER", "Transferencia"],
  ["PIX", "Pix"],
  ["CREDIT", "Crédito"],
  ["MIXED", "Mixto"]
];

export function SaleForm() {
  return (
    <form className="grid gap-4">
      <Field label="Cliente">
        <Select defaultValue="client_carlos">{demoClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      </Field>
      <Field label="Producto o concepto"><Input defaultValue="Pedido mixto" /></Field>
      <Field label="Monto"><Input type="number" defaultValue="120" min="0" step="0.01" /></Field>
      <Field label="Método de pago"><Select defaultValue="CASH">{paymentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      <Field label="Fecha"><Input type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Observación"><Textarea placeholder="Agrega una nota si aplica" /></Field>
      <Button type="button">Registrar venta</Button>
    </form>
  );
}

export function CollectionForm() {
  return (
    <form className="grid gap-4">
      <Field label="Cliente">
        <Select defaultValue="client_carlos">{demoClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Saldo anterior"><Input value="640.00" readOnly /></Field>
        <Field label="Monto pagado"><Input type="number" defaultValue="100" min="0" step="0.01" /></Field>
      </div>
      <Field label="Método de pago"><Select defaultValue="CASH">{paymentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      <Field label="Fecha"><Input type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Observación"><Textarea placeholder="Ejemplo: abono semanal confirmado" /></Field>
      <Button type="button">Registrar recaudo</Button>
    </form>
  );
}

export function ExpenseForm() {
  return (
    <form className="grid gap-4">
      <Field label="Tipo de gasto">
        <Select defaultValue="Gasolina">
          {["Gasolina", "Comida", "Transporte", "Material", "Otro"].map((type) => <option key={type}>{type}</option>)}
        </Select>
      </Field>
      <Field label="Monto"><Input type="number" defaultValue="25" min="0" step="0.01" /></Field>
      <Field label="Método de pago"><Select defaultValue="CASH">{paymentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
      <Field label="Fecha"><Input type="date" defaultValue="2026-06-12" /></Field>
      <Field label="Comentario"><Textarea defaultValue="Gasto operativo de ruta" /></Field>
      <Button type="button">Registrar gasto</Button>
    </form>
  );
}
