# Proinshop frente a Treinta

> Para Richard. Fecha: 19 de octubre de 2026.
> Qué hace Treinta, qué hace Proinshop, qué le falta a Proinshop para ser igual
> de funcional, qué va gratis y qué se cobra, y cómo se llevaría a las tiendas
> de Google y Apple.

---

## 1. Cómo se hizo

La idea era abrir la app de Treinta con la herramienta de ingeniería inversa.
No se pudo por dos razones, y conviene que así sea:

- **No hay ningún Android conectado** a la computadora, y bajar el instalador
  de Treinta desde páginas que no son Google Play es bajar un archivo de una
  fuente no confiable.
- **Queremos sus funciones, no su código.** Lo que hace la app se ve desde
  afuera. Copiar código de Treinta expondría al cliente a un reclamo legal y no
  aporta nada: Proinshop ya tiene su propio código.

Se armó con lo que Treinta publica de sí misma: su ficha en Google Play, su
ficha en la App Store con el historial de novedades por versión, su sitio y su
página de funcionalidades, y las capturas de su app que Richard mandó al
arrancar el proyecto. Las fuentes están al final.

**Treinta en números:** más de 10 millones de descargas, 4,3 estrellas con
106 mil opiniones, actualizada el 9 de octubre de 2026. Cobra suscripción: plan
Esencial (solo app) y plan Pro (app y computadora), con descuento trimestral y
anual.

---

## 2. Comparación, función por función

✅ Proinshop ya lo tiene · 🟡 lo tiene a medias · ❌ no lo tiene

### Ventas

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Registrar venta en segundos | ✅ | — |
| Efectivo, transferencia, tarjeta, fiado | ✅ | — |
| **Pago mixto** (parte en efectivo, parte por transferencia) | ❌ | Dividir el pago de una venta en dos o más métodos |
| Comprobante por WhatsApp | ✅ | — |
| Comprobante por correo o impreso / PDF | ❌ | PDF con logo para descargar, imprimir o mandar |
| Notas personalizadas en el comprobante | ❌ | Una línea de texto libre en el comprobante |
| Vender con lector de código de barras | 🟡 | El producto ya guarda su código y el inventario lo busca; falta escanear con la cámara y vender así |
| Bloquear la venta cuando no hay stock | ✅ | — |
| Elegir color o talla al vender | 🟡 | Las variantes existen en el producto y en la tienda; falta elegirlas en la pantalla de Vender |
| **Caja: abrir y cerrar caja** | ❌ | Abrir con un monto, cerrar y cuadrar por método de pago |

### Gastos y proveedores

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Registrar gastos por categoría | ✅ | — |
| Foto del recibo | ✅ | — |
| Directorio de proveedores | ✅ | — |
| **Compras a proveedor / órdenes de compra** que suman stock | ❌ | La base está lista; falta la pantalla |
| **Costo ponderado** del inventario | ❌ | Al comprar a otro precio, recalcular el costo promedio |

### Inventario

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Stock en tiempo real | ✅ | — |
| Variantes (tallas, colores, presentaciones) | ✅ | — |
| Historial de stock (ventas, ajustes, compras) | ✅ | — |
| **Alertas de stock bajo** | ❌ | El campo de mínimo existe en la base pero nada lo usa |
| **Conteo de inventario** (lo que hay en la bodega contra lo registrado) | ❌ | Contar, comparar y ajustar de una vez |
| **Edición masiva** de productos | ❌ | Cambiar precio o categoría a muchos a la vez |
| Carga con plantilla de Excel | ❌ | Subir muchos productos de una sola vez |
| **Crear producto desde una foto con IA** | ❌ | Ya estaba en el alcance; falta la clave de la IA |
| Mejorar la foto con IA (fondo limpio) | ❌ | Ya estaba en el alcance (recorte de fondo) |
| Ordenar por más vendidos | ❌ | Un orden más en el inventario |
| Productos **y servicios** (sin stock) | ❌ | Proinshop vende productos físicos; no es urgente |

