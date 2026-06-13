# Cuándo RUTERO deja de ser demo

RUTERO deja de ser demo cuando los flujos principales dejan de depender de datos estáticos y pasan a operar contra usuarios, permisos y base de datos reales.

## Ya existe como base

- UI completa de administración, vendedor, clientes, rutas, caja, reportes e inventario.
- Prisma schema multiempresa.
- Seed con usuarios y datos demo.
- Cálculos reales de caja.
- Validaciones Zod.
- Permisos base por rol.
- GPS por cliente en el modelo.
- Generación de ruta visitable con Google Maps.
- Orden sugerido de visita por distancia.

## Falta para producción real

- Autenticación real con sesiones seguras.
- Conectar formularios a Prisma.
- Persistir ventas, recaudos, gastos, clientes, ubicaciones y cierres.
- Auditoría real en cada acción crítica.
- Mapas embebidos con proveedor elegido: Google Maps, Mapbox u OSRM.
- Optimización avanzada de rutas con tráfico, horarios y prioridades.
- Cola offline con IndexedDB y sincronización.
- Permisos aplicados en servidor, no solo en UI.
- Pruebas automatizadas de caja, permisos y rutas.

## GPS y rutas

La primera versión usa coordenadas guardadas en el cliente y genera una URL de navegación para Google Maps con origen, destino y paradas intermedias.

Para una optimización más potente se recomienda:

- Google Routes API si se prioriza tráfico y facilidad comercial.
- Mapbox Optimization API si se quiere buena experiencia visual y control.
- OSRM si se quiere una opción más económica/autohospedable.

La app ya tiene el helper `optimizeVisitOrder` como primera aproximación local por distancia.
