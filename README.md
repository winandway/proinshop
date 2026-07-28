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
src/app/          Rutas de la tienda, favicon, tarjeta social y manifiesto PWA
src/componentes/  Componentes de pantalla
src/lib/          Datos, idiomas, tipos y configuración del negocio
db/schema.sql     Modelo de la base de datos (D1)
mockups/          Prototipo visual para revisar con el cliente
```

## Idiomas

Toda la tienda está en español e inglés, con selector de banderas arriba a la
derecha. El idioma se guarda en una cookie y el servidor pinta directo en ese
idioma. Si a un producto le falta la traducción, se muestra el español.

## Datos

Hoy el catálogo sale de `src/lib/catalogo-desarrollo.ts`, un archivo de trabajo
que se borra en la Etapa 3. Todas las funciones de `src/lib/catalogo.ts` ya son
asíncronas para que el cambio a D1 no obligue a tocar las pantallas.

## Variables de entorno

```
NEXT_PUBLIC_WHATSAPP=   # número de ventas, solo dígitos (ej. 15550100147)
```

Sin ese valor los botones de WhatsApp abren la aplicación sin destinatario.

---

© 2026 proinshop.com | All rights reserved. Developed by
[Windoce LLC](https://windoce.com)
