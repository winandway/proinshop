# Proinshop.com — Gestor de negocio + Tienda virtual

> Sistema tipo **Treinta** (contabilidad y gestión desde el celular) **fusionado con
> una tienda virtual propia**. Lo que el dueño registra en el gestor se publica solo
> en la tienda. Una sola acción alimenta tienda, inventario y contabilidad.

**Estado:** Etapa 1 — mockups listos para revisión del cliente.
**Fecha:** 28 de julio de 2026.

---

## 1. El problema que resuelve

El dueño usa hoy **Treinta** (Treinta, Inc.) para llevar la contabilidad del negocio.
Treinta le sirve, pero su catálogo virtual es de ellos: no se puede convertir en la
tienda propia de la marca, con dominio propio, banner, categorías y diseño de
Proinshop. Pidió fusionar las dos cosas y Treinta no lo aceptó.

**Solución:** construir su propia versión — misma sencillez, misma lógica contable a
la que ya está acostumbrado, pero con la tienda virtual integrada de verdad.

## 2. Idea central (lo que hay que entender del proyecto)

**No existe "cargar el producto en la tienda" como tarea aparte.**
Registrar el producto en el gestor *es* publicarlo.

```
📷 Foto con el celular
   → 🤖 La IA llena nombre, categoría, descripción (ES/EN) y precio sugerido
   → ✍️ El dueño revisa 3 datos (costo, precio, cantidad)
   → 🪄 Se recorta el fondo de la foto y se optimiza
   → 🚀 Publicar
        ├── 🏪 Queda en la tienda virtual (proinshop.com)
        ├── 📦 Queda en el inventario (stock y costo)
        └── 📊 Queda en la contabilidad (balance y ganancia real)
```

## 3. Identidad visual

| Elemento | Decisión |
|---|---|
| Colores | **Blanco + rojo** (el logo es rojo; el amarillo de Treinta choca y se descarta) |
| Rojo principal | `#FF2D2D` · Rojo oscuro `#D91414` |
| Tinta / texto | `#14161A` · Gris `#6E7480` · Fondo `#F3F4F7` |
| Apoyo | Verde `#0FA958` (éxito/stock) · WhatsApp `#25D366` |
| Logo | Diana de círculos concéntricos rojos + "PROINSHOP" en negro extra-bold |
| Estilo | Tarjetas redondeadas, tipografía pesada, mucho blanco — igual de simple que Treinta |

> **Pendiente:** el archivo original del logo (SVG o PNG en alta) para favicon,
> `icon.png`, `apple-icon.png` y la imagen OG de 1200×630. En los mockups está
> reconstruido en SVG.

## 4. Módulos

### App de administración (PWA — para el dueño)
| Módulo | Qué hace | Alimenta a |
|---|---|---|
| Ventas | Buscador + escáner de código de barras. Efectivo, transferencia, tarjeta, mixto o fiado. Comprobante PDF por WhatsApp. | Balance · Inventario · Por cobrar |
| Gastos | Monto, categoría, proveedor, método de pago, foto del recibo. | Balance · Estadísticas |
| Inventario | Foto, costo, precio, SKU, variantes (color/talla/potencia), alertas de bajo stock, compras a proveedor. | Tienda · Ventas · Balance |
| **Carga por foto con IA** | Cámara → ficha llena → publicado. Recorte de fondo y textos ES/EN. | Inventario · Tienda |
| Pedidos | Los pedidos de la web llegan con notificación; al confirmar se vuelven venta y descuentan stock. | Ventas · Inventario · Balance |
| Clientes y proveedores | Directorio con historial, saldo y WhatsApp directo. | Ventas · Por cobrar |
| Cuentas por cobrar | Fiado: saldo por cliente, abonos parciales, recordatorio de pago. | Balance |
| Cotizaciones | PDF con logo por WhatsApp; si el cliente acepta, se convierte en venta. | Ventas |
| Estadísticas y reportes | Ventas, ganancia real, top productos, ventas por canal y por día. Excel y PDF. | — |
| Empleados | Roles y permisos: quién vende, quién ve la ganancia, quién carga productos. | Todo |
| Mi tienda | Banner, categorías destacadas, WhatsApp de ventas, pagos, envíos, idiomas. | Tienda |

### Tienda virtual (pública — para el cliente final)
Portada con **banner animado** (3 mensajes en rotación), categorías de importación,
lo más vendido, ficha de producto con variantes y existencias reales, carrito,
checkout y seguimiento del pedido. Compra por carrito **o** directo por WhatsApp.

**Categorías propuestas:** plantas eléctricas, motos, bicicletas, carros,
herramientas, repuestos. *(A confirmar con el dueño.)*

## 5. Reglas que aplican a este proyecto

- **Bilingüe ES/EN** en toda la tienda, con selector de banderas arriba. Cada producto
  guarda nombre y descripción en los dos idiomas (la IA genera ambos). Respaldo al
  español si falta la traducción.
- **PWA 100%**: instalable en la pantalla de inicio, pantalla completa, funciona sin
  señal y sincroniza al reconectar.
- **Pie de página**: `© 2026 proinshop.com | All rights reserved. Developed by Windoce LLC`
  con enlace a windoce.com en pestaña nueva. Ya incluido en los mockups.
