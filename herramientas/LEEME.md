# Cómo se regeneran el favicon y la tarjeta social

Las tres imágenes de la marca son **archivos PNG estáticos** dentro de `src/app`:

| Archivo | Medida | Dónde se ve |
|---|---|---|
| `src/app/icon.png` | 64×64 | Pestaña del navegador |
| `src/app/apple-icon.png` | 180×180 | Pantalla de inicio del iPhone (PWA) |
| `src/app/opengraph-image.png` | 1200×630 | Al compartir el link por WhatsApp, Facebook o X |

## Por qué son estáticos y no generados

Se generaban con `next/og` (`ImageResponse`). Funciona, pero arrastra archivos
`.wasm` que **impiden empaquetar el sitio en un solo `_worker.js`**, que es lo
único que acepta YaDominios Cloud. Como las tres imágenes nunca cambian, salen
más rápido y más livianas como PNG servidos por el CDN.

## Para regenerarlas

Los generadores quedaron guardados aquí con extensión `.txt` para que Next no
los compile: `generar-icon.tsx.txt`, `generar-apple-icon.tsx.txt` y
`generar-opengraph-image.tsx.txt`. Usan las tipografías de `src/fuentes`.

1. Copia el generador que necesites a `src/app/` con su nombre real
   (por ejemplo `generar-icon.tsx.txt` → `src/app/icon.tsx`) y borra el `.png`
   correspondiente.
2. `npm run dev`
3. Descarga el resultado:

```bash
curl -sf http://localhost:3000/opengraph-image -o src/app/opengraph-image.png
```

4. Borra el `.tsx` de `src/app/` y deja solo el `.png`.
5. Comprueba que el empaquetado sigue saliendo en un archivo:

```bash
npx opennextjs-cloudflare build
```

## Cuando llegue el logo original

En cuanto el dueño entregue el logo en vector, se reemplaza la diana dibujada a
mano de los generadores por el archivo real y se repiten los pasos de arriba.
El componente `src/componentes/Logo.tsx` también hay que actualizarlo.
