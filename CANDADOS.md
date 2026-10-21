# Candados de Proinshop

> Lo que estaba roto y empezó a funcionar. Por cada arreglo: cómo se veía,
> la causa real, qué se hizo, en qué commit quedó, cómo se comprueba y qué no
> hay que tocar. Antes de un rollback o de actualizar paquetes, se lee esto.
>
> **Pruebas automáticas (desde el 19 oct 2026):** `npm test` corre las de la
> carpeta `pruebas/`, y la publicación se frena sola si una falla (ver
> C-COMPUERTA). Lo que necesita navegador de verdad (huella, sin señal) está en
> `pruebas/navegador/` y se corre a mano contra la copia local; cómo, en
> `pruebas/navegador/comun.mjs`. Lo demás se comprueba con lo que dice «Cómo se
> comprueba», contra el worker local (`herramientas/probar-local.sh`).

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
  "0.500" → 0,5. Prueba automática: `pruebas/numeros.test.ts` (comprobada en
  rojo: con el error metido otra vez, falla).

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

## C-COMPUERTA — Nada se publica con una prueba en rojo

- **Qué se hizo:** `.github/workflows/build.yml` corre `typecheck`, `lint` y
  `npm test` antes de compilar. Si algo falla, no se arma el `_worker.js` y el
  sitio sigue con la versión anterior. `npm run verify` hace lo mismo más la
  cobertura y la auditoría de seguridad; `verify.yml` lo corre en las ramas.
- **Cobertura:** piso fijado en `vitest.config.mts` (21 oct 2026: líneas 36 %,
  funciones 40 %, ramas 35 %, sentencias 37 %). Solo puede subir.
- **Claves:** gitleaks revisa todo el historial antes de cada publicación
  (`build.yml`) y en las ramas (`verify.yml`). Si encuentra una clave, no se
  publica.
- **No tocar:** jamás quitar un paso de la compuerta ni bajar el piso para que
  pase un cambio. Se arregla el cambio.

## C-NEXT-SEGURO — Next 16.3.8 o más nuevo

- **Cómo se veía:** la auditoría marcaba fallos críticos de Next hasta la
  16.3.7 (ejecución remota en la optimización de imágenes, envenenamiento de
  caché, entre otros).
- **Qué se hizo:** `next` y `eslint-config-next` fijos en 16.3.8, que trae
  postcss y sharp corregidos. `npm audit --omit=dev` da cero.
- **No tocar:** no bajar de versión. Al subir a 16.4 o más, subir también
  `@opennextjs/cloudflare` (la 1.20.12 pide Next 16.4.1 o más).

## C-ESBUILD — El empaquetador de la nube necesita esbuild declarado

- **Cómo se veía:** la publicación del 19 oct falló en la nube con «Cannot
  find package 'esbuild'» justo después de pasar todas las pruebas. En la
  computadora compilaba bien.
- **Causa real:** `@opennextjs/cloudflare` usa `esbuild` sin declararlo. Antes
  quedaba suelto en `node_modules` de rebote; al instalar vitest 5 dejó de
  estarlo. En la computadora se encontraba uno en la carpeta personal, fuera
  del proyecto, y eso escondía el problema.
- **Qué se hizo:** `esbuild` 0.27.1 declarado en `devDependencies` (la misma
  versión con la que se hicieron todas las pruebas locales; compatible con
  vite 8, que pide 0.27 o 0.28).
- **Cómo se comprueba:** compilar en una carpeta limpia fuera del usuario
  (rsync del proyecto sin `node_modules` + `npm ci` +
  `npx opennextjs-cloudflare build`), no en la carpeta del proyecto.
- **No tocar:** no quitar `esbuild` de `package.json` aunque «nadie lo use».

## C-POR-TROZOS — Ninguna consulta pasa de 100 valores

- **Qué se habría roto:** la base de la nube rechaza consultas con más de 100
  valores. El catálogo de la tienda pedía colores, fotos y fichas de todos los
  productos en una sola consulta: con más de cien productos publicados, la
  tienda entera dejaba de cargar. Lo mismo la edición masiva con más de cien
  marcados. No se veía en las pruebas locales porque allá no hay ese límite.
- **Qué se hizo:** `src/lib/por-trozos.ts` (`filasPorLista`, `cambiarPorLista`,
  trozos de 90). Lo usan el catálogo, la venta, la compra, la cotización, la
  compra de la tienda, la lista de compras, la edición masiva y el borrado.
