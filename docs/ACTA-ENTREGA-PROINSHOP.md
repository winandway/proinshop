# Acta de entrega — Proinshop igual a Treinta

> 21 de octubre de 2026. Versión publicada en proinshop.com: la del commit
> cf546bd. Este documento dice qué tiene Proinshop frente a Treinta, cómo se
> comprobó cada cosa y en qué estado está la base de datos en producción.
> La evidencia de cada corrida está en `docs/verificacion/`.

## Veredicto

✅ **Proinshop tiene todas las herramientas de Treinta que usa un negocio como
este, y además la tienda en línea conectada.** Todo se probó de punta a punta
sobre una base nueva y vacía, y el sitio en vivo está sano.

| Prueba | Resultado |
|---|---|
| Prueba de aceptación (el primer día del dueño, completo) | ✅ 45 de 45 |
| Entrar con huella o cara (con lector de huella simulado) | ✅ 6 de 6 |
| Vender sin señal y envío al volver la señal | ✅ 10 de 10 |
| Pruebas automáticas de la lógica | ✅ 71 de 71 |
| Sitio en vivo: páginas, guías, íconos, manifiestos | ✅ 39 de 39 responden |
| Sitio en vivo abierto en un celular de prueba | ✅ cero errores |
| Base de datos en producción | ✅ conectada, escribe, 24 tablas completas |
| Seguridad: claves filtradas en el código | ✅ ninguna |
| Seguridad: fallos conocidos en las librerías | ✅ cero |

## La base de datos en producción

Comprobado en vivo con proinshop.com/estado (copia en
`docs/verificacion/2026-10-21-estado-en-vivo.json`):

- ✅ **Conectada**: lee categorías, productos y pedidos.
- ✅ **Escribe**: guarda un latido y lo vuelve a leer en cada revisión.
- ✅ **Esquema completo**: las 24 tablas y todas las columnas nuevas existen.
  Se crearon solas al publicar: no hizo falta tocar nada a mano.
- ✅ **Almacenamiento de fotos** conectado.

Si algún día algo de esto falla, esa misma dirección responde «error» y lo dice.

## Treinta contra Proinshop, función por función

| Lo que hace Treinta | Proinshop | Cómo se comprobó |
|---|---|---|
| Vender en segundos, buscando o escaneando | ✅ | Venta simple con recibo |
| Colores y tallas al vender | ✅ | Moto en color Negro, con su stock aparte |
| Servicios sin inventario | ✅ | Instalación vendida con stock cero |
| No vender más de lo que hay | ✅ | Bloquea al pasar el stock |
| Pago mixto y fiado parcial | ✅ | 400 en efectivo + 600 fiado, deuda creada |
| Comprobante por WhatsApp, correo, impreso o PDF | ✅ | Recibo de cada venta |
| Anular una venta | ✅ | Queda anulada y el stock vuelve |
| Abrir y cerrar caja | ✅ | Abrió con 100, cerró exacto en 869 |
| Gastos y proveedores | ✅ | Ya existía; sigue igual |
| Compras con costo promedio | ✅ | 2 a 95 + 10 a 110 = costo 107,50 |
| Alertas de stock bajo | ✅ | Mínimo por producto y general |
| Conteo de inventario | ✅ | Ajusta a lo contado |
| Edición masiva | ✅ | +10 % de precio: 640 pasa a 704 |
| Cargar y bajar el inventario en Excel | ✅ | 5 productos cargados; descarga correcta |
| Ordenar por más vendidos | ✅ | En el inventario |
| Clientes con historial y notas | ✅ | Ficha con compras y deuda |
| Fiado y abonos | ✅ | Debía 600, abonó 200, debe 400 |
| Cotización que se vuelve venta | ✅ | Convertida con un toque |
| Reportes con filtros, comparación y descarga | ✅ | Con «sube / baja frente a antes» |
| Equipo con permisos por persona | ✅ | El vendedor no ve el balance ni Reportes |
| Actividad del equipo en tiempo real | ✅ | El dueño ve la venta del vendedor |
| Avisos al celular | ✅ | Pedidos y equipo, aunque el panel esté cerrado (ver nota) |
| Dos monedas con la tasa del día | ✅ | Tasa 40: una venta de 89 sale también en 3560 |
| Entrar con huella o cara | ✅ | 6 de 6 |
| Funcionar sin señal | ✅ | Abre, vende y envía al volver la señal, sin duplicar |
| App en el celular | ✅ | Se instala desde el navegador, con su ícono |
| Ayuda y recorrido de bienvenida | ✅ | 22 guías en Docs y primeros pasos en el inicio |
| Catálogo para compartir | ✅ y más | Tienda en línea conectada: el pedido entra al panel y se vuelve venta |

## Lo que se arregló en esta revisión, de raíz

- **La tienda se habría caído con más de cien productos.** La base de la nube
  no acepta más de cien valores por consulta y el catálogo los pedía todos
  juntos. Ahora todo va por trozos, con su prueba. Candado C-POR-TROZOS.
- **Los avisos no le habrían llegado a los iPhone** con la primera librería
  que se probó (formato viejo de cifrado). Se cambió por la que usa el formato
  actual, y la prueba descifra el aviso como un celular. Candado C-AVISOS.
- **La caja podía dar un efectivo esperado negativo** si una compra pagada por
  banco se marcaba como efectivo. Ahora lo avisa en la pantalla y la compra
  explica qué significa cada forma de pago.

## Nota honesta sobre los avisos al celular

El cifrado y la firma de los avisos están comprobados con una prueba que los
descifra igual que un celular. Lo único que no se puede hacer desde aquí es
ver el aviso llegar a un teléfono real, porque el navegador de pruebas no tiene
servicio de avisos. **Se comprueba en un minuto desde el celular del dueño:**
Mi cuenta → «Activar avisos en este celular» → «Mandarme un aviso de prueba».

## Lo que Treinta tiene y aquí no entra, y por qué

| Qué | Por qué |
|---|---|
| Factura electrónica | Depende del país del negocio y de un proveedor autorizado |
| Asistente con IA | Falta la clave del proveedor de IA |
| Recordatorios de cobro que salen solos | Necesitan un servicio de mensajes de WhatsApp pago. Hoy se recuerda con un toque por cliente |
| Varias tiendas | Proinshop es un solo negocio |
| Recetas | Es para restaurantes |
| Aparecer en Google Play | Falta la cuenta del negocio. Ya se instala desde el navegador |

## Para arrancar (lo hace el dueño)

1. Crear su cuenta en el panel (la primera cuenta es la del propietario).
2. Poner el WhatsApp de ventas en Mi tienda.
3. Borrar los 18 productos de muestra (Edición masiva → marcar → ⋮ → borrar)
   y cargar los suyos, a mano o con Excel.
4. Seguir la tarjeta «Primeros pasos» del inicio: se marca sola.
5. Instalar Proinshop en su celular y activar la huella y los avisos.

Todo explicado, paso a paso, en proinshop.com/docs.
