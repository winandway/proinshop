# Pendientes de Proinshop

> La fila se ejecuta en orden, de arriba abajo. Lo marcado 👤 depende de
> Richard o del dueño y se le recuerda en cada respuesta. Lo demás lo hace la
> IA sin esperar. Al terminar un punto se marca aquí mismo.
>
> Detalle y análisis completo: [docs/LANZAMIENTO-MVP.md](docs/LANZAMIENTO-MVP.md).

## 👤 Esperando por Richard o por el dueño

- [ ] 👤 **El dueño crea su cuenta de propietario** en proinshop.com/panel. Mientras no exista, el primero que entre se queda con el panel.
- [ ] 👤 **El dueño invita la cuenta de Soporte** desde Equipo, con rol Propietario. Sin ella no podemos recuperarle la clave ni manejar la franja.
- [ ] 👤 **¿Se borran los 18 productos de muestra?** Tienen precios inventados y hoy se ven en la tienda. Sí o no.
- [ ] 👤 **WhatsApp de ventas** en Mi tienda. Sin él, los botones verdes abren WhatsApp sin destinatario.
- [ ] 👤 **Token nuevo de la base.** El que había ya no sirve. Hace falta para mantenimiento y para borrar en bloque.
- [ ] 👤 **Clave de la IA** para la carga por foto.
- [ ] 👤 **Claves de Turnstile** (escudo anti-robots).
- [ ] 👤 **Logo original** en vector o PNG grande.

## Fila de la IA (gratis, en este orden)

1. [ ] Selector de idioma estilo Amazon (`SelectorIdioma`)
2. [ ] Compras a proveedor (entrada de mercancía que actualiza costo y stock)
3. [ ] Banner de la portada editable desde Mi tienda
4. [ ] Elegir color o talla en Vender
5. [ ] Cotización aceptada → venta con un toque
6. [ ] Aviso de pedido nuevo al celular del dueño
7. [ ] Docs estilo Wikipedia en `/docs` con el panel real (redirigir `/guia`)
8. [ ] Blindaje: vitest + playwright + prueba de humo + cabeceras de seguridad + gitleaks + `npm run verify`; pruebas de los candados de CANDADOS.md
9. [ ] Comprobante y cotización en PDF; reportes en Excel y PDF
10. [ ] Escáner de código de barras con la cámara
11. [ ] Funcionar sin señal (service worker)
12. [ ] Turnstile en entrar y crear cuenta (cuando lleguen las claves)
13. [ ] Carga por foto con IA (cuando llegue la clave)

## Hecho

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
