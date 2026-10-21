# Pendientes de Proinshop

> La fila se ejecuta en orden, de arriba abajo. Lo marcado 👤 depende de
> Richard o del dueño y se le recuerda en cada respuesta. Lo demás lo hace la
> IA sin esperar. Al terminar un punto se marca aquí mismo.
>
> Detalle y análisis completo: [docs/LANZAMIENTO-MVP.md](docs/LANZAMIENTO-MVP.md).
> Comparación con Treinta (qué falta, gratis y cobrable): [docs/COMPARATIVA-TREINTA.md](docs/COMPARATIVA-TREINTA.md).

## 👤 Esperando por Richard o por el dueño

> Ninguno frena la entrega: el sistema está completo y verificado (acta del 21 oct).

- [ ] 👤 **Richard: avisar cuando se entregue**, para pasar la franja del dueño a verde («Terminamos… ahora te toca probarlo»).
- [ ] 👤 **El dueño, al arrancar** (con la tarjeta «Primeros pasos» y Docs): crear su cuenta, poner el WhatsApp de ventas, borrar los 18 productos de muestra (Edición masiva → ⋮ → borrar) y cargar los suyos.
- [ ] 👤 **El dueño: probar el aviso al celular** desde su teléfono (Mi cuenta → Activar avisos → Mandarme un aviso de prueba). Es lo único que no se puede ver llegar desde aquí.
- [ ] 👤 Opcional: **invitar a Soporte** como Propietario, para poder recuperarle la clave.
- [ ] 👤 Opcional: **clave de la IA** (cargar productos con una foto), **claves del escudo anti-robots**, **logo original**, **foto del contenedor** con PROINSHOP bien escrito, **cuenta de Google Play** (25 dólares, solo para aparecer en la tienda de apps).
- [ ] 👤 Opcional: **token nuevo de la base**, solo para mantenimiento a mano. El sitio no lo necesita para funcionar.
- [ ] 👤 **Qué mejoras cobrables se cotizan**: factura electrónica, IA, recordatorios automáticos, varias tiendas, App Store.

## Fila de la IA (gratis, en este orden)

1. [ ] Pruebas de punta a punta también en la nube (hoy la prueba de aceptación se corre en la copia local)
2. [ ] Banner de la portada editable desde Mi tienda (es de la tienda, no de Treinta)
3. [ ] Panel también en inglés (la tienda y Docs ya son bilingües; Treinta es solo en español)
4. [ ] Turnstile en entrar y crear cuenta (cuando lleguen las claves)
5. [ ] Carga por foto con IA, con fondo recortado (cuando llegue la clave)
6. [ ] Publicar en Google Play (cuando llegue la cuenta; ya se instala desde el navegador)

## Cobrable (espera el visto bueno y el precio de Richard)

Factura electrónica, asistente con IA, recordatorios automáticos por WhatsApp,
varias tiendas, app en la App Store. Rangos en COMPARATIVA-TREINTA, sección 4.

## Hecho

- [x] 21 oct 2026 — Avisos al celular con el panel cerrado (pedidos y lo que hace el equipo), con prueba de cifrado
- [x] 21 oct 2026 — Instalar Proinshop como app desde el navegador (íconos grandes, manifiesto del panel, botón)
- [x] 21 oct 2026 — Primeros pasos del dueño en el inicio, que se marcan solos
- [x] 21 oct 2026 — Reportes comparados con el período anterior
- [x] 21 oct 2026 — Borrar productos marcados de una vez (para los de muestra)
- [x] 21 oct 2026 — Arreglo de raíz: ninguna consulta pasa de 100 valores (la tienda se caía con más de cien productos)
- [x] 21 oct 2026 — Canario de la base en /estado (lee, escribe y revisa las 24 tablas)
- [x] 21 oct 2026 — Cabeceras de seguridad y búsqueda de claves antes de cada publicación
- [x] 21 oct 2026 — Aviso cuando la caja da negativo y aclaración de cómo se pagó una compra
- [x] 21 oct 2026 — Prueba de aceptación completa sobre base nueva: 45 de 45 en verde

- [x] 19 oct 2026 — Igualar a Treinta, de corrido (plan en docs/PLAN-IGUALAR-TREINTA.md):
  pago mixto y fiado parcial, escáner, colores y tallas, servicios, nota,
  comprobante para imprimir y compartir, anular venta, caja, compras con costo
  promedio, alertas de stock bajo, conteo de inventario, edición masiva, Excel
  de ida y vuelta, ficha del cliente, cotización → venta, reportes con filtros
  y descargas, actividad del equipo, avisos en vivo, segunda moneda, permisos
  por persona y por módulo
- [x] 19 oct 2026 — Selector de idioma estilo Amazon, con su prueba
- [x] 19 oct 2026 — Entrar con huella o cara (llaves de acceso)
- [x] 19 oct 2026 — Abrir y vender sin señal, con la cola que se envía sola
- [x] 19 oct 2026 — Docs en /docs, 20 guías en español e inglés con capturas; /guia y /manual redirigen
- [x] 19 oct 2026 — Pruebas automáticas (56), compuerta antes de publicar, piso de cobertura, `npm run verify`
- [x] 19 oct 2026 — Next 16.3.8 por fallos de seguridad críticos; mapa del sitio y robots.txt

- [x] 16 oct 2026 — Pedido con variante, envío del lado del servidor, solo productos publicados
- [x] 16 oct 2026 — Cancelar pedido con devolución de mercancía y salida del balance
- [x] 16 oct 2026 — Recibos de gastos privados
- [x] 16 oct 2026 — Destacar en portada, descripción en inglés, eliminar producto, foto nueva primero
- [x] 16 oct 2026 — Categorías: renombrar, inglés, ícono, ocultar
- [x] 16 oct 2026 — Vendedor sin edición de catálogo ni costos
- [x] 16 oct 2026 — Freno de intentos en la entrada
- [x] 16 oct 2026 — Franja de estado del trabajo + pantalla de Soporte
- [x] 16 oct 2026 — Fotos de celular: límite de 20 MB, foto achicada en el celular, cámara o galería
- [x] 16 oct 2026 — Montos con punto de miles ("1.890" = 1890)
- [x] 16 oct 2026 — Los formularios ya no se vacían al dar un aviso
- [x] 16 oct 2026 — Ningún formulario pierde lo escrito (`GuardaBorrador`), carrito de Vender incluido
- [x] 16 oct 2026 — El "hoy" y las horas con la hora del negocio
- [x] 16 oct 2026 — Pantallas de error amables y recarga sola al publicar versión nueva
