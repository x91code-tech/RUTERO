# RUTERO - handoff para otro agente IA

## Estado Actual

Proyecto local:

```text
C:\Users\Administrador\Downloads\rutero
```

Repositorio:

```text
https://github.com/x91code-tech/RUTERO.git
```

Produccion actual:

```text
VPS: 191.252.200.113
Host: vps71519.publiccloud.com.br
URL: https://vps71519.publiccloud.com.br
Proyecto VPS: /var/www/rutero
PM2 app: rutero
Next.js: 127.0.0.1:3000 detras de Nginx
PostgreSQL: en la VPS
HTTPS/Certbot: configurado
```

No usar servidor/dominio viejo. No reinstalar VPS, no resetear DB, no borrar migraciones, no ejecutar seed en produccion.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma/PostgreSQL
- Tailwind CSS
- Zod
- bcryptjs
- Capacitor Android legacy WebView
- Nueva app nativa en progreso: `rutero-mobile/` con Expo/React Native

## Reglas Importantes

- No ejecutar `prisma migrate reset`.
- No ejecutar seed en produccion.
- No mostrar ni commitear secretos.
- Preservar `prompt 2.txt`; esta sin trackear y no debe entrar en commits.
- No cambiar formulas financieras sin validacion explicita.
- El backend web sigue siendo la fuente de verdad.
- La app nativa debe consumir `/api/mobile/*`, no pantallas web.

## Super Admin

El SUPER_ADMIN inicial ya fue creado manualmente con:

```bash
scripts/bootstrap-platform-owner.ts
```

No volver a ejecutarlo salvo confirmar que no existe ningun SUPER_ADMIN activo.

## Commits Recientes Importantes

```text
fb27b43 Add native mobile payment and cashbox flows
6fa3bdb Create native mobile app shell
ee9e33b Add mobile financial actions API
a546cfc Add mobile API foundation
80840b4 Clarify tenant user plan limits
b0c517e Use fetch login flow for WebView
```

`git status` al momento de este handoff solo tenia:

```text
?? prompt 2.txt
```

## Cambios Ya Hechos

### Limites de planes

Archivos:

- `src/server/actions/user-actions.ts`
- `src/server/actions/platform-actions.ts`
- `src/app/settings/page.tsx`
- `src/components/forms/user-form.tsx`

Estado:

- La creacion de usuarios valida plan inexistente, suscripcion inactiva, limite de usuarios y limite de cobradores.
- Se cuentan usuarios/cobradores activos, no inactivos.
- Configuracion muestra plan, usuarios activos usados/permitidos y cobradores activos usados/permitidos.
- Si se acaba cupo de cobradores, bloquea solo rol cobrador; si se acaba cupo general, bloquea crear usuarios.

Validado:

```bash
npx.cmd prisma validate
npm.cmd run lint
npm.cmd run build
```

### Login WebView/APK

Archivos relevantes:

- `src/app/api/auth/login/route.ts`
- `src/components/auth/login-form.tsx`
- `src/lib/auth-login.ts`
- `src/server/actions/auth-actions.ts`
- `src/components/pwa-register.tsx`
- `public/sw.js`

Estado:

- Login principal usa `fetch("/api/auth/login")` y luego `window.location.assign`.
- Se evito depender de Server Actions en el login del WebView.
- Service worker no debe registrarse dentro de Capacitor y limpia caches si esta en nativo.
- `public/sw.js` excluye `/_next`, `/api`, `sw.js`, `favicon`.
- Probado en LDPlayer: APK release abre login sin pantalla de excepcion.

APK Capacitor legacy:

```text
android/app/build/outputs/apk/release/app-release.apk
```

La app nativa nueva debe reemplazar gradualmente esta APK WebView para cobradores.

## API Movil Nueva

Archivos:

- `src/lib/session.ts`
- `src/lib/mobile-api.ts`
- `src/app/api/mobile/login/route.ts`
- `src/app/api/mobile/me/route.ts`
- `src/app/api/mobile/route/route.ts`
- `src/app/api/mobile/collections/route.ts`
- `src/app/api/mobile/expenses/route.ts`
- `src/app/api/mobile/cashbox/close/route.ts`

Endpoints:

```text
POST /api/mobile/login
GET  /api/mobile/me
GET  /api/mobile/route
POST /api/mobile/collections
POST /api/mobile/expenses
POST /api/mobile/cashbox/close
```

Autenticacion movil:

```http
Authorization: Bearer TOKEN
```

Sesion:

- Reutiliza tabla `Session`.
- `src/lib/session.ts` tiene:
  - `createSessionToken`
  - `getUserFromSessionToken`

Ruta movil devuelve empresa, cobrador, ruta, caja del dia, resumen y clientes con prestamo activo.

Acciones moviles:

