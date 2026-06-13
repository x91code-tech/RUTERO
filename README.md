# RUTERO

Base SaaS multiempresa para controlar rutas, ventas, recaudos, gastos, caja diaria, reportes e inventario para vendedores/cobradores en calle.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Zod
- PWA básica

## Instalación

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

En Windows PowerShell, si `npm` está bloqueado por la política de ejecución, usa:

```bash
npm.cmd install
npm.cmd run dev
```

## Despliegue en VPS

Después de hacer `git pull` en producción:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart rutero
```

## Variables de entorno

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rutero?schema=public"
NEXTAUTH_SECRET="cambia-este-secreto"
NEXTAUTH_URL="https://rutero.mooo.com"
NEXT_PUBLIC_APP_URL="https://rutero.mooo.com"
```

Dominio de prueba:

```text
https://rutero.mooo.com
```

Config Nginx sugerida:

```nginx
server {
    listen 80;
    server_name rutero.mooo.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Datos demo

Empresa: `RUTERO Demo`

Admin:

- Email: `admin@rutero.app`
- Password: `Admin123456`

Vendedor:

- Email: `vendedor@rutero.app`
- Password: `Vendedor123456`

Clientes demo: Carlos Pérez, María González, José Ramírez, Ana Torres y Luis Fernández.

Rutas demo: Ruta Centro, Ruta Norte y Ruta Sur.

El seed crea estos usuarios en PostgreSQL con contraseñas hasheadas. El login y el registro de empresa usan Prisma, cookies httpOnly y la tabla `Session`.

## Módulos incluidos

- Landing, login y registro de empresa
- Dashboard administrador
- Dashboard vendedor
- Clientes y perfil de cliente
- Rutas del día
- Ventas, recaudos y gastos
- Caja diaria y cierre
- Reporte diario para WhatsApp
- Reportes administrativos
- Inventario básico
- Usuarios, permisos y configuración
- Prisma schema completo con auditoría y multiempresa
- Configuración de país, moneda, formato regional y zona horaria por empresa
- Documentos de cliente según país
- Dos ubicaciones GPS por cliente, incluyendo ubicación tienda
- Seed de ejemplo
- Manifest PWA, service worker y pantalla sin conexión

## Próximos pasos recomendados

1. Conectar los formularios a Prisma usando las server actions.
2. Agregar autenticación real con sesiones seguras.
3. Implementar cola offline con IndexedDB.
4. Activar PDF/Excel con librerías dedicadas.
5. Agregar pruebas unitarias para caja, permisos y reportes.

Ver también: `docs/production-readiness.md`.
