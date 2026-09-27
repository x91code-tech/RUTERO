# RUTERO - contexto para otro agente IA

## Estado general

RUTERO es una app Next.js/TypeScript con Prisma/PostgreSQL para administrar empresas de prestamos diarios: cobradores, clientes, rutas, prestamos, recaudos, gastos/retiros/entradas, caja diaria, reportes, notificaciones, documentos y ubicaciones GPS.

El proyecto vive en:

```text
C:\Users\Administrador\Downloads\rutero
```

Repositorio remoto:

```text
https://github.com/x91code-tech/RUTERO.git
```

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod
- bcryptjs
- Recharts
- Capacitor Android

## Base de datos local

PostgreSQL local quedo instalado en Windows:

```text
Servicio: postgresql-x64-17
Host: 127.0.0.1
Puerto: 5432
Usuario: postgres
```

Archivo local `.env` creado:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rutero?schema=public"
NEXTAUTH_URL="http://192.168.3.237:3000"
NEXT_PUBLIC_APP_URL="http://192.168.3.237:3000"
COOKIE_SECURE="false"
GEMINI_API_KEY=""
```

Para probar desde celular en la misma red:

```text
http://192.168.3.237:3000/login
```

## Comandos utiles

```bash
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run prisma:seed
npm.cmd run dev -- -H 0.0.0.0 -p 3000
npm.cmd run lint
npm.cmd run build
```

Si la base `rutero` no existe:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\createdb.exe" -h 127.0.0.1 -U postgres rutero
```

## Flujos reales existentes

Hay server actions y persistencia real para:

- Registro/login con sesiones en tabla `Session`.
- Empresas multiempresa.
- Crear usuarios/cobradores/supervisores/admin.
- Vinculacion de dispositivo de cobrador con identificador y PIN.
- Clientes con documentos por pais y dos ubicaciones.
- Verificacion/aprobacion de clientes.
- Prestamos con interes, cuotas y saldos.
- Recaudos: cuota, adelanto, liquidacion, manual, renovacion, adicional.
- Gastos, retiros y entradas de caja.
- Apertura/cierre de caja diaria.
- Reportes visuales, copiar/WhatsApp/PDF/CSV.
- Notificaciones leidas/no leidas.
- Configuracion de empresa: pais, moneda, interes, plazo, frecuencia, mora, renovacion y caja.

## Archivos importantes

- `prisma/schema.prisma`: modelo principal.
- `src/server/actions/auth-actions.ts`: login, registro, mobile login, sesiones.
- `src/server/actions/financial-actions.ts`: prestamos, recaudos, gastos, caja.
- `src/server/actions/client-actions.ts`: clientes, documentos, ubicaciones, verificacion.
- `src/server/actions/user-actions.ts`: usuarios/cobradores/PIN/dispositivo.
- `src/lib/cashbox-calculations.ts`: formulas de caja.
- `src/lib/loan-payments.ts`: asignacion de pagos a saldo/capital/interes/mora.
- `src/lib/seller-data.ts`: ruta diaria del cobrador.
- `src/app/seller/page.tsx`: paradas, estado diario, acciones de llamada/Maps y acceso al recaudo rapido.
- `src/lib/geo.ts`: utilidades de ubicacion, busqueda en Maps y orden aproximado por GPS.
- `src/components/forms/loan-payment-form.tsx`: hoja/modal para registrar recaudos desde la ruta y ficha del cliente.
- `src/lib/dashboard-data.ts`: analiticas del admin.
- `src/components/layout/app-shell.tsx`: layout interior.
- `src/app/login/page.tsx`: acceso web.
- `src/app/mobile-login/page.tsx`: acceso PIN cobrador.
- `src/lib/billing.ts` y `src/lib/platform-data.ts`: estados de vencimiento, planes, datos del panel del propietario y datos comerciales del socio.
- `src/server/actions/platform-actions.ts`: altas de cuentas, pagos, suscripciones, gracia y comisiones; requiere `SUPER_ADMIN` donde corresponde.
- `src/app/platform/` y `src/app/partner/`: paneles del propietario y del socio.
- `src/components/platform/`: formularios de empresa, suscripcion inicial, mensualidad, cambios de plan y condiciones del socio.
- `scripts/promote-platform-owner.ts`: promocion confirmada de una cuenta ADMIN existente a SUPER_ADMIN.
- `scripts/bootstrap-platform-owner.ts`: crea el primer SUPER_ADMIN cuando la VPS/base nueva no tiene usuarios.

