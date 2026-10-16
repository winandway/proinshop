# Proinshop — Lanzamiento de la primera versión (MVP)

> Para Richard. Fecha: 16 de octubre de 2026.
> Qué se le entrega al dueño, cómo entra, cómo está conectado todo y qué falta
> para terminar. Lo que depende de ti está en [PENDIENTES.md](../PENDIENTES.md).

---

## 1. Cómo entra el dueño

**Dirección del panel:** https://proinshop.com/panel

**No existe una contraseña de "superadmin".** El sistema no trae ninguna cuenta
hecha. La primera persona que abre el panel crea la **cuenta de Propietario** y
elige su propia contraseña. Propietario es el permiso más alto: ve todo, cambia
todo e invita al resto.

| Paso | Quién | Qué pasa | Cómo se comprueba |
|---|---|---|---|
| 1 | **El dueño** | Abre el enlace, ve «Crea tu cuenta de propietario», pone su nombre, su correo y su contraseña (con el ojito para verla). | Entra directo a su panel y arriba ve su nombre con «Propietario». |
| 2 | **El dueño** | Explorar → Equipo → «Invitar» → rol **Propietario** → copia el enlace y te lo manda por WhatsApp. | Le aparece el enlace con «vence en 7 días». |
| 3 | **Tú** | Abres ese enlace y creas tu cuenta con un nombre que diga **Soporte** (por ejemplo «Soporte Windoce»). Si tu correo es de windoce.com, el sistema no te deja guardar sin esa palabra. | En Equipo, el dueño te ve como «Soporte Windoce · Propietario». |
| 4 | **El dueño** | Explorar → Mi tienda → WhatsApp de ventas, correo, dirección y costo del envío → Guardar. | Los botones verdes de la tienda abren su WhatsApp. El pie de la tienda muestra sus datos. |

**Por qué el dueño crea la suya y no nosotros:** su contraseña solo la sabe él.
Si un día la olvida, la cuenta de Soporte (que es Propietario) le genera un
enlace para estrenar otra, desde Equipo. Por eso la cuenta de Soporte tiene
que ser Propietario y no Vendedor.

> **Urgente:** mientras nadie cree la cuenta, el primero que abra el enlace se
> queda con el panel. Que el dueño la cree hoy.

### Lo que el dueño debe hacer primero

1. **Borrar o reemplazar los 18 productos de muestra.** Son los del prototipo,
   con precios inventados, y hoy están visibles en la tienda. Desde cada
   producto: tres puntos → Eliminar producto. (O decirme que los borre todos.)
2. **Poner sus categorías reales.** Inventario → Categorías → Editar: nombre en
   español, en inglés e ícono. Las que no use, «Ocultar en la tienda».
3. **Cargar sus productos.** Inventario → Crear producto: foto con la cámara,
   nombre, cantidad, precio, costo, categoría, descripción en los dos idiomas.
   «Destacar en la portada» lo pone en la sección principal.

---

## 2. Cómo está conectado todo

```
                         ┌──────────────────────────┐
  Cliente en la tienda   │  proinshop.com (tienda)  │   Dueño y empleados
  ─────────────────────▶ │  lee el catálogo         │ ◀──────────────────
                         └────────────┬─────────────┘    proinshop.com/panel
                                      │                  escribe en la misma base
                         ┌────────────▼─────────────┐
                         │  Base de datos del sitio │  productos, ventas, gastos,
                         │  (una sola, la misma)    │  clientes, deudas, pedidos,
                         └────────────┬─────────────┘  usuarios, sesiones
                                      │
                         ┌────────────▼─────────────┐
                         │  Almacenamiento de fotos │  fotos de productos (públicas)
                         └──────────────────────────┘  recibos de gastos (privados)
```

**Una sola acción alimenta todo.** Lo que el dueño carga en el panel ya está en
la tienda. No hay que «subirlo» aparte.

