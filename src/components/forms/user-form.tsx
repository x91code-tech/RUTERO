import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createUserAction } from "@/server/actions/user-actions";

export function UserForm() {
  return (
    <form action={createUserAction} className="grid gap-4">
      <Field label="Nombre">
        <Input name="name" placeholder="Nombre del usuario" required />
      </Field>
      <Field label="Correo">
        <Input name="email" type="email" placeholder="vendedor@empresa.com" required />
      </Field>
      <Field label="Rol">
        <Select name="role" defaultValue="SELLER">
          <option value="SELLER">Vendedor</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </Field>
      <Field label="Contraseña temporal">
        <Input name="password" type="password" placeholder="Mínimo 8 caracteres" required />
      </Field>
      <Button type="submit">
        <UserPlus className="h-4 w-4" /> Crear usuario
      </Button>
    </form>
  );
}