- **Favicon y tarjeta social** propios desde el primer despliegue (nada del icono de Next).
- **Botón de eliminar** siempre dentro del menú de 3 puntos, nunca a la vista.
- **Sin datos de prueba** en el producto final. Los del mockup son ilustrativos
  (teléfonos en el rango ficticio 555, nombres de tipo de negocio genéricos).

## 6. Arquitectura

| Pieza | Decisión |
|---|---|
| Framework | **Next.js 16** (última 16.x), App Router, React Server Components |
| Hosting | **YaDominios Cloud** — repo público en GitHub + rama `yapanel-build` con la Action oficial que empaqueta en un solo `_worker.js` |
| Dominio | proinshop.com (mientras tanto `proinshop.sitios.dev`) |
| Base de datos | **D1** (`env.DB`): productos, variantes, stock, ventas, gastos, clientes, proveedores, deudas, abonos, cotizaciones, pedidos, usuarios |
| Archivos | **R2** (`env.BUCKET`): foto original + versión optimizada con fondo recortado, servida por CDN |
| Rutas de API | **NO usar `/api/`** (choca con los estáticos). Usar `/datos`, `/media`, `/upload` |
| Sesión | Cookie firmada; roles dueño / vendedor / bodega |

### Modelo de datos (borrador)
```
negocio(id, nombre, moneda, whatsapp, idioma_default)
usuario(id, negocio_id, nombre, rol, pin_hash)
categoria(id, nombre_es, nombre_en, orden, visible)
producto(id, categoria_id, nombre_es, nombre_en, desc_es, desc_en, sku,
         costo, precio, publicado, destacado, creado_por_ia)
variante(id, producto_id, nombre, stock, precio_delta, sku)
foto(id, producto_id, r2_key_original, r2_key_web, orden)
venta(id, fecha, canal[local|web], metodo_pago, total, cliente_id, estado_pago)
venta_item(id, venta_id, variante_id, cantidad, precio_unit, costo_unit)
gasto(id, fecha, categoria, proveedor_id, monto, metodo_pago, recibo_r2_key)
cliente(id, nombre, telefono, correo, direccion)
deuda(id, cliente_id, venta_id, saldo, vence)
abono(id, deuda_id, fecha, monto, metodo_pago)
cotizacion(id, cliente_id, estado, total, vence, token_publico)
pedido(id, cliente_datos_json, estado, total, envio, venta_id)
```

## 7. Etapas

| Etapa | Contenido | Estado |
|---|---|---|
| 1 | **Mockups** (`mockups/index.html`) — 18 pantallas del gestor, 6 de la tienda móvil, tienda de escritorio, flujo y alcance | ✅ Listo |
| 2 | **Tienda virtual en Next.js 16** — portada con banner animado, categorías, catálogo con buscador y orden, ficha de producto con variantes, carrito, checkout y seguimiento del pedido. Bilingüe ES/EN, PWA, favicon y tarjeta social propios | ✅ Listo (local) |
| 3 | App PWA de administración: inventario, carga por foto con IA, ventas, gastos, pedidos, clientes, deudas, cotizaciones, estadísticas. Conexión real a D1 y R2 | Siguiente |
| 4 | Dominio, pruebas en celular real, carga del catálogo inicial, capacitación | — |

### Qué quedó construido en la Etapa 2

```
src/app/          rutas: / · /catalogo · /categoria/[slug] · /producto/[slug]
                         /carrito · /checkout · /pedido/[numero]
                  icon.tsx · apple-icon.tsx · opengraph-image.tsx · manifest.ts
src/componentes/  Encabezado · PieDePagina · Banner · TarjetaProducto
                  CompraProducto · VistaCarrito · FormularioCheckout
                  SeguimientoPedido · SelectorIdioma · Buscador · Logo
src/lib/          catalogo.ts (acceso a datos) · i18n.ts (ES/EN) · tipos.ts
                  almacen-carrito.ts · config.ts · catalogo-desarrollo.ts
db/schema.sql     modelo completo para D1
mockups/          prototipo para el cliente
```

**Pendiente de la Etapa 2, a propósito:** no se creó nada en la nube (repo de
GitHub, D1, R2, sitio en YaDominios Cloud). Requiere autorización del usuario.

## 8. Pendientes por confirmar con el dueño

1. Archivo original del logo (vector o PNG en alta).
2. Número de WhatsApp de ventas.
3. Métodos de pago que acepta (transferencia, tarjeta, contra entrega).
4. ¿Precios visibles al público o "consultar precio" para el mayoreo?
5. Categorías reales del catálogo (las del mockup son propuesta).
6. ¿Maneja envíos propios, transportadora, o solo retiro en el local?

---

## Cómo ver los mockups

Abrir `mockups/index.html` en cualquier navegador. Cinco pestañas arriba:
app de administración · flujo de la foto · tienda en celular · tienda en escritorio ·
alcance técnico. El banner y el selector de idioma son funcionales.

Para pasárselo al dueño se publica en YaDominios Cloud (queda en
`proinshop.sitios.dev` o una ruta del dominio del proyecto).