| Lo que pasa | Qué mueve |
|---|---|
| Crear producto (con «Mostrar en tienda») | Aparece en la tienda + entra al inventario con su costo + historial de stock |
| Cliente compra en la tienda | Llega a **Pedidos** del panel con el color o la talla que eligió |
| Dueño confirma el pedido | Se vuelve **venta**: baja el stock (también el de la variante), suma al balance, y el cliente queda en la libreta |
| Dueño cancela un pedido ya confirmado | La mercancía **vuelve** al inventario y la venta **sale** del balance |
| Venta en el local (Vender) | Baja el stock y suma al balance. Si es fiado, crea la deuda en **Cuentas por cobrar** |
| Abono de un cliente | Baja la deuda; si la cubre, la venta queda pagada |
| Gasto | Resta en el balance; la foto del recibo queda privada |
| Mi tienda | WhatsApp, envío, existencias y agotados: la tienda los respeta al instante |
| Equipo | Invitaciones con rol (Propietario, Vendedor, Bodega) y enlaces para recuperar la contraseña |

**Quién ve qué:**

| | Propietario | Bodega | Vendedor |
|---|---|---|---|
| Vender, pedidos, clientes, cotizaciones | ✅ | ✅ | ✅ |
| Inventario: ver precios y existencias | ✅ | ✅ | ✅ |
| Inventario: crear y editar productos, con su costo | ✅ | ✅ | ❌ |
| Ver balance y estadísticas | ✅ | ❌ | ❌ |
| Eliminar productos | ✅ | ❌ | ❌ |
| Mi tienda y Equipo | ✅ | ❌ | ❌ |

**Cómo se publica:** cada cambio que se sube a GitHub se compila solo y queda
en vivo en proinshop.com en unos cuatro minutos. Eso lo hago yo.

**Cómo se cobra hoy:** la tienda **no cobra en línea**. Toma el pedido con el
método que el cliente prefiere (transferencia, tarjeta o pago al recibir) y el
dueño le escribe por WhatsApp para coordinar el pago y la entrega. No hay dinero
pasando por la página, así que no hay un circuito de cobro que pueda fallar.

---

## 3. Revisión: lo que funciona ✅

Probado hoy en el mismo motor de la nube, con una base limpia.

**Tienda**
- ✅ Portada, catálogo, buscador, categorías, ficha del producto con fotos, variantes y ficha técnica
- ✅ Español e inglés, con respaldo al español si falta la traducción
- ✅ Carrito, pedido y seguimiento del pedido desde cualquier celular
- ✅ El pedido guarda el color o la talla elegidos y cobra su recargo *(arreglado hoy)*
- ✅ Los precios y el envío salen siempre de la base, nunca del navegador *(el envío, arreglado hoy)*
- ✅ Solo se puede pedir lo que está publicado *(arreglado hoy)*
- ✅ Si no hay destacados, la portada muestra lo último cargado *(arreglado hoy)*
- ✅ Las categorías sin productos no salen en los menús *(arreglado hoy)*
- ✅ Tarjeta bonita al compartir en WhatsApp y redes, favicon propio, instalable como app

**Panel**
- ✅ Cuenta de propietario, entrar, salir de verdad, ojito en todas las contraseñas
- ✅ Freno contra quien prueba contraseñas: al quinto error espera 15 minutos *(nuevo hoy)*
- ✅ Recuperar contraseña con enlace de un solo uso (2 horas)
- ✅ Equipo: invitar, desactivar, roles; cuentas de soporte obligadas a decir «Soporte»
- ✅ Inventario: crear con foto, editar, publicar/ocultar, variantes, ficha técnica, historial de stock
- ✅ Destacar en portada y descripción en inglés *(nuevo hoy)*
- ✅ Eliminar producto, dentro de los tres puntos y con confirmación *(nuevo hoy)*
- ✅ Categorías: crear, renombrar en los dos idiomas, cambiar ícono, ocultar *(nuevo hoy)*
- ✅ La foto nueva reemplaza de verdad a la vieja en la tienda *(arreglado hoy)*
- ✅ El vendedor ya no puede editar productos ni ver costos *(arreglado hoy)*
- ✅ Vender en el local: efectivo, transferencia, tarjeta, fiado; comprobante por WhatsApp
- ✅ Cuentas por cobrar y abonos; gastos con recibo; clientes; proveedores
- ✅ Pedidos: confirmar → venta; cancelar → devolución *(cancelar, nuevo hoy)*
- ✅ Cotizaciones con enlace para que el cliente las abra
- ✅ Balance y estadísticas solo para el propietario
- ✅ Recibos de gastos privados *(arreglado hoy: antes se podían abrir sin entrar)*
- ✅ Franja de estado arriba del panel: «Estamos trabajando en…» *(nuevo hoy)*