- **Cómo se comprueba:** `pruebas/por-trozos-y-borrado.test.ts`, con una base
  de mentira que rechaza más de 100 valores como la real (comprobada en rojo).
- **No tocar:** toda consulta nueva con `IN (...)` sobre una lista que viene de
  afuera pasa por estas funciones.

## C-AVISOS — Avisos al celular con el cifrado que aceptan los iPhone

- **Qué se hizo:** `src/lib/avisos-push.ts` con `@block65/webcrypto-web-push`
  2.0.0 (cifrado aes128gcm y firma «vapid», los únicos que acepta Apple). Las
  llaves las crea el sistema la primera vez y quedan en la tabla `clave_aviso`:
  no dependen de ninguna configuración a mano. Se avisa de pedidos nuevos (a
  quien atiende pedidos) y de lo que hace el equipo (al dueño). Se manda «por
  detrás» para no hacer esperar a nadie, y un aviso que falla nunca tumba la
  venta ni el pedido. Solo se manda a los servicios de avisos de Google,
  Mozilla, Microsoft y Apple.
- **Trampa que ya mordió:** la primera librería probada (`@pushforge/builder`)
  usa el formato viejo (aesgcm): a los iPhone no les habría llegado nada. La
  prueba lo detectó.
- **Cómo se comprueba:** `pruebas/avisos.test.ts` descifra el aviso como lo
  haría un celular (RFC 8291) y exige aes128gcm. En un celular real: Mi cuenta,
  «Activar avisos» y «Mandarme un aviso de prueba».
- **No tocar:** no cambiar la llave guardada en `clave_aviso`: todos los
  celulares suscritos dejarían de recibir avisos.

## C-INSTALAR — Proinshop se instala como app

- **Qué se hizo:** íconos de 192 y 512 (y de máscara) en `public/iconos/`, que
  Android exige para ofrecer instalar; se rehacen con
  `node herramientas/iconos-app.mjs`. El panel tiene su propio manifiesto
  (`/panel/manifest.webmanifest`) que abre directo en el panel. El botón
  «Instalar Proinshop en este celular» usa la invitación del navegador, que se
  guarda apenas carga la página (`escucharInstalacion`).

## C-ESTADO — El canario de la base

- **Qué se hizo:** `/estado` lee, escribe un latido y lo vuelve a leer, y
  revisa que existan las 24 tablas y las columnas nuevas. Si algo falla
  responde 503 con `estado: "error"`.
- **Cómo se comprueba:** abrir proinshop.com/estado: `estado: "ok"`,
  `esquema.completo: true`, `escritura.funciona: true`.

## C-ENTREGA — La prueba de aceptación

- `pruebas/navegador/entrega.mjs` hace, sobre una base nueva, todo lo del
  primer día: cuenta del propietario, tienda, Excel, colores, caja, cliente,
  ventas (simple, mixta con fiado, servicio, sin pasar el stock), anular,
  compra con costo promedio, conteo, edición masiva, cotización a venta,
  abono, vendedor con permisos, pedido de la tienda a venta, reportes, Excel,
  cierre de caja exacto y borrado de marcados. Debe dar todo en verde antes de
  una entrega. El 21 oct 2026 dio 43 de 43.

## C-PAGO-MIXTO — Los pagos tienen que cuadrar al centavo

- **Qué se hizo:** `src/lib/ventas.ts` → `repartirPagos`. Un solo método cubre
  el total; varios tienen que sumar exacto, en centavos. El fiado de un pago
  mixto crea la deuda solo por esa parte.
- **Cómo se comprueba:** `pruebas/ventas.test.ts` (comprobada en rojo).

## C-VENTA-UNICA — Una venta reenviada no se guarda dos veces

- **Causa que se evita:** la cola de ventas sin señal reintenta, y una venta
  que llegó al servidor pero cuya respuesta se perdió se reenviaría.
- **Qué se hizo:** cada venta lleva una llave (`clave`) que genera el
  navegador; `venta.clave` tiene índice único (`src/lib/esquema.ts`). Si ya
  existe, `guardarVenta` (`src/lib/registrar-venta.ts`) devuelve la que hay. Si
  el lote de la venta falla, la venta se borra para que el reintento la guarde
  completa.
- **Cómo se comprueba:** `pruebas/navegador/sin-senal.mjs` reenvía la misma
  venta y el servidor responde `repetida: true`.