## Cambios recientes confirmados

- Se renombro terminologia a recaudo/cartera/cobrador.
- Se elimino la pantalla demo publica de `/`; ahora redirige a login o dashboard.
- Se removio el texto de demo del login.
- Los formularios ya no usan clientes demo cuando una empresa no tiene datos.
- Prestamos solo muestran clientes `ACTIVE`.
- Dashboard genera alertas cuando faltan cobradores, clientes activos o cajas abiertas.
- Build local paso con `npm.cmd run build`.
- La ruta del cobrador muestra el monto que realmente falta de la cuota de hoy, descontando pagos parciales ya aplicados.
- Cada parada de la ruta permite llamar al cliente y abrir Google Maps. Cuando no hay coordenadas, Maps busca por direccion y, si falta, por nombre.
- La compilacion de produccion y ESLint enfocado pasaron para estos cambios de ruta y navegacion.

## Modelo comercial y panel de plataforma (local, no desplegado)

- Se retiro el alta publica de empresas del login; `/register` vuelve al login y las acciones antiguas de registro no crean cuentas.
- El rol `SUPER_ADMIN` usa `/platform`; el rol `PARTNER` usa `/partner`. El portal del socio consulta solo sus empresas referidas y los datos comerciales de plan, limites, vencimiento y comisiones. No consulta clientes, prestamos ni movimientos de esas empresas.
- El propietario configura los planes Individual, Empresas y Socios, precios/monedas, limites de usuarios/cobradores/empresas y dias de gracia (5 por defecto, configurable de 0 a 30).
- El propietario registra empresas y socios, mensualidades recibidas en USDT/cripto/moneda local, referencia/hash, red, meses cubiertos, estado y vencimiento. Los pagos extienden el vencimiento y se rechazan referencias duplicadas por empresa.
- El socio tiene mensualidad y limite de empresas referidas independientes. Solo se crea comision al registrar un pago realmente recibido de una empresa referida; la tasa se configura por socio y queda guardada con la comision. El propietario puede liquidar comisiones registrando medio, red, referencia y quien registro el pago.
- No hay pasarela de pago ni conversion entre monedas. Los pagos y comisiones se conservan en la moneda registrada. Las altas nuevas requieren un precio mensual positivo y las cuentas vencidas se bloquean al terminar el periodo de gracia.
- Para habilitar al propietario debe existir una cuenta ADMIN activa. Despues de desplegar y aplicar las migraciones en el servidor, promoverla desde el directorio del proyecto con:

  ```bash
  RUTERO_CONFIRM_PLATFORM_OWNER_EMAIL="correo-del-dueno" npx tsx scripts/promote-platform-owner.ts "correo-del-dueno"
  ```

  El valor de confirmacion debe coincidir con el correo objetivo. El script no crea cuentas ni cambia contrasenas; el usuario debe cerrar e iniciar sesion otra vez.
- Si la base esta vacia y no hay registro publico, crear el primer dueno de plataforma con:

  ```bash
  RUTERO_OWNER_EMAIL="correo-del-dueno" \
  RUTERO_OWNER_NAME="Nombre del dueno" \
  RUTERO_OWNER_PASSWORD="Contrasena-segura-123" \
  RUTERO_CONFIRM_BOOTSTRAP="CREATE_FIRST_PLATFORM_OWNER" \
  npx tsx scripts/bootstrap-platform-owner.ts
  ```

  El script falla si ya existe un `SUPER_ADMIN` activo o si el correo ya existe.
- La base local `rutero` en `localhost` quedo sincronizada hasta `20260927067000_add_partner_payout_recorder`. En esta etapa pasaron `prisma validate`, generacion de Prisma Client, `tsc --noEmit`, ESLint enfocado, `npm run build` y `prisma migrate status`.
- El panel, el cierre del registro publico, el script de promocion y las migraciones siguen locales, sin commit ni despliegue. No promover la cuenta ni aplicar estas migraciones en produccion hasta preparar el despliegue y confirmar el correo ADMIN correcto.

