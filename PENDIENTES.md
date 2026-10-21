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
- [ ] 👤 **Cuenta de Google Play del negocio** (25 dólares, una sola vez), solo si quieren que aparezca en la tienda de apps. Ya se instala desde el navegador.

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
