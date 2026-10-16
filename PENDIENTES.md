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

1. [ ] Formularios que no pierden lo escrito (pieza única `useBorrador`), empezando por crear producto
2. [ ] Selector de idioma estilo Amazon (`SelectorIdioma`)
3. [ ] Compras a proveedor (entrada de mercancía que actualiza costo y stock)
4. [ ] Banner de la portada editable desde Mi tienda
5. [ ] Elegir color o talla en Vender
6. [ ] Cotización aceptada → venta con un toque
7. [ ] Aviso de pedido nuevo al celular del dueño
8. [ ] Docs estilo Wikipedia en `/docs` con el panel real (redirigir `/guia`)
9. [ ] Blindaje: vitest + playwright + prueba de humo + cabeceras de seguridad + gitleaks + `npm run verify`; pruebas de los candados de CANDADOS.md
10. [ ] Comprobante y cotización en PDF; reportes en Excel y PDF
11. [ ] Escáner de código de barras con la cámara
12. [ ] Funcionar sin señal (service worker)
13. [ ] Turnstile en entrar y crear cuenta (cuando lleguen las claves)
14. [ ] Carga por foto con IA (cuando llegue la clave)

## Hecho

- [x] 16 oct 2026 — Pedido con variante, envío del lado del servidor, solo productos publicados
- [x] 16 oct 2026 — Cancelar pedido con devolución de mercancía y salida del balance
- [x] 16 oct 2026 — Recibos de gastos privados
- [x] 16 oct 2026 — Destacar en portada, descripción en inglés, eliminar producto, foto nueva primero
- [x] 16 oct 2026 — Categorías: renombrar, inglés, ícono, ocultar
- [x] 16 oct 2026 — Vendedor sin edición de catálogo ni costos
- [x] 16 oct 2026 — Freno de intentos en la entrada
- [x] 16 oct 2026 — Franja de estado del trabajo + pantalla de Soporte