## Estado de APK e implementacion web

- La APK version 1.2 usa `https://rutero.fr-host.fr/login?force=email` como URL inicial.
- El commit `3987b8a` desplego una proteccion adicional para que el login no redirija a PIN dentro de Capacitor. El usuario confirmo que el problema del modal/pantalla antigua sigue ocurriendo; esta incidencia NO debe marcarse como resuelta.
- La APK no se ha verificado en el telefono del usuario. Antes de cambiar el login otra vez, reproducir el arranque en la instalacion real y comprobar URL, almacenamiento del WebView, cache y version instalada.
- La VPS se actualizo a `3987b8a` y el servicio respondia, pero no asumir que esto corrigio el comportamiento del telefono.
- Los cambios recientes del flujo del cobrador se hicieron localmente despues de ese despliegue. No estan confirmados como desplegados.
- El panel de facturacion y el cierre del registro publico tambien son cambios locales; el despliegue anterior no los incluye.

## Ideas de mejora pendientes para Codex

El usuario eligio priorizar el flujo del cobrador; esa mejora ya se realizo. Las siguientes son recomendaciones para evaluar en trabajos futuros, no cambios autorizados automaticamente:

1. **Ruta y recaudos del cobrador:** seguir reduciendo pasos para visitar y registrar pagos; explorar orden de visita basado en GPS solo despues de definir como debe priorizarse atraso, proximidad y clientes ya pagados.
2. **Modo sin conexion:** permitir guardar recaudos sin internet y sincronizarlos al volver la conexion. Requiere diseno explicito de conflictos, idempotencia, confirmacion y conciliacion; no asumir que un pago se guardo en el servidor hasta confirmarlo.
3. **Reportes de administracion:** resumir cartera activa, cuotas vencidas, recaudo esperado/real y rendimiento por cobrador, respetando empresa, moneda y permisos.
4. **Controles y auditoria:** historial de cambios financieros y endurecimiento de la prevencion de cobros duplicados, con acciones correctivas auditables.
5. **Incidencia APK:** diagnosticar por separado porque la pantalla vieja sigue apareciendo en el dispositivo pese a los cambios web publicados. No declararla solucionada ni cambiar reglas de autenticacion sin reproducirla.

## Cambios locales no relacionados

Preservar cambios y archivos del usuario. En particular, se han visto:

```text
src/lib/cashbox-data.ts
docs/math-audit-rutero-vs-app-vieja.md
prompt 2.txt
tsconfig.tsbuildinfo
```

`AGENT_HANDOFF.md` fue solicitado por el usuario para orientar a Codex. Actualizarlo al cerrar futuras mejoras, preservando notas vigentes y distinguiendo cambios terminados de ideas pendientes. No revertir cambios del worktree ni mezclar archivos no relacionados sin permiso.

## Reglas para seguir trabajando

- No cambiar logica financiera sin pedir confirmacion.
- Cambios de interfaz como mostrar lo que falta de la cuota deben derivarse de los valores existentes y no alterar la persistencia ni las formulas de caja/prestamos/recaudos.
- Mantener funciones, rutas, permisos y server actions existentes.
- Si se rediseña, hacerlo desde componentes compartidos y CSS global antes que parchear cada pantalla.
- Revisar escritorio y movil; el cobrador usa principalmente telefono.
- Evitar datos demo visibles en produccion.
- No guardar secretos reales en git.

## Objetivo visual actual

El usuario pidio un rediseño visual completo:

- Identidad grafito, negro calido, blanco y naranja RUTERO.
- Quitar turquesa y acentos que compitan.
- Producto financiero/operativo sobrio, preciso y serio.
- Evitar landing generica, tarjetas de relleno, brillos y degradados llamativos.
- Mejorar login, navegacion, tablas, formularios, modales, estados vacios y experiencia movil del cobrador.
- Cambiar solo presentacion visual, sin tocar reglas de negocio.