### Clientes, deudas y cotizaciones

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Directorio de clientes | ✅ | Ya muestra compras, total gastado y deuda |
| Historial de compras por cliente | 🟡 | Ver la lista de lo que compró cada uno |
| Fiado y abonos | ✅ | — |
| Recordatorio de cobro por WhatsApp | ✅ | Hoy es manual, con un toque |
| **Recordatorios de cobro automáticos** | ❌ | Que salgan solos al vencer |
| Cotizaciones que se envían al cliente | ✅ | Con enlace propio |
| Cotización aceptada → venta | ❌ | Ya estaba en el alcance |

### Estadísticas y reportes

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Ingresos, egresos y ganancia | ✅ | — |
| Más vendidos, ventas por día y por canal | ✅ | — |
| Comparar entre fechas | 🟡 | Hoy compara 15 días contra los 15 anteriores; falta elegir fechas |
| **Filtrar por empleado, método de pago o producto** | ❌ | — |
| **Descargar reportes** (Excel y PDF) | ❌ | Ya estaba en el alcance |

### Equipo y cuenta

| Función de Treinta | Proinshop | Qué falta |
|---|---|---|
| Invitar empleados, cada uno con su usuario | ✅ | — |
| Roles: quién vende, quién ve la ganancia, quién carga productos | ✅ | Tres roles fijos: Propietario, Bodega, Vendedor |
| **Permisos por módulo, a la medida** | ❌ | Prender y apagar cada pantalla por persona |
| **Avisos en tiempo real de lo que hacen los empleados** | ❌ | — |
| Entrar con huella o cara | ❌ | — |
| **Dólares y moneda local** (tasa del día) | ❌ | Treinta lo hizo para Venezuela |
| **Varias tiendas** (selector de tiendas) | ❌ | — |
| **Factura electrónica** | ❌ | Depende del país del negocio y de un proveedor autorizado |
| Recetas para restaurantes | ❌ | No aplica a Proinshop |
| Asistente con IA ("¿cuánto vendí hoy?", registrar ventas desde un chat) | ❌ | — |
| Tutorial y recorrido de bienvenida | ❌ | Se cubre con Docs (pendiente) |
| App en Google Play y App Store | ❌ | Proinshop se instala desde el navegador; ver la sección 5 |
| Funcionar sin señal | ❌ | Ya estaba prometido (PWA completa) |

### Catálogo y tienda en línea

| Función de Treinta | Proinshop |
|---|---|
| Catálogo virtual para compartir por WhatsApp | ✅ y **mucho más** |

Aquí Proinshop va **por delante**, y fue la razón del proyecto: Treinta no
quiso integrar su catálogo con la tienda de la marca.

---

## 3. Lo que Proinshop tiene y Treinta no

- **Tienda propia con su dominio**, su banner, sus categorías y su diseño, no
  un catálogo dentro de la marca Treinta.
- **Carrito, pedido y seguimiento del pedido** para el cliente final, con el
  color o la talla elegidos.
- **El pedido de la tienda se vuelve venta con un toque**, descuenta el stock y
  suma al balance. Cancelarlo devuelve todo.
- **Español e inglés** en toda la tienda, producto por producto.
- **Ningún formulario pierde lo escrito.**
- **Precios con punto de miles** bien leídos, fotos del celular achicadas solas.
- **Sin suscripción mensual a un tercero**: el negocio es dueño de su sistema y
  de sus datos.

---

## 4. Qué va gratis y qué se cobra

La pregunta para separar es una sola: **¿esto ya se lo habíamos vendido?** El
alcance vendido está en PROYECTO.md.

### Va GRATIS (estaba en el alcance o es regla nuestra)

| Qué | Por qué es gratis |
|---|---|
| Pago mixto | El alcance dice «efectivo, transferencia, tarjeta, mixto o fiado» |
| Escáner de código de barras con la cámara | El alcance dice «buscador + escáner» |
| Comprobante y cotización en PDF con logo | El alcance dice «comprobante PDF» y «PDF con logo» |
| Notas en el comprobante | Es parte del comprobante; ante la duda, gratis |
| Elegir color o talla al vender | Las variantes ya se vendieron |
| Compras a proveedor, con costo ponderado | El alcance dice «compras a proveedor»; el costo bien calculado es lo que hace confiable la ganancia |
| Alertas de stock bajo | El alcance dice «alertas de bajo stock» |
| Crear producto desde una foto con IA, con fondo recortado | Es la idea central del proyecto |
| Aviso de pedido nuevo | El alcance dice «llegan con notificación» |
| Historial de compras por cliente | El alcance dice «directorio con historial» |
| Cotización aceptada → venta | El alcance lo dice |
| Reportes en Excel y PDF | El alcance lo dice |
| Funcionar sin señal | Se prometió PWA completa |
| Banner editable desde Mi tienda | El alcance lo dice |
| Docs y recorrido de bienvenida | Regla nuestra |