## C-SIN-SENAL — El panel abre y vende sin internet

- **Qué se hizo:** `public/sw.js` (páginas: primero internet, si no la última
  copia; archivos de la app y fotos: primero la copia). `ServicioSinSenal` lo
  registra con la versión de la publicación. `EstadoConexion` muestra la
  franja, precarga Inicio, Vender e Inventario, y manda la cola
  (`cola-ventas.ts`) a `/panel/cola-ventas` al volver la señal.
- **Trampas que ya mordieron:**
  1. La página de aviso es `/sin-conexion`, **sin `.html`**: la nube redirige
     la de `.html`, y una respuesta que vino de una redirección no sirve para
     abrir una página (el navegador la rechaza).
  2. El aviso verde de «se enviaron» no salía: el efecto se cancelaba porque la
     lista cambia justo al enviar. El envío que ya arrancó no se cancela.
  3. La cola va a una dirección fija y no a una acción del servidor: las
     acciones cambian de nombre en cada publicación y la página guardada podía
     ser de la versión anterior.
- **Privacidad:** las copias del panel se borran al tocar Salir y al llegar a
  la pantalla de entrar. La cola NO se borra al salir (son ventas reales).
- **Cómo se comprueba:** `pruebas/navegador/sin-senal.mjs` (todo en ✓).

## C-HUELLA — Entrar con huella o cara

- **Qué se hizo:** `@simplewebauthn/server` 14.0.3 y `@simplewebauthn/browser`
  14.0.0. Acciones en `src/app/panel/llaves.ts`; botones en `BotonesHuella.tsx`.
  El dominio de la llave sale de una lista cerrada (`src/lib/llaves.ts`:
  proinshop.com, www, proinshop.sitios.dev y localhost). El reto vive en la
  base (`reto_llave`), sirve una vez y vence a los 5 minutos. Se exige la
  verificación del usuario (huella, cara o PIN).
- **Cómo se comprueba:** `pruebas/llaves-y-docs.test.ts` y
  `pruebas/navegador/huella.mjs` (con un lector virtual: activa, repite,
  sale y vuelve a entrar con la huella).
- **No tocar:** no sacar el dominio de la petición: una copia del sitio en
  otro dominio podría pedir llaves. Si el sitio cambia de dominio, se agrega a
  la lista.

## C-ESQUEMA-SOLO — La base se pone al día sola

- **Por qué:** no hay token de la base para aplicar migraciones a mano.
- **Qué se hizo:** `src/lib/esquema.ts` crea tablas y columnas que falten
  (una vez por proceso, idempotente) desde `baseDeDatos()`. Durante el `build`
  no se toca la base (`NEXT_PHASE`). La copia escrita está en
  `db/migraciones/005-igualar-treinta.sql`.

## C-SELECTOR-IDIOMA — Estilo Amazon, bandera de España

- **Cómo se comprueba:** `pruebas/selector-idioma.test.tsx` (bandera de España
  y nunca la de México, ventanita con «Cambiar idioma», círculos, se cierra al
  elegir, con Escape y al tocar fuera).

## C-DOCS — Cada guía completa y con sus capturas

- **Qué se hizo:** `src/lib/docs.ts` (contenido), `src/app/(tienda)/docs`
  (páginas). Direcciones en inglés, textos en español e inglés, capturas en
  `public/capturas/` (originales en `docs/capturas/`). `/guia` y `/manual`
  redirigen a `/docs`; el manual viejo quedó en `docs/manual-viejo/`.
- **Cómo se comprueba:** `pruebas/llaves-y-docs.test.ts` exige direcciones
  únicas en inglés, los dos idiomas y que cada captura nombrada exista.

---

Los primeros ocho quedaron en el commit 11daa71; C-FOTO-CELULAR, C-MONTOS,
C-FORM-NO-SE-VACIA y C-PANTALLA-ERROR en a320c21; C-BORRADORES y
C-ZONA-HORARIA en el commit siguiente (16 de octubre de 2026). Ver
`git log -- CANDADOS.md`.
Los de la igualación con Treinta (C-COMPUERTA en adelante) quedaron en la
publicación del 19 de octubre de 2026; C-POR-TROZOS, C-AVISOS, C-INSTALAR,
C-ESTADO y C-ENTREGA en la del 21 de octubre de 2026.
