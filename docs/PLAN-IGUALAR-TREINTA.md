# Plan: igualar Proinshop con Treinta

> Pedido por Richard el 19 de octubre de 2026: la persona que va a usar
> Proinshop viene de Treinta y espera todas sus herramientas. Se hace de
> corrido, de principio a fin, y se publica al terminar.
> Base: docs/COMPARATIVA-TREINTA.md.
>
> **Estado: terminado y publicado el 19 de octubre de 2026.** Los veinte
> puntos están hechos. Cómo se comprueba cada uno: CANDADOS.md. Para el
> público: las guías de proinshop.com/docs.

## Fase 1 — Base

1. Esquema automático: las tablas y columnas nuevas se crean solas (no hay
   token de la base). Registro de actividad.
2. Permisos por módulo, persona por persona, aplicados en todas las pantallas
   y en el servidor.

## Fase 2 — Vender como en Treinta

3. Vender: buscar por nombre, código de barras o SKU en todo el catálogo;
   escáner con la cámara y con lector; color o talla; servicios sin stock;
   pago mixto; fiado parcial; nota; segunda moneda.
4. Comprobante para imprimir o guardar en PDF, y por correo. Anular una venta
   (tres puntos) devolviendo el stock.
5. Caja: abrir, cerrar y cuadrar por método de pago.

## Fase 3 — Inventario como en Treinta

6. Compras a proveedor con costo promedio.
7. Alertas de stock bajo: mínimo por producto y umbral general, filtro «Por
   agotarse» y aviso en el inicio.
8. Conteo de inventario: lo que hay en bodega contra lo registrado.
9. Edición masiva; importar y exportar Excel; ordenar por más vendidos;
   productos tipo servicio.

## Fase 4 — Clientes, deudas y cotizaciones

10. Ficha del cliente con su historial; editar; mejores clientes; cobros
    vencidos en el inicio.
11. Cotización aceptada → venta; cotización para imprimir.

## Fase 5 — Reportes y control

12. Reportes con filtros (fechas, empleado, método, producto) y descarga en
    Excel y PDF.
13. Actividad del equipo en tiempo real y aviso de pedido nuevo.
14. Dos monedas: la local con la tasa del día.

## Fase 6 — Lo que piden las reglas

15. Selector de idioma estilo Amazon.
16. Entrar con huella o cara (llaves de acceso).
17. Que la app abra sin señal.
18. Docs del panel en español e inglés.
19. Pruebas automáticas de la lógica y un solo comando que revisa todo.
20. Prueba completa, documentos, publicación y prueba de humo.

## Fuera de este plan, y por qué

| Qué | Por qué |
|---|---|
| Factura electrónica | Depende del país del negocio y de un proveedor autorizado |
| Crear productos con foto y asistente con IA | Falta la clave de la IA |
| Recordatorios de cobro automáticos por WhatsApp | Necesitan un servicio de mensajes pago |
| Escudo anti-robots | Faltan las claves |
| Apps en Google Play y App Store | Faltan las cuentas de desarrollador del negocio |
| Varias tiendas | Proinshop es un solo negocio; cambiaría toda la base |
| Recetas | Proinshop no es restaurante |