### SE COBRA (no existía y le suma al negocio)

Rangos sugeridos; el precio final lo decides tú. Se suman a los cuatro que ya
estaban en el documento de lanzamiento (cobro con tarjeta en línea, importar
datos de Treinta, correos automáticos y envíos por zona).

| Mejora | Beneficio para el dueño | Rango sugerido |
|---|---|---|
| **Caja: abrir, cerrar y cuadrar** | Sabe al final del día si falta o sobra plata, por método de pago | 150 a 250 dólares |
| **Conteo de inventario** | Encuentra pérdidas y robos comparando la bodega con el sistema | 120 a 200 dólares |
| **Edición masiva y carga por Excel** | Cambia cien precios en un minuto; sube su catálogo de una vez | 150 a 300 dólares |
| **Filtros de reportes** (por empleado, método, producto y fechas) | Ve quién vende más y qué se mueve | 100 a 200 dólares |
| **Permisos por módulo a la medida** | Decide pantalla por pantalla qué ve cada empleado | 150 a 250 dólares |
| **Avisos de lo que hacen los empleados** | Se entera en el momento de cada venta, ajuste o anulación | 100 a 200 dólares |
| **Recordatorios de cobro automáticos** | Cobra sin tener que acordarse; más el costo de los mensajes | 150 a 300 dólares |
| **Dólares y moneda local** | Vende en las dos monedas con la tasa del día | 150 a 250 dólares |
| **Varias tiendas** | Cada sucursal con su inventario y sus números, todo en un panel | 500 a 900 dólares |
| **Factura electrónica** | Factura legal según su país; más lo que cobre el proveedor autorizado | 400 a 900 dólares |
| **Asistente con IA** en el panel | Pregunta en palabras y el sistema responde o registra; más el consumo de IA, prepago | 300 a 600 dólares |
| **Entrar con huella o cara** | Entra al panel sin escribir la contraseña | 100 a 200 dólares |
| **App en Google Play** | El negocio aparece en la tienda de Android con su nombre | 300 a 500 dólares |
| **App en la App Store** | Igual en iPhone; exige funciones nativas (ver abajo) | 600 a 1.200 dólares |

Las cuentas de desarrollador van **a nombre del negocio** y las paga el cliente:
Google cobra 25 dólares una sola vez y Apple 99 dólares al año.

No se recomiendan: recetas (Proinshop no es restaurante) y servicios sin stock
(vende productos físicos).

---

## 5. ¿Es difícil publicar en Google Play y App Store con Expo y EAS?

**Respuesta corta: publicar con EAS es fácil. Lo difícil es otra cosa.**

- **Expo y EAS sirven para apps escritas en React Native.** Proinshop está
  hecho como aplicación web. Usar Expo significaría **volver a escribir las
  treinta y tantas pantallas del panel** para el celular: semanas de trabajo, y
  dos versiones que mantener para siempre.
- EAS en sí no es el problema: compila en la nube y sube a las tiendas. Su plan
  gratis da 15 compilaciones de Android y 15 de iPhone al mes; el pago empieza
  en 19 dólares al mes.

**Lo que se recomienda en su lugar:**

1. **Android ahora, envolviendo la misma app.** Google acepta las aplicaciones
   web instalables metidas en un envoltorio oficial (se llama «actividad web de
   confianza»; las herramientas son PWABuilder y Bubblewrap). Es la misma app de
   siempre, así que cada mejora que publicamos llega sola, sin volver a subir
   nada a la tienda. Trabajo: uno o dos días, más la revisión de Google.
   - Ojo: una cuenta de Google **personal** nueva tiene que hacer una prueba
     cerrada con **12 personas durante 14 días** antes de poder publicar. Una
     cuenta **de empresa** (con número D-U-N-S) se salta ese paso. Por eso
     conviene abrirla a nombre del negocio.
