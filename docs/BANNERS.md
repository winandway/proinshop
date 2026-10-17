# Banners de la portada

> Cómo se hacen las fotos de los cuatro banners y cómo se conectan.
> Fecha: 17 de octubre de 2026.

## La idea

**La foto es solo foto.** ChatGPT hace la imagen del producto, sin letras y sin
logo. La página pone encima el logo, el título, el texto y los botones.

Por qué así y no con el texto pegado en la imagen:

- **Se lee en el celular.** Un texto dentro de la foto se achica o se corta en
  una pantalla chica. El texto de la página se acomoda solo.
- **Sale en inglés.** La tienda es bilingüe: el mismo banner dice «Energía que
  no se corta» o «Power that never quits» según el idioma del cliente.
- **No sale torcido.** Los generadores de imágenes escriben mal las palabras y
  deforman los logos. El logo de la página es el original, nítido.
- **Se corrige sin rediseñar.** Cambiar una frase es cambiar texto, no volver a
  generar la imagen.

**Remotion no hace falta:** es para videos. Un video de fondo pesa diez veces
más que una foto y hace lenta la portada en el celular.

## Los cuatro mensajes (ya publicados)

| # | Encabezado | Título | Botón | Lleva a |
|---|---|---|---|---|
| 1 | Plantas eléctricas | Energía que no se corta | Ver plantas | Categoría plantas eléctricas |
| 2 | Nuevo en tienda | Motos y bicicletas eléctricas | Ver modelos | Categoría motos |
| 3 | Herramientas | Hechas para trabajar duro | Ver herramientas | Categoría herramientas |
| 4 | Importación directa | Precios al por mayor | Ver catálogo | Catálogo completo |

Cada uno lleva además el botón «Cotiza por WhatsApp» cuando el dueño carga su
número en Mi tienda, y los cuatro puntitos que dicen cuál se está viendo.

## Cómo se hacen las fotos

1. Abre **un solo chat** de ChatGPT y pega los cuatro prompts **uno detrás de
   otro**, en el mismo chat: así las cuatro fotos salen con el mismo estilo.
2. Si alguna sale cuadrada o vertical, escríbele: «hazla horizontal 3:2».
3. Descarga las cuatro y mándalas al chat de Claude, diciendo cuál es cuál
   (o en el orden 1, 2, 3, 4).

**Las medidas:** ChatGPT las entrega en 1536 × 1024. Es la medida correcta
para esto: Claude prepara la versión para computadora y la del celular, las
comprime y las publica. No hay que ajustar nada.

## Los prompts

Los cuatro comparten el mismo estilo; solo cambia el producto.

**Estilo común:** foto publicitaria minimalista; producto en el tercio derecho,
en vista de tres cuartos; mitad izquierda vacía para el texto; fondo de estudio
grafito oscuro (#1C1F24); brillo rojo sutil de la marca (#FF2D2D) detrás del
producto; sin texto, sin logos, sin marcas.

| # | Producto |
|---|---|
| 1 | Planta eléctrica portátil a gasolina, carcasa negra con detalles rojos y marco de tubo de acero |
| 2 | Motocicleta doble propósito de 150 cc, negro mate, sin calcomanías |
| 3 | Soldadora inverter compacta junto a un compresor de aire pequeño, en rojo y negro |
| 4 | Contenedor marítimo rojo con las puertas abiertas y cajas de cartón apiladas adentro |

El texto completo de cada prompt está en la conversación del 17 de octubre de
2026 y se repite abajo para copiarlo.

```
Crea una fotografía publicitaria de producto, estilo minimalista y profesional, como el catálogo de una marca premium.

Formato horizontal, proporción 3:2 (1536 × 1024).

Producto: [EL PRODUCTO DE LA TABLA].

Composición: el producto ocupa el tercio derecho de la imagen, en vista de tres cuartos, centrado en la altura y con aire alrededor. Toda la mitad izquierda queda vacía, solo fondo y sin objetos, porque ahí va texto.

Fondo: estudio gris grafito muy oscuro (#1C1F24), liso, sin textura. Piso del mismo tono con una sombra suave bajo el producto.

Luz: luz de estudio suave desde arriba a la izquierda y un brillo rojo sutil (#FF2D2D) detrás del producto que lo separa del fondo.

Prohibido: texto, letras, números, logotipos, marcas comerciales, marcas de agua, personas, bordes o marcos.

Realista, nítido, alta resolución.
```

## Cómo se conectan (lo hace Claude)

Cada foto se convierte en dos archivos en `public/banners/`:

| Archivo | Para qué | Cómo se hace |
|---|---|---|
| `<nombre>.webp` | Computadora | La foto con el fondo oscuro **alargado hacia la izquierda** hasta 4600 × 1024. Se toma el promedio de las primeras columnas de la foto, fila por fila, y se estira; un fundido de 160 px tapa la unión. Así, en una pantalla ancha (el banner mide hasta 2000 × 440) el producto se ve entero y pegado a la derecha, en vez de salir cortado arriba y abajo. |
| `<nombre>-movil.webp` | Celular | Recorte desde el 32 % del ancho hasta el borde derecho (la parte del producto), a 900 px. En el celular el producto va arriba y el texto abajo. |

Los nombres son `plantas`, `motos`, `herramientas` y `mayor`. Después se pone
`imagen: "<nombre>"` en ese mensaje de `src/componentes/Banner.tsx`, se prueba a
375 px, a 1440 px y a 2000 px, y se publica.

### Las fotos de hoy (17 oct 2026)

| Mensaje | Foto | Computadora | Celular |
|---|---|---|---|
| Plantas eléctricas | Planta eléctrica negra con rojo | 84 KB | 60 KB |
| Motos | Moto doble propósito negro mate | 112 KB | 79 KB |
| Herramientas | Soldadora y compresor rojos | 90 KB | 61 KB |
| Al por mayor | Contenedor rojo con cajas | 68 KB | 47 KB |

Mientras un mensaje no tiene foto, se ve con su fondo de color y su ícono.
Más adelante, el banner se podrá cambiar desde Mi tienda sin pasar por Claude
(punto 3 de PENDIENTES.md).
