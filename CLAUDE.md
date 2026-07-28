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
- **Recursos en la nube:** **NINGUNO todavía.** No existe repo en GitHub, ni
  base D1, ni bucket R2, ni sitio en YaDominios Cloud. **Prohibido crearlos**
  sin que el usuario lo pida explícitamente. Todo el desarrollo es local.
- Cuando se autoricen, se anotan aquí con su nombre exacto y esta lista pasa a
  ser cerrada: lo que no esté escrito acá, no se toca.

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

## Datos

- `src/lib/catalogo-desarrollo.ts` es **solo para desarrollar**. Se borra
  cuando entre D1. Nunca agregar ahí datos reales de nadie.
- `db/schema.sql` es la fuente de verdad del modelo de datos.

## Antes de dar algo por terminado

1. `npm run lint` y `npx tsc --noEmit` sin errores.
2. Si el cambio se ve en pantalla: probarlo en el preview a **375 px** y
   mostrar la captura.
3. `npm run build` pasa.