2. **iPhone después, cuando la app tenga funciones nativas.** Apple rechaza las
   apps que son solo la página web metida en una caja (su regla 4.2, «funcionalidad
   mínima»). Para pasar hace falta lo que una página no hace: funcionar sin
   señal, avisos al celular y el escáner con la cámara. Eso ya está en la lista
   de lo gratis. Con eso listo, se envuelve con Capacitor (que deja usar la
   cámara y los avisos nativos sin reescribir las pantallas) y se manda a Apple.

**Resumen:** Android es fácil y rápido. iPhone es posible, pero primero hay que
terminar sin señal, avisos y escáner, porque Apple revisa a mano y rechaza lo
que se ve como una página web.

---

## Estado al 21 de octubre de 2026: igualado y verificado

Richard pidió igualar Proinshop con Treinta, porque al cliente se le vendió
como igual. Se hizo de corrido y se publicó. Ya está en Proinshop:

| De Treinta | En Proinshop |
|---|---|
| Vender buscando o escaneando, colores y tallas, servicios | Sí |
| Pago mixto y fiado parcial | Sí |
| Comprobante para imprimir, PDF, WhatsApp y correo | Sí |
| Anular una venta devolviendo el inventario | Sí |
| Caja: abrir, cerrar y cuadrar | Sí |
| Compras a proveedores con costo promedio | Sí |
| Alertas de stock bajo | Sí |
| Conteo de inventario | Sí |
| Edición masiva y Excel de ida y vuelta | Sí |
| Ficha del cliente, mejores clientes, cobros vencidos | Sí |
| Cotización que se vuelve venta | Sí |
| Reportes con filtros y descarga | Sí |
| Permisos por persona y por módulo | Sí |
| Actividad del equipo y avisos en vivo | Sí |
| Dos monedas con la tasa del día | Sí |
| Entrar con huella o cara | Sí |
| Funcionar sin señal | Sí: abre y vende; las ventas se envían solas al volver la señal |
| Ayuda dentro de la app | Sí: Docs con 22 guías en español e inglés, y primeros pasos en el inicio |
| Avisos al celular | Sí: pedidos nuevos y lo que hace el equipo, aunque el panel esté cerrado |
| App en el celular | Sí: se instala desde el navegador con su ícono; Google Play cuando haya cuenta |
| Comparar entre fechas | Sí: cada número contra el período anterior |

Verificado el 21 de octubre con la prueba de aceptación (45 de 45 en verde sobre
una base nueva), la de huella, la de sin señal y 71 pruebas automáticas. Acta en
docs/ACTA-ENTREGA-PROINSHOP.md.

Lo que Treinta tiene y Proinshop no, y por qué: factura electrónica (depende del
país y de un proveedor autorizado), asistente con IA (falta la clave),
recordatorios de cobro que salen solos por WhatsApp (necesitan un servicio de
mensajes pago; hoy es con un toque por cliente), varias tiendas (Proinshop es un
solo negocio) y recetas (no es restaurante). Detalle en PENDIENTES.md.

## 6. Fuentes

- Ficha de Treinta en Google Play: https://play.google.com/store/apps/details?id=com.treintaapp&hl=es_US
- Ficha de Treinta en la App Store, con novedades por versión: https://apps.apple.com/MX/app/id1644703591
- Sitio de Treinta: https://treinta.co
- Funcionalidades de Treinta: https://www.treinta.co/funcionalidades
- Planes de Treinta (agregador): https://www.capterra.co.uk/software/1099976/Treinta
- Precios de Expo y EAS: https://expo.dev/pricing
- Regla de 12 testers de Google Play (resúmenes de terceros): https://www.testerscommunity.com/guides/how-many-testers-do-you-need-google-play y https://extendsclass.com/blog/google-plays-closed-testing-requirement-what-developers-need-to-know-in-2026
- Rechazo por la regla 4.2 de Apple (foro de Apple): https://developer.apple.com/forums/thread/82714
- PWABuilder y Google Play: https://blog.pwabuilder.com/posts/microsoft-and-google-team-up-to-make-pwas-better-in-the-play-store
- Costos de cuentas de desarrollador (resumen de terceros): https://www.choicely.com/tutorials/how-much-does-it-cost-to-publish-an-app

Los datos de la regla de 12 testers y de las cuentas vienen de resúmenes de
terceros que coinciden entre sí; antes de abrir las cuentas se confirman en las
páginas oficiales de Google y de Apple.
