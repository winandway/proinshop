# Pendientes de Proinshop

> La fila se ejecuta en orden, de arriba abajo. Lo marcado 👤 depende de
> Richard o del dueño y se le recuerda en cada respuesta. Lo demás lo hace la
> IA sin esperar. Al terminar un punto se marca aquí mismo.
>
> Detalle y análisis completo: [docs/LANZAMIENTO-MVP.md](docs/LANZAMIENTO-MVP.md).
> Comparación con Treinta (qué falta, gratis y cobrable): [docs/COMPARATIVA-TREINTA.md](docs/COMPARATIVA-TREINTA.md).

## 👤 Esperando por Richard o por el dueño

- [ ] 👤 **El dueño crea su cuenta de propietario** en proinshop.com/panel. Mientras no exista, el primero que entre se queda con el panel.
- [ ] 👤 **El dueño invita la cuenta de Soporte** desde Equipo, con rol Propietario. Sin ella no podemos recuperarle la clave ni manejar la franja.
- [ ] 👤 **¿Se borran los 18 productos de muestra?** Tienen precios inventados y hoy se ven en la tienda. Sí o no.
- [ ] 👤 **WhatsApp de ventas** en Mi tienda. Sin él, los botones verdes abren WhatsApp sin destinatario.
- [ ] 👤 **Token nuevo de la base.** El que había ya no sirve. Hace falta para mantenimiento y para borrar en bloque.
- [ ] 👤 **Clave de la IA** para la carga por foto.
- [ ] 👤 **Claves de Turnstile** (escudo anti-robots).
- [ ] 👤 **Logo original** en vector o PNG grande.
- [ ] 👤 **Foto del contenedor con «PROINSHOP» bien escrito** (la que llegó dice «PROVINCHO»). Va como cuarto producto de la vitrina.
- [ ] 👤 **Qué mejoras cobrables se le cotizan al cliente** y a qué precio. Ya NO entran ahí las herramientas de Treinta: Richard ordenó igualarlas el 19 oct porque al cliente se le vendió Proinshop como igual a Treinta (van como garantía). Quedan: factura electrónica, IA, recordatorios automáticos por WhatsApp, varias tiendas y apps en las tiendas.
- [ ] 👤 **Cuenta de Google Play del negocio** (25 dólares, una sola vez) para publicar la app de Android.

## Fila de la IA (gratis, en este orden)

1. [ ] Aviso de pedido nuevo al celular con el panel cerrado (notificaciones push; hoy avisa con el panel abierto)
2. [ ] Blindaje que falta: cabeceras de seguridad (CSP y compañía), gitleaks y husky, pruebas de punta a punta en la nube
3. [ ] Banner de la portada editable desde Mi tienda
4. [ ] Recorrido de bienvenida la primera vez que entra el dueño
5. [ ] Panel también en inglés (hoy el panel es solo en español; la tienda y Docs ya son bilingües)
6. [ ] App de Android con la tienda y el panel (cuando llegue la cuenta de Google Play)
7. [ ] Turnstile en entrar y crear cuenta (cuando lleguen las claves)
8. [ ] Carga por foto con IA, con fondo recortado (cuando llegue la clave)

## Cobrable (espera el visto bueno y el precio de Richard)

Factura electrónica, asistente con IA, recordatorios automáticos por WhatsApp,
varias tiendas, app en la App Store. Rangos en COMPARATIVA-TREINTA, sección 4.

## Hecho

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
- [x] 19 oct 2026 — Docs en /docs, 21 guías en español e inglés con capturas; /guia y /manual redirigen
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