---

## 4. Lo que falta ❌

### Va GRATIS (estaba vendido, o es regla nuestra)

| # | Qué falta | Por qué es gratis | Depende de |
|---|---|---|---|
| 1 | **Carga por foto con IA** (la ficha se llena sola, fondo recortado) | Está en el alcance | La clave de la IA |
| 2 | **Compras a proveedor** (entrada de mercancía que actualiza el costo) | Está en el alcance; la base ya está lista | Nadie |
| 3 | **Banner de la portada editable** desde Mi tienda | Está en el alcance; la base ya está lista | Nadie |
| 4 | Cotización aceptada → **venta con un toque** | Está en el alcance | Nadie |
| 5 | **Elegir color o talla en Vender** (punto de venta) | Las variantes ya se vendieron | Nadie |
| 6 | **Aviso de pedido nuevo** al celular del dueño | Está en el alcance | Nadie |
| 7 | Comprobante y cotización en **PDF con logo**; reportes en **Excel y PDF** | Está en el alcance | Nadie |
| 8 | **Escáner** de código de barras con la cámara | Está en el alcance | Nadie |
| 9 | **Funcionar sin señal** (hoy se instala, pero necesita internet) | PWA 100% se prometió | Nadie |
| 10 | **Formularios que no pierden lo escrito** | Regla nuestra | Nadie |
| 11 | **Selector de idioma estilo Amazon** (hoy son dos banderitas) | Regla nuestra | Nadie |
| 12 | **Docs** estilo Wikipedia con el panel real (hoy el manual es el prototipo) | Regla nuestra | Nadie |
| 13 | **Escudo anti-robots** en entrar y crear cuenta | Regla nuestra | Las claves de Turnstile |
| 14 | **Blindaje**: pruebas automáticas, cabeceras de seguridad, escaneo de secretos | Regla nuestra | Nadie |
| 15 | Favicon y tarjeta social con el **logo original** | Está en el alcance | El archivo del logo |

### SE COBRA (no existía y le agrega capacidad al negocio)

Precios sugeridos; el precio final lo decides tú.

| Mejora | Beneficio para el dueño | Rango sugerido |
|---|---|---|
| **Cobrar con tarjeta dentro de la tienda** | Vende de madrugada sin escribirle a nadie; el dinero entra solo | 350 a 600 dólares |
| **Importar sus datos de Treinta** (productos, clientes y deudas desde Excel) | No vuelve a teclear cientos de productos ni pierde las deudas que ya lleva | 150 a 300 dólares |
| **Correos automáticos** (confirmación al cliente, aviso al dueño, recuperar la clave por correo) | El cliente recibe su comprobante; el dueño no tiene que estar pendiente | 150 a 250 dólares |
| **Envío por zonas o con transportadora** | Cobra el envío justo según la ciudad, sin calcularlo a mano | 200 a 400 dólares |

---

## 5. Cómo se comprueba que sigue funcionando

- **El estado del sitio:** https://proinshop.com/estado dice si la base y el
  almacenamiento están conectados y cuántos productos, categorías y pedidos hay.
- **Las piezas arregladas hoy** están descritas en [CANDADOS.md](../CANDADOS.md):
  qué se rompía, por qué y cómo se comprueba.