- Recaudos aplican a prestamo y cliente usando `allocateLoanPayment`.
- Gastos/retiros/entradas exigen caja abierta.
- Cierre de caja usa `calculateDailySummary`, misma formula que la web.

Validado:

```bash
npm.cmd run lint
npx.cmd prisma validate
npm.cmd run build
```

## App Nativa Expo

Directorio:

```text
rutero-mobile/
```

Archivos principales:

- `rutero-mobile/package.json`
- `rutero-mobile/app.json`
- `rutero-mobile/App.tsx`
- `rutero-mobile/src/api.ts`
- `rutero-mobile/src/session.ts`
- `rutero-mobile/src/config.ts`
- `rutero-mobile/src/index.ts`
- `rutero-mobile/README.md`

Configuracion actual:

```text
apiBaseUrl: https://vps71519.publiccloud.com.br
android package: com.rutero.mobile
```

Funcionalidad implementada:

- Login PIN de cobrador.
- Login correo/contrasena para primera vinculacion.
- Token guardado en `expo-secure-store`.
- Identificador de dispositivo guardado en `expo-secure-store`.
- Pantalla de ruta con resumen, caja y lista de clientes.
- Acciones: cuota, adelanto, pago total, monto manual, gasto/retiro/entrada y cierre de caja.
- La sesion se persiste solo despues de validar `/api/mobile/me` y `/api/mobile/route`.
- Una sesion invalida se elimina del almacenamiento seguro.
- Pagos, movimientos y cierres mantienen el modal abierto cuando el API responde con error.
- El boton de cierre desaparece cuando la caja ya no esta abierta.
- `expo-asset` esta instalado; TypeScript y `expo export --platform android` pasan correctamente.
- Se genero `rutero-mobile/android/` con `expo prebuild --platform android --clean --no-install`; es generado e ignorado por Git.
- Se alinearon dependencias con Expo SDK 52 (`@expo/vector-icons 14.0.4`, `expo-secure-store 14.0.1`, `expo-status-bar 2.0.1`, `react-native 0.76.9`) en commit `11554ac`.
- La primera compilacion debug fallo antes de esa alineacion por mezclar `expo-font 57` con Expo 52. Repetir `android\\gradlew.bat :app:assembleDebug --no-daemon --console=plain` para verificar el resultado final.

Pendiente inmediato:

```powershell
cd C:\Users\Administrador\Downloads\rutero\rutero-mobile
npm run typecheck
npx expo export --platform android --clear
```

El siguiente paso es probar el login y la ruta en un emulador o dispositivo Android con credenciales reales. El intento de `expo prebuild --platform android` en este entorno no llego a crear `android/`; no forzarlo ni asumir que hubo un build Gradle. La APK Capacitor legacy conserva `com.rutero.app`; no cambiar su firma ni su package ID.

## Comandos Locales Web

Desde `C:\Users\Administrador\Downloads\rutero`:

```bash
npm.cmd install
npx.cmd prisma generate
npx.cmd prisma validate
npm.cmd run lint
npm.cmd run build
npm.cmd run dev -- -H 0.0.0.0 -p 3000
```

## Deploy Produccion

Cuando se decida subir backend web:

```bash
git push
```

En VPS:

```bash
cd /var/www/rutero
git pull --ff-only
npm ci
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run build
pm2 restart rutero
pm2 save
curl -I https://vps71519.publiccloud.com.br/login
pm2 logs rutero --err --lines 100 --nostream
```

No desplegar a produccion sin revisar `git status` y diff.

## Areas Financieras Sensibles

No alterar sin cuidado:

- `src/lib/cashbox-calculations.ts`
- `src/lib/loan-payments.ts`
- `src/server/actions/financial-actions.ts`
- `src/app/api/mobile/collections/route.ts`
- `src/app/api/mobile/cashbox/close/route.ts`

Reglas clave:

- Caja inicial viene de caja final anterior.
- Prestamos entregados bajan caja.
- Recaudos suben caja.
- Gastos/retiros bajan caja.
- Entradas suben caja.
- Cierre guarda `reportedCash` y eso arrastra al siguiente dia.

## Proximo Mejor Bloque

1. Instalar dependencias de `rutero-mobile`.
2. Ejecutar typecheck.
3. Corregir imports/tipos reales.
4. Ejecutar Expo en Android/emulador.
5. Probar login PIN, ruta, cuota, pago manual, gasto/retiro/entrada y cierre de caja.
6. Despues subir backend a GitHub/VPS.

## Producto

Direccion actual:

- Web: admin, plataforma, planes, reportes, configuracion.
- App nativa: cobradores/supervisores, ruta, recaudos, movimientos y caja.

Paleta buscada:

- grafito
- negro calido
- blanco
- naranja RUTERO

Evitar:

- turquesa
- tarjetas gigantes sin proposito
- sensacion de landing page
- interfaces tipo WebView para cobradores
