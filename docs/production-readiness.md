# Cuándo RUTERO deja de ser demo

RUTERO deja de ser demo cuando los flujos principales dejan de depender de datos estáticos y pasan a operar contra usuarios, permisos y base de datos reales.

## Ya existe como base

- UI completa de administración, vendedor, clientes, rutas, caja, reportes e inventario.
- Prisma schema multiempresa.
- Seed con usuarios y datos demo.
- Login y registro de empresa con PostgreSQL, bcrypt y cookies httpOnly.
- Tabla `Session` para sesiones persistentes.
- Cálculos reales de caja.
- Validaciones Zod.
- Permisos base por rol.
- GPS por cliente en el modelo.
- Dos ubicaciones por cliente: ubicación tienda y ubicación secundaria.
- Documentos del cliente según país de operación.
- Generación de ruta visitable con Google Maps.
- Orden sugerido de visita por distancia.

## Falta para producción real

- Conectar formularios a Prisma.
- Persistir ventas, recaudos, gastos, clientes, ubicaciones y cierres.
- Activar almacenamiento real de archivos para documentos: S3, Cloudflare R2, Supabase Storage o disco privado en VPS.
- Auditoría real en cada acción crítica.
- Mapas embebidos con proveedor elegido: Google Maps, Mapbox u OSRM.
- Optimización avanzada de rutas con tráfico, horarios y prioridades.
- Cola offline con IndexedDB y sincronización.
- Permisos aplicados en servidor, no solo en UI.
- Pruebas automatizadas de caja, permisos y rutas.

## Clientes, documentos y GPS

La primera versión usa coordenadas guardadas en el cliente y genera una URL de navegación para Google Maps con origen, destino y paradas intermedias. El punto principal de navegación debe ser `Ubicación tienda`.

Los documentos requeridos dependen del país de la empresa. Ejemplos:

- Venezuela: RIF, cédula del responsable y foto del local opcional.
- Colombia: NIT, cédula del responsable y cámara de comercio opcional.
- México: RFC, INE del responsable y constancia fiscal opcional.

Para una optimización más potente se recomienda:

- Google Routes API si se prioriza tráfico y facilidad comercial.
- Mapbox Optimization API si se quiere buena experiencia visual y control.
- OSRM si se quiere una opción más económica/autohospedable.

La app ya tiene el helper `optimizeVisitOrder` como primera aproximación local por distancia.
