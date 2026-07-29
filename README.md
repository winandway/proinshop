# Proinshop.com

Tienda virtual y gestor de negocio de Proinshop — importación directa desde
China: plantas eléctricas, motos, bicicletas, carros, herramientas y repuestos.

El alcance completo del proyecto está en [PROYECTO.md](PROYECTO.md).

## Arrancar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run lint` | Revisa el código |
| `npx tsc --noEmit` | Revisa los tipos |

## Cómo está organizado

```
src/app/            Rutas de la tienda, favicon, tarjeta social y manifiesto PWA
src/componentes/    Componentes de pantalla
src/lib/            Datos, idiomas, tipos y configuración del negocio
db/schema.sql       Modelo de la base de datos (D1)
public/guia/        Manual visual de la app y de la tienda (ver abajo)
herramientas/       Generadores archivados del favicon y la tarjeta social
.github/workflows/  Compilación automática para YaDominios Cloud
```

## El manual (`/guia`)

Todo el prototipo visual quedó como **manual de uso** en una sola página:

```
http://localhost:3000/guia
```

Cada pantalla tiene **su propio enlace**, para pasarle al cliente solo el tema
que preguntó. Por ejemplo `…/guia#crear-producto`, `…/guia#cuentas-por-cobrar`,
`…/guia#pedidos-de-la-tienda`. La pestaña **Índice** lista todos los temas con
su enlace, y cada tarjeta tiene un botón "🔗 Copiar link".

La página lleva `noindex`: no aparece en buscadores.

## Publicar en YaDominios Cloud

1. Empuja a `main`. La GitHub Action `build-para-yadominios-cloud` compila con
   OpenNext, empaqueta todo en **un solo `_worker.js`** y lo publica en la rama
   **`yapanel-build`**.
2. En el panel (Nube YaDominios → Publica tu página) se conecta el repositorio
   y **la rama `yapanel-build`** — nunca `main`, porque `main` tiene el código
   sin compilar.
3. La base de datos (`env.DB`) y el bucket (`env.BUCKET`) los crea la
   plataforma al publicar. Las variables secretas se cargan en el panel, no en
   el repositorio.

El empaquetado lo hace `wrangler deploy --dry-run --outdir`, no `esbuild` a
mano: el bundle de esbuild compila pero al arrancar falla con
`Dynamic require of "fs" is not supported`. Comprobado contra workerd.

Para reproducirlo en local:

```bash
npx opennextjs-cloudflare build && npx wrangler deploy --dry-run --outdir=.dist-worker
```

## Idiomas

Toda la tienda está en español e inglés, con selector de banderas arriba a la
derecha. El idioma se guarda en una cookie y el servidor pinta directo en ese
idioma. Si a un producto le falta la traducción, se muestra el español.

## Datos

El catálogo vive en la base **D1** del sitio (`env.DB`) y las fotos en el
bucket **R2** (`env.BUCKET`). Ambos los crea y enlaza YaDominios Cloud al
publicar.

- `src/lib/d1.ts` — expone los bindings. Si no hay entorno de Cloudflare
  (`npm run dev` suelto) devuelve `null`.
- `src/lib/catalogo.ts` — consulta D1. Sin base, cae a
  `src/lib/catalogo-desarrollo.ts` para poder trabajar sin conexión.
- `/media/<clave>` — sirve las fotos desde el bucket.
- `/estado` — dice si base y bucket están conectados, con conteos.

### Consultar la base de producción

```bash
curl -s -X POST https://yapanel.yadominios.com/api/hosting/db/query \
  -H "Content-Type: application/json" \
  -d '{"sitio":"proinshop","token":"<token>","sql":"SELECT COUNT(*) AS n FROM producto","params":[]}'
```

El token sale del panel (YaDominios Cloud → tarjeta del sitio → "Ver token").
**Nunca se guarda en el repositorio**: se pasa en línea con el comando o por la
variable `DB_TOKEN`.

> **La base sobrevive a recrear el sitio.** Se nombra por el nombre del sitio
> (`site-proinshop-db`), no por su id: si se borra y vuelve a crear el sitio en
> el panel, los datos siguen ahí. Lo único que cambia es el token.

### Herramientas

```bash
# Crear o actualizar el esquema en la base del sitio
DB_TOKEN=<token> node herramientas/db-remota.mjs db/schema.sql

# Cargar el catálogo inicial (solo la primera vez)
node herramientas/generar-seed.mjs > /tmp/seed.json
DB_TOKEN=<token> node herramientas/db-remota.mjs /tmp/seed.json

# Subir los archivos de marca al bucket y comprobar que se sirven
DB_TOKEN=<token> node herramientas/subir-marca.mjs

# Subir una foto y vincularla a un producto (el 1, en este ejemplo)
DB_TOKEN=<token> node herramientas/subir-a-r2.mjs foto.jpg productos/foto.jpg 1
```

### Probar en local con base y bucket reales

```bash
npx opennextjs-cloudflare build
npx wrangler dev            # levanta D1 y R2 locales según wrangler.jsonc
```

## Variables de entorno

```
NEXT_PUBLIC_WHATSAPP=   # número de ventas, solo dígitos (ej. 15550100147)
```

Sin ese valor los botones de WhatsApp abren la aplicación sin destinatario.

---

© 2026 proinshop.com | All rights reserved. Developed by
[Windoce LLC](https://windoce.com)
