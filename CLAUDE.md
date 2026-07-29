@AGENTS.md

# Proinshop — perímetro del proyecto

> Reglas propias de este proyecto. Se suman a las globales de
> `~/.claude/CLAUDE.md`; en caso de choque, mandan las globales.

## Qué es

Gestor de negocio (estilo Treinta) **fusionado** con la tienda virtual de la
marca. Lo que el dueño registra en el gestor se publica solo en la tienda.
Ver [PROYECTO.md](PROYECTO.md) para el alcance completo.

## Perímetro: qué se puede tocar

- **Carpeta:** solo `/Users/windocellc/Proinshop.com`.
- **Lista cerrada de recursos.** Lo que no esté en esta tabla, no existe para
  ninguna sesión:

  | Recurso | Nombre exacto |
  |---|---|
  | Repositorio | `github.com/winandway/proinshop` (público) |
  | Sitio | `proinshop` en YaDominios Cloud → proinshop.com |
  | Base de datos | `env.DB` del sitio (la crea la plataforma) |
  | Bucket | `env.BUCKET` del sitio (la crea la plataforma) |

- **La base y el bucket se nombran por el NOMBRE del sitio, no por su id.** Si
  se borra y recrea el sitio en el panel, la plataforma **reutiliza la misma
  base** (`site-proinshop-db`) con todos sus datos. Lo que sí cambia es el
  **token**, que va atado al registro del sitio. Conclusión práctica: recrear
  el sitio **no** borra el catálogo; solo hay que pedir el token nuevo.
- **Prohibido crear recursos nuevos** (bases, buckets, repos, subdominios) sin
  que el usuario lo pida explícitamente.
- **El token de la base nunca se guarda.** Se usa en línea con el comando o por
  `DB_TOKEN`; jamás en un archivo, en el historial ni commiteado.
- **Operaciones destructivas en la base de producción** (`DROP`, `DELETE`
  masivo, `TRUNCATE`, `UPDATE` sin `WHERE`) requieren confirmación explícita
  cada vez.

## Convenciones de código

- **Next.js 16**, App Router, TypeScript, Tailwind v4. Nunca bajar de versión.
- **Todo en español**: nombres de archivos, componentes, funciones y variables
  (`Encabezado`, `obtenerProductos`, `idiomaActual`). Los comentarios explican
  el *por qué*, no el *qué*.
- Componentes en `src/componentes`, lógica en `src/lib`, rutas en `src/app`.
- Los textos de cara al público **siempre** en español e inglés (tipo `Texto`).
  El español es el respaldo cuando falta la traducción.
- El acceso a datos vive en `src/lib/catalogo.ts` y **todas las funciones son
  asíncronas**, aunque hoy lean de un archivo: así el cambio a D1 no toca las
  pantallas.
- **No usar rutas `/api/`** — chocan con los estáticos en YaDominios Cloud.
  Usar `/datos`, `/media`, `/upload`.

## Cuentas de soporte

Nuestras cuentas dentro del panel del cliente **siempre llevan "Soporte" en el
nombre** (regla global). Aquí está hecho cumplir por código: si el correo es
`@windoce.com`, el alta y la invitación no dejan guardar sin esa palabra —
ver `revisarNombreDeSoporte` en `src/lib/contrasenas.ts`.

## Datos

- `src/lib/catalogo-desarrollo.ts` es **solo para desarrollar**. Se borra
  cuando entre D1. Nunca agregar ahí datos reales de nadie.
- `db/schema.sql` es la fuente de verdad del modelo de datos; las migraciones
  aplicadas están en `db/migraciones/`.

## Antes de dar algo por terminado

1. `npm run lint` y `npx tsc --noEmit` sin errores.
2. Si el cambio se ve en pantalla: probarlo en el preview a **375 px** y
   mostrar la captura.
3. `npm run build` pasa.
