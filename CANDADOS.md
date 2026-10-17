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

## C-FOTO-CELULAR — Las fotos de celular suben

- **Cómo se veía:** crear un producto con una foto de celular fallaba.
- **Causa:** Next acepta 1 MB por envío a una acción del servidor y una foto
  de cámara pesa de 2 a 6 MB.
- **Qué se hizo:** `experimental.serverActions.bodySizeLimit: "20mb"` en
  `next.config.ts`, y `src/lib/achicar-foto.ts` achica la foto en el celular
  (1600 px, JPEG 0,82) antes de enviarla. Si no puede, sube la original. El
  campo ya no lleva `capture`: deja elegir de la galería.
- **Cómo se comprueba:** una foto de 11,7 MB sube como 0,67 MB; una de 5 MB
  sin achicar también se guarda.
- **No tocar:** el límite de 20 MB ni el respaldo a la original.

## C-MONTOS — "1.890" es mil ochocientos noventa

- **Cómo se veía:** "1.890" se guardaba como 1,89 dólares.
- **Qué se hizo:** `src/lib/numeros.ts` → `leerMonto`. Separador seguido de
  grupos de tres cifras = miles; con punto y coma, el último es el decimal.
  Se usa en productos, variantes, gastos, abonos, descuento y envío.
- **Cómo se comprueba:** "1.890" → 1890, "1.240,50" → 1240,5, "25,5" → 25,5,
  "0.500" → 0,5.

## C-FORM-NO-SE-VACIA — El formulario no se borra al dar un aviso

- **Cómo se veía:** si faltaba el precio, el aviso salía y el formulario
  quedaba vacío, foto incluida.
- **Causa:** React vacía todo `<form action={...}>` al terminar el envío,
  aunque el servidor haya respondido con un error.
- **Qué se hizo:** `src/componentes/enviar-sin-borrar.ts`. Los formularios
  con aviso envían con `onSubmit` + `startTransition`.
- **Cómo se comprueba:** crear producto sin precio → el aviso sale y el
  nombre, la cantidad y la foto siguen ahí.
- **No tocar:** no volver a `action={enviar}` en esos formularios.

## C-BORRADORES — Ningún formulario pierde lo escrito

- **Qué se hizo:** una sola pieza, `src/componentes/GuardaBorrador.tsx`, puesta
  en todos los formularios (panel y tienda). Guarda con medio segundo de
  respiro, devuelve al volver con «Recuperamos lo que estabas escribiendo ·
  Empezar de nuevo», no guarda contraseñas, códigos ni archivos, y la llave
  lleva la cuenta y el formulario. Se borra al guardar bien (evento reset,
  `limpiarCon` o `LimpiarBorrador` en la pantalla de destino) y al salir. El
  carrito de Vender se guarda aparte con las mismas llaves.
- **Cómo se comprueba:** escribir en Crear producto, recargar → todo vuelve con
  el aviso; guardar → el borrador desaparece. Igual en Vender (el carrito) y
  en la compra de la tienda.

## C-ZONA-HORARIA — El "hoy" cierra a medianoche del negocio

- **Cómo se veía:** a las 8 de la noche en América el "Hoy vendiste" se
  reiniciaba y las horas salían cuatro o cinco horas corridas.
- **Qué se hizo:** `ZonaHoraria` pone la cookie `proinshop_zona` con la
  diferencia horaria del navegador; `src/lib/zona.ts` la usa para cortar día,
  mes y año en las consultas y para mostrar las horas.
- **Cómo se comprueba:** una venta a las 20:10 sale en "Hoy vendiste" y el
  comprobante dice 20:10.

## C-PANTALLA-ERROR — Un fallo nunca deja la pantalla técnica

- **Qué se hizo:** `error.tsx` en panel, acceso y tienda, y `global-error.tsx`,
  con `PantallaError`: recarga completa (arregla el caso de una versión nueva
  publicada con la página abierta) y el código del error. Además,
  `deploymentId` por publicación en `next.config.ts`.

---

Los primeros ocho quedaron en el commit 11daa71; C-FOTO-CELULAR, C-MONTOS,
C-FORM-NO-SE-VACIA y C-PANTALLA-ERROR en a320c21; C-BORRADORES y
C-ZONA-HORARIA en el commit siguiente (16 de octubre de 2026). Ver
`git log -- CANDADOS.md`.
