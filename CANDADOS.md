# Candados de Proinshop

> Lo que estaba roto y empezó a funcionar. Por cada arreglo: cómo se veía,
> la causa real, qué se hizo, en qué commit quedó, cómo se comprueba y qué no
> hay que tocar. Antes de un rollback o de actualizar paquetes, se lee esto.
>
> **Deuda:** el proyecto todavía no tiene pruebas automáticas (punto 9 de
> PENDIENTES.md). Mientras tanto, cada candado se comprueba a mano con lo que
> dice «Cómo se comprueba», contra el worker local de workerd.

---

## C-PEDIDO-VARIANTE — El pedido guarda el color o la talla

- **Cómo se veía:** el cliente elegía «Edición negra (+100)», el carrito
  mostraba 1.990 y el pedido se guardaba en 1.890 y sin decir qué variante.
- **Causa:** `guardarPedido` recibía `varianteId` pero lo ignoraba.
- **Qué se hizo:** `src/app/(tienda)/checkout/acciones.ts` lee la variante de
  la base, comprueba que sea del producto, suma `precio_extra`, guarda
  `variante_id` y el nombre en la descripción. `confirmarPedido` descuenta el
  stock de la variante además del producto.
- **Cómo se comprueba:** pedir una variante con recargo → en `pedido_item`
  la descripción lleva el nombre de la variante, `variante_id` no es nulo y el
  precio incluye el recargo. Al confirmar, baja el stock de esa variante.
- **No tocar:** el precio nunca sale del navegador.

## C-ENVIO-SERVIDOR — El envío sale del panel

- **Cómo se veía:** el costo del envío lo mandaba el navegador; se podía
  mandar en cero.
- **Qué se hizo:** `guardarPedido` usa `obtenerConfigTienda().costoEnvio`.
- **Cómo se comprueba:** el pedido a domicilio guarda el envío de Mi tienda
  aunque el navegador mande otro número.

## C-SOLO-PUBLICADOS — No se pide lo escondido

- **Qué se hizo:** la consulta del checkout filtra `publicado = 1`.
- **Cómo se comprueba:** un pedido armado a mano con el slug de un producto
  sin publicar responde «ya no están disponibles».

## C-CANCELAR-PEDIDO — Cancelar devuelve la mercancía

- **Cómo se veía:** no había forma de cancelar; y `cambiarEstadoPedido`
  aceptaba volver a «nuevo», lo que permitía confirmar dos veces y descontar
  el stock doble.
- **Qué se hizo:** `cancelarPedido` en `src/app/panel/(dentro)/pedidos/acciones.ts`:
  si el pedido tenía venta, devuelve stock (producto y variante) con movimiento
  `devolucion` y borra la venta. `cambiarEstadoPedido` ya no acepta «nuevo» ni
  «cancelado».
- **Cómo se comprueba:** confirmar un pedido (stock baja, aparece la venta) →
  cancelarlo desde los tres puntos → el stock vuelve, la venta desaparece y el
  último movimiento dice `devolucion`.

## C-RECIBOS-PRIVADOS — Los recibos no se abren sin sesión

- **Cómo se veía:** `/media/recibos/...` servía el archivo a cualquiera.
- **Qué se hizo:** `src/app/media/[...clave]/route.ts` exige sesión para la
  carpeta `recibos/` y no deja guardarlos en cachés compartidas.
- **Cómo se comprueba:** sin sesión, `/media/recibos/cualquiera.jpg` da 404.

## C-FOTO-NUEVA — La foto que se cambia es la que se ve

- **Cómo se veía:** al cambiar la foto, la tienda seguía mostrando la vieja.
- **Causa:** la nueva entraba con el mismo `orden` (0) que la vieja.
- **Qué se hizo:** la nueva entra con `MIN(orden) - 1` y todas las consultas
  ordenan por `orden, id DESC`.
- **Cómo se comprueba:** cambiar la foto de un producto → la tienda y el
  inventario muestran la nueva.

## C-FRENO-INTENTOS — Freno a la fuerza bruta

- **Qué se hizo:** `src/lib/intentos.ts`. Cinco fallos por correo (o veinte
  por conexión) en 15 minutos bloquean, antes de mirar la contraseña. La tabla
  `intento_acceso` se crea sola.
- **Cómo se comprueba:** seis contraseñas equivocadas seguidas → la sexta dice
  «Demasiados intentos. Espera 15 minutos».
- **No tocar:** el mensaje de error es el mismo exista o no el correo.

## C-ROLES-CATALOGO — El vendedor no edita el catálogo

- **Qué se hizo:** las acciones de inventario, variantes y ficha técnica
  aceptan solo Propietario y Bodega; eliminar, solo Propietario. Las pantallas
  de edición redirigen al vendedor.
- **Cómo se comprueba:** con una cuenta de vendedor, abrir la ficha de un
  producto devuelve al inventario y no aparecen los botones de crear.

---

Todos estos quedaron funcionando en el commit que acompaña a este documento
(16 de octubre de 2026). Ver `git log -- CANDADOS.md`.
