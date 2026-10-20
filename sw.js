/*
 * Proinshop: que la app abra sin señal.
 *
 * - Páginas: primero internet; si no hay, la última copia guardada de esa
 *   página, y si no hay copia, la página «Sin conexión».
 * - Archivos de la app (/_next/static): primero la copia. Su nombre cambia
 *   con cada publicación, así que una copia nunca queda vieja.
 * - Fotos: primero la copia, con un tope para no llenar el celular.
 *
 * Las copias de páginas se borran al cerrar sesión (BotonSalir) y al llegar a
 * la pantalla de entrar: en una computadora compartida nadie ve el panel de
 * otro sin señal.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "local";
const ESTATICOS = `proinshop-estaticos-${VERSION}`;
const PAGINAS = `proinshop-paginas-${VERSION}`;
const FOTOS = "proinshop-fotos";
const TOPE_FOTOS = 300;
// Sin ".html": la nube sirve la página por su nombre limpio y redirige el
// otro, y una copia que vino de una redirección no sirve para abrir páginas.
const SIN_CONEXION = "/sin-conexion";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(ESTATICOS)
      .then((cache) => cache.add(new Request(SIN_CONEXION, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nombre of await caches.keys()) {
        const actual = nombre === ESTATICOS || nombre === PAGINAS || nombre === FOTOS;
        if (nombre.startsWith("proinshop-") && !actual) await caches.delete(nombre);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(primeroLaCopia(peticion, ESTATICOS));
    return;
  }
  if (
    url.pathname.startsWith("/media/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)
  ) {
    evento.respondWith(primeroLaCopia(peticion, FOTOS, TOPE_FOTOS));
    return;
  }

  // Las navegaciones internas de Next van directo a internet. Sin señal
  // fallan, Next hace una carga completa y esa sí la contesta este archivo.
  if (peticion.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  const precarga = peticion.headers.get("X-Proinshop-Precarga") === "1";
  if (peticion.mode !== "navigate" && !precarga) return;

  evento.respondWith(primeroInternet(evento, peticion, url, precarga));
});

async function primeroLaCopia(peticion, nombreCache, tope) {
  const cache = await caches.open(nombreCache);
  const guardada = await cache.match(peticion, { ignoreVary: true });
  if (guardada) return guardada;
  const respuesta = await fetch(peticion);
  if (respuesta.ok && respuesta.type === "basic") {
    await cache.put(peticion, respuesta.clone());
    if (tope) recortar(cache, tope);
  }
  return respuesta;
}

async function recortar(cache, tope) {
  const llaves = await cache.keys();
  for (let i = 0; i < llaves.length - tope; i += 1) await cache.delete(llaves[i]);
}

async function primeroInternet(evento, peticion, url, precarga) {
  try {
    const respuesta = await fetch(peticion);
    const esHtml = (respuesta.headers.get("content-type") || "").includes("text/html");
    if (respuesta.ok && respuesta.type === "basic" && !respuesta.redirected && esHtml) {
      evento.waitUntil(guardarPagina(url, respuesta.clone(), precarga));
    }
    return respuesta;
  } catch {
    const cache = await caches.open(PAGINAS);
    const guardada =
      (await cache.match(url.href, { ignoreVary: true })) ||
      (await cache.match(url.href, { ignoreVary: true, ignoreSearch: true }));
    if (guardada) return guardada;
    const estaticos = await caches.open(ESTATICOS);
    const aviso = await estaticos.match(SIN_CONEXION, { ignoreVary: true });
    if (aviso) return aviso;
    return new Response("Sin conexión / Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * Guarda la copia de la página. Si la pidió el panel por adelantado (la de
 * vender, por ejemplo), también trae sus archivos: sin ellos la copia se
 * vería, pero los botones no funcionarían.
 */
async function guardarPagina(url, respuesta, precarga) {
  const cache = await caches.open(PAGINAS);
  if (!precarga) {
    await cache.put(url.href, respuesta);
    return;
  }
  const html = await respuesta.clone().text();
  await cache.put(url.href, respuesta);

  const rutas = new Set();
  for (const encontrada of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) rutas.add(encontrada[0]);
  for (const encontrada of html.matchAll(/["']static\/(chunks|css)\/[^"'\s\\]+/g)) {
    rutas.add(`/_next/${encontrada[0].slice(1)}`);
  }

  const estaticos = await caches.open(ESTATICOS);
  await Promise.all(
    [...rutas].slice(0, 120).map(async (ruta) => {
      if (await estaticos.match(ruta)) return;
      try {
        const archivo = await fetch(ruta);
        if (archivo.ok) await estaticos.put(ruta, archivo);
      } catch {
        // Sin señal a mitad de la precarga: se completa en la próxima visita.
      }
    }),
  );
}
