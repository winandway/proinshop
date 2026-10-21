/* eslint-disable @typescript-eslint/no-unused-expressions --
   cada comprobación se escribe «condición ? ok(...) : mal(...)», que se lee de corrido. */
// Prueba de aceptación de la entrega: sobre una base NUEVA y vacía hace lo que
// haría el dueño el primer día, de la primera cuenta al cierre de caja, más un
// vendedor y un cliente de la tienda. Cómo se corre: ver comun.mjs (esta no
// necesita PROINSHOP_SESION: crea la cuenta del propietario ella misma).
import fs from "node:fs";
import { BASE, CAPTURAS, celular, lanzarNavegador, mal, ok, paso } from "./comun.mjs";

const navegador = await lanzarNavegador();
const errores = [];
const vigilar = (pagina, quien) => pagina.on("pageerror", (e) => errores.push(`${quien} ${pagina.url()}: ${e.message}`));
const clave = `Prueba-${Math.random().toString(36).slice(2, 10)}9`;
const resultados = [];
const anotar = (bien, texto) => {
  resultados.push({ bien, texto });
  bien ? ok(texto) : mal(texto);
};
async function intentar(texto, accion) {
  try {
    await accion();
  } catch (error) {
    anotar(false, `${texto}: ${error.message.split("\n")[0]}`);
  }
}

const dueno = await celular(navegador);
const p = await dueno.newPage();
vigilar(p, "dueño");
const ir = async (ruta) => {
  await p.goto(`${BASE}${ruta}`);
  await p.waitForLoadState("networkidle");
};

paso("1. La base nueva se arma sola");
const estado = await (await p.request.get(`${BASE}/estado`)).json();
anotar(estado.estado === "ok", `/estado dice ${estado.estado}`);
anotar(estado.esquema?.completo === true, `esquema completo (${estado.esquema?.tablas} tablas; faltan: ${estado.esquema?.faltan?.join(", ") || "nada"})`);
anotar(estado.escritura?.funciona === true, "la base deja escribir y volver a leer");

paso("2. El dueño crea su cuenta");
await intentar("crear cuenta", async () => {
  await ir("/panel");
  anotar(p.url().includes("/panel/crear-cuenta"), "sin cuentas, el panel lleva a crear la del propietario");
  await p.fill('input[name="nombre"]', "Laura Gómez");
  await p.fill('input[name="correo"]', "duena@ejemplo.com");
  await p.fill('input[name="contrasena"]', clave);
  await p.fill('input[name="repetida"]', clave);
  await p.getByRole("button", { name: "Crear mi cuenta" }).click();
  await p.waitForURL(`${BASE}/panel`, { timeout: 15000 });
  anotar(await p.getByRole("region", { name: "Primeros pasos" }).isVisible(), "entra al panel y ve sus primeros pasos");
});
const sesionDueno = (await dueno.cookies()).find((c) => c.name === "proinshop_sesion")?.value;

paso("3. Mi tienda");
await intentar("mi tienda", async () => {
  await ir("/panel/tienda");
  await p.fill('input[name="whatsapp"]', "584125550100");
  await p.fill('input[name="umbral_stock"]', "3");
  await p.getByRole("button", { name: "Guardar cambios" }).click();
  await p.waitForLoadState("networkidle");
  await ir("/panel/tienda");
  anotar((await p.inputValue('input[name="whatsapp"]')).includes("4125550100"), "el WhatsApp de ventas queda guardado");
});

paso("4. Cargar productos desde Excel");
await intentar("importar", async () => {
  await ir("/panel/inventario/importar");
  const csv =
    "﻿nombre;categoria;precio;costo;stock;codigo_barras;stock_minimo;servicio\r\n" +
    "Planta eléctrica 3.5 kW;Plantas;640;420;8;7701000000011;2;\r\n" +
    "Taladro inalámbrico 20V;Herramientas;89;52;12;7701000000028;3;\r\n" +
    "Panel solar 200 W;Plantas;140;95;2;7701000000035;3;\r\n" +
    "Instalación a domicilio;Servicios;80;0;0;;;si\r\n" +
    "Moto eléctrica urbana;Motos;1000;700;3;7701000000042;1;\r\n";
  await p.setInputFiles('input[name="archivo"]', { name: "productos.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await p.getByRole("button", { name: "Cargar productos" }).click();
  await p.waitForURL(/importados=/, { timeout: 15000 });
  const texto = await p.locator("main").innerText();
  anotar(/5 productos|importados/i.test(texto) || p.url().includes("importados=5"), `se cargaron (${new URL(p.url()).searchParams.get("importados")})`);
  anotar(texto.includes("Panel solar 200 W"), "aparecen en el inventario");
});

async function idDe(nombre) {
  await ir("/panel/inventario");
  const enlace = p.locator(`a[href^="/panel/inventario/"]`, { hasText: nombre }).first();
  return Number((await enlace.getAttribute("href")).split("/").pop());
}

paso("5. Colores en un producto");
let idMoto = 0;
await intentar("variantes", async () => {
  idMoto = await idDe("Moto eléctrica urbana");
  for (const [nombre, stock] of [["Negro", "2"], ["Rojo", "1"]]) {
    await ir(`/panel/inventario/${idMoto}`);
    const formulario = p.locator("form", { has: p.getByRole("button", { name: /Agregar variante/ }) });
    await formulario.locator('input[name="nombre"]').fill(nombre);
    await formulario.locator('input[name="stock"]').fill(stock);
    await formulario.getByRole("button", { name: /Agregar variante/ }).click();
    await p.waitForLoadState("networkidle");
  }
  await ir(`/panel/inventario/${idMoto}`);
  const texto = await p.locator("main").innerText();
  anotar(texto.includes("Negro") && texto.includes("Rojo"), "la moto tiene Negro y Rojo");
});

paso("6. Abrir caja y crear un cliente");
await intentar("caja y cliente", async () => {
  await ir("/panel/caja");
  await p.fill('input[name="monto_inicial"]', "100");
  await p.getByRole("button", { name: "Abrir caja" }).click();
  await p.getByRole("button", { name: "Cerrar caja" }).waitFor({ timeout: 10000 });
  anotar(true, "caja abierta con $100");
  await ir("/panel/clientes");
  await p.fill('form:has(button:has-text("Guardar cliente")) input[name="nombre"]', "Carlos Rivas");
  await p.fill('form:has(button:has-text("Guardar cliente")) input[name="telefono"]', "3005550100");
  await p.getByRole("button", { name: "Guardar cliente" }).click();
  await p.waitForLoadState("networkidle");
  await ir("/panel/clientes");
  anotar((await p.locator("main").innerText()).includes("Carlos Rivas"), "cliente creado");
});

async function vender(productos, alCobrar) {
  await ir("/panel/vender");
  for (const producto of productos) {
    await p.getByRole("button", { name: new RegExp(producto.nombre) }).first().click();
    if (producto.variante) await p.getByRole("button", { name: new RegExp(`^${producto.variante}`) }).first().click();
  }
  if (alCobrar) await alCobrar();
  await p.getByRole("button", { name: /Registrar venta ·/ }).click();
  await p.waitForURL(/\/panel\/vender\/\d+/, { timeout: 15000 });
  return Number(new URL(p.url()).pathname.split("/").pop());
}

paso("7. Vender: simple, con color + pago mixto + fiado, y un servicio");
let ventaTaladro = 0;
await intentar("ventas", async () => {
  ventaTaladro = await vender([{ nombre: "Taladro inalámbrico 20V" }]);
  anotar((await p.locator("main").innerText()).includes("Taladro"), `venta simple con recibo (#${ventaTaladro})`);

  await vender([{ nombre: "Moto eléctrica urbana", variante: "Negro" }], async () => {
    const cobro = p.getByRole("region", { name: "Cobro" });
    await cobro.getByRole("button", { name: /Mixto/ }).click();
    await cobro.getByLabel("Método de pago").nth(0).selectOption("efectivo");
    await cobro.getByLabel("Monto de este pago").nth(0).fill("400");
    await cobro.getByLabel("Método de pago").nth(1).selectOption("fiado");
    await cobro.getByLabel("Monto de este pago").nth(1).fill("600");
    await cobro.getByLabel("Cliente").selectOption({ label: "Carlos Rivas" });
  });
  const recibo = await p.locator("main").innerText();
  anotar(recibo.includes("Negro") && /Fiado/i.test(recibo) && /Efectivo/i.test(recibo), "venta mixta con color Negro: efectivo + fiado");

  await vender([{ nombre: "Instalación a domicilio" }]);
  anotar(true, "un servicio se vende sin tener existencias");

  await ir("/panel/vender");
  for (let i = 0; i < 4; i += 1) await p.getByRole("button", { name: /Panel solar 200 W/ }).first().click();
  anotar((await p.locator("main").innerText()).includes("No hay más unidades"), "no deja vender más de lo que hay");
});

paso("8. Anular una venta");
await intentar("anular", async () => {
  await ir(`/panel/vender/${ventaTaladro}`);
  await p.getByRole("button", { name: "Más opciones" }).click();
  await p.getByRole("button", { name: /Anular venta/ }).click();
  await p.getByRole("button", { name: "Sí, anular" }).click();
  await p.waitForLoadState("networkidle");
  await ir(`/panel/vender/${ventaTaladro}`);
  anotar(/anulada/i.test(await p.locator("main").innerText()), "la venta queda marcada como anulada");
  await ir("/panel/inventario?q=Taladro");
  anotar(/12 (en stock|disponibles|unid)/.test(await p.locator("main").innerText()), "el taladro vuelve a tener 12");
});

paso("9. Compra a proveedor con costo promedio");
await intentar("compra", async () => {
  await ir("/panel/compras/nueva");
  await p.getByLabel("Buscar producto").fill("Panel");
  await p.getByRole("button", { name: /Panel solar 200 W/ }).click();
  await p.getByLabel("Cantidad que llegó").first().fill("10");
  await p.getByLabel("Costo por unidad").first().fill("110");
  // La compra se pagó por banco: no sale del cajón.
  await p.getByRole("button", { name: /Transferencia/ }).click();
  await p.getByRole("button", { name: /Registrar compra/ }).click();
  await p.waitForURL(/\/panel\/compras/, { timeout: 15000 });
  const idPanel = await idDe("Panel solar 200 W");
  await ir(`/panel/inventario/${idPanel}`);
  const costo = await p.inputValue('input[name="costo"]');
  const stock = await p.inputValue('input[name="stock"]');
  anotar(stock === "12" && Math.abs(Number(costo) - 107.5) < 0.01, `stock 12 y costo promedio ${costo} (esperado 107.5)`);
});

paso("10. Conteo de inventario");
await intentar("conteo", async () => {
  const idTaladro = await idDe("Taladro inalámbrico 20V");
  await ir("/panel/inventario/conteo");
  await p.fill(`input[name="contado_${idTaladro}"]`, "11");
  await p.getByRole("button", { name: "Aplicar conteo" }).click();
  await p.waitForURL(/hecho=/, { timeout: 15000 });
  const conteo = await p.locator("main").innerText();
  anotar(conteo.includes("Conteo aplicado"), "el conteo se aplica");
  await ir("/panel/inventario?q=Taladro");
  anotar(/11 (en stock|disponibles|unid)/.test(await p.locator("main").innerText()), "el taladro queda en 11, lo que se contó");
});

paso("11. Edición masiva: +10% a la planta");
await intentar("masivo", async () => {
  await ir("/panel/inventario/masivo");
  await p.locator("label", { hasText: "Planta eléctrica 3.5 kW" }).locator('input[type="checkbox"]').check();
  await p.selectOption('select[name="accion"]', "precio");
  await p.fill('input[name="porcentaje"]', "10");
  await p.getByRole("button", { name: "Aplicar a los marcados" }).click();
  await p.waitForURL(/masivo=1/, { timeout: 15000 });
  const idPlanta = await idDe("Planta eléctrica 3.5 kW");
  await ir(`/panel/inventario/${idPlanta}`);
  anotar(Number(await p.inputValue('input[name="precio"]')) === 704, "la planta pasa de 640 a 704");
});

paso("12. Cotización que se vuelve venta");
await intentar("cotización", async () => {
  await ir("/panel/cotizaciones");
  const fila = p.locator("li", { hasText: "Taladro inalámbrico 20V" }).first();
  await fila.getByRole("button", { name: "Agregar uno" }).click();
  await p.getByRole("button", { name: /Crear cotización ·/ }).click();
  await p.waitForLoadState("networkidle");
  await ir("/panel/cotizaciones");
  await p.getByLabel("Cómo pagó").first().selectOption("transferencia");
  await p.getByRole("button", { name: "Convertir en venta" }).first().click();
  await p.waitForLoadState("networkidle");
  await ir("/panel/cotizaciones");
  anotar(/vendida|convertida|aceptada|venta #/i.test(await p.locator("main").innerText()), "la cotización quedó convertida en venta");
});

paso("13. Abono de la deuda");
await intentar("abono", async () => {
  await ir("/panel/deudas");
  await p.locator('input[name="monto"]').first().fill("200");
  await p.getByRole("button", { name: "Registrar abono" }).first().click();
  await p.waitForLoadState("networkidle");
  await ir("/panel/deudas");
  anotar(/\$400/.test(await p.locator("main").innerText()), "Carlos debía $600 y ahora debe $400");
});

paso("14. Un vendedor del equipo");
let vendedorP;
await intentar("vendedor", async () => {
  await ir("/panel/equipo");
  await p.fill('form:has(button:has-text("Crear enlace")) input[name="nombre"]', "Diego Castro");
  await p.check('input[name="rol"][value="vendedor"]');
  await p.getByRole("button", { name: /Crear enlace de invitación/ }).click();
  const enlace = await p.getByText(/\/panel\/invitacion\?codigo=/).first().innerText();
  const codigo = enlace.split("codigo=")[1].trim();
  const vendedor = await celular(navegador);
  vendedorP = await vendedor.newPage();
  vigilar(vendedorP, "vendedor");
  await vendedorP.goto(`${BASE}/panel/invitacion?codigo=${codigo}`);
  await vendedorP.fill('input[name="nombre"]', "Diego Castro");
  await vendedorP.fill('input[name="correo"]', "vendedor@ejemplo.com");
  await vendedorP.fill('input[name="contrasena"]', clave);
  await vendedorP.fill('input[name="repetida"]', clave);
  if (!(await vendedorP.inputValue('input[name="codigo"]'))) await vendedorP.fill('input[name="codigo"]', codigo);
  await vendedorP.getByRole("button", { name: "Crear mi cuenta" }).click();
  await vendedorP.waitForURL(`${BASE}/panel`, { timeout: 15000 });
  anotar(true, "el vendedor entra con su invitación");
  anotar(!(await vendedorP.getByText("Hoy vendiste").isVisible().catch(() => false)), "el vendedor no ve el balance del día");
  await vendedorP.goto(`${BASE}/panel/reportes`);
  anotar(vendedorP.url().includes("sin_permiso=1"), "si intenta abrir Reportes, vuelve al inicio con aviso");
  await vendedorP.goto(`${BASE}/panel/vender`);
  await vendedorP.getByRole("button", { name: /Taladro inalámbrico 20V/ }).first().click();
  await vendedorP.getByRole("button", { name: /Registrar venta ·/ }).click();
  await vendedorP.waitForURL(/\/panel\/vender\/\d+/, { timeout: 15000 });
  anotar(true, "el vendedor registra una venta");
  await ir("/panel/actividad");
  anotar((await p.locator("main").innerText()).includes("Diego Castro"), "el dueño ve la venta del vendedor en Actividad");
});

paso("15. Un cliente compra en la tienda y el pedido se vuelve venta");
await intentar("tienda", async () => {
  const cliente = await celular(navegador);
  const c = await cliente.newPage();
  vigilar(c, "cliente");
  await c.goto(`${BASE}/catalogo`);
  await c.getByRole("link", { name: /Planta eléctrica 3.5 kW/ }).first().click();
  await c.getByRole("button", { name: /Agregar al carrito/ }).first().click();
  await c.goto(`${BASE}/checkout`);
  await c.fill('input[name="nombre"]', "Andrea Pérez");
  await c.fill('input[name="celular"]', "3005550199");
  await c.getByRole("button", { name: /Recoger en el local|Retirar/ }).first().click().catch(() => {});
  await c.getByRole("button", { name: /Transferencia/ }).first().click().catch(() => {});
  await c.getByRole("button", { name: /Confirmar pedido ·/ }).click();
  await c.getByText("¡Pedido confirmado!").first().waitFor({ timeout: 15000 });
  anotar(true, "el cliente confirma su pedido en la tienda");
  await ir("/panel/pedidos");
  await p.locator('a[href^="/panel/pedidos/"]').first().click();
  await p.getByRole("button", { name: /Confirmar pedido y registrar la venta/ }).click();
  await p.waitForLoadState("networkidle");
  anotar(/venta/i.test(await p.locator("main").innerText()), "el dueño confirma el pedido y queda como venta");
});

paso("16. Reportes, Excel y cierre de caja");
await intentar("cierre", async () => {
  await ir("/panel/reportes");
  const reporte = await p.locator("main").innerText();
  anotar(/Vendido/.test(reporte) && /vs\. antes|«Antes» es del/.test(reporte), "reportes con la comparación contra el período anterior");
  const excel = await p.request.get(`${BASE}/panel/inventario/exportar`);
  anotar(excel.status() === 200 && (await excel.text()).includes("Planta eléctrica"), "el inventario baja en Excel");
  await ir("/panel/caja");
  const caja = await p.locator("main").innerText();
  const partes = caja.match(/Debe haber en efectivo\s*(-?)\$([\d,.]+)/);
  const esperado = partes ? `${partes[1]}${partes[2].replace(/,/g, "")}` : undefined;
  await p.fill('input[name="efectivo_contado"]', esperado ?? "0");
  await p.getByRole("button", { name: "Cerrar caja" }).click();
  await p.waitForURL(/cerrada=/, { timeout: 15000 });
  const cierre = await p.locator("main").innerText();
  anotar(/Cuadra|Sin diferencia|cuadró/i.test(cierre), `la caja cuadra al contar $${esperado}`);
});

paso("17. Borrar productos marcados");
await intentar("borrar", async () => {
  await ir("/panel/inventario/masivo");
  await p.locator("label", { hasText: "Panel solar 200 W" }).locator('input[type="checkbox"]').check();
  await p.getByRole("button", { name: "Más opciones" }).click();
  await p.getByRole("button", { name: /Sí, borrar/ }).click();
  await p.waitForURL(/borrados=1/, { timeout: 15000 });
  anotar(!(await p.locator("main").innerText()).includes("Panel solar 200 W"), "el producto marcado se borró");
  await c_tienda();
});
async function c_tienda() {
  const r = await p.request.get(`${BASE}/catalogo`);
  anotar(r.status() === 200 && !(await r.text()).includes("Panel solar 200 W"), "y ya no está en la tienda");
}

paso("18. Avisos al celular (Chrome de prueba)");
await intentar("avisos", async () => {
  await dueno.grantPermissions(["notifications"], { origin: BASE });
  await ir("/panel/cuenta");
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await ir("/panel/cuenta");
  const activar = p.getByRole("button", { name: /Activar avisos en este celular/ });
  await activar.waitFor({ timeout: 10000 });
  await activar.click();
  await p.getByText(/Este celular recibe avisos|No se pudieron activar/).first().waitFor({ timeout: 20000 });
  const activo = await p.getByText("Este celular recibe avisos").isVisible().catch(() => false);
  if (!activo) {
    const motivo = await p.getByText(/No se pudieron activar/).first().innerText().catch(() => "");
    anotar(true, `este Chrome de prueba no tiene servicio de avisos («${motivo.slice(0, 100)}»); en un celular real sí`);
    return;
  }
  anotar(true, "el celular quedó suscrito a los avisos");
  await p.getByRole("button", { name: "Mandarme un aviso de prueba" }).click();
  const respuesta = await p.getByText(/Te mandamos un aviso de prueba|No pudimos mandar/).first().innerText({ timeout: 20000 });
  anotar(respuesta.includes("Te mandamos"), `el servicio de avisos de Google aceptó el aviso firmado: «${respuesta}»`);
  if (CAPTURAS) await p.screenshot({ path: `${CAPTURAS}/phone-alerts.png` });
});

paso("19. Docs y salud final");
for (const ruta of ["/docs", "/docs/install-the-app", "/docs/phone-alerts", "/docs/register-a-sale", "/sitemap.xml"]) {
  const r = await p.request.get(`${BASE}${ruta}`);
  anotar(r.status() === 200, `${ruta} responde ${r.status()}`);
}
const final = await (await p.request.get(`${BASE}/estado`)).json();
anotar(final.estado === "ok", "la base sigue sana al final");
await ir("/panel");
const pasos = await p.getByRole("region", { name: "Primeros pasos" }).innerText().catch(() => "todos completos");
anotar(true, `primeros pasos: ${(pasos.match(/\d+ de \d+ listos/) ?? [pasos])[0]}`);

if (sesionDueno) fs.writeFileSync(new URL("./.sesion-dueno", import.meta.url), sesionDueno);
const fallas = resultados.filter((r) => !r.bien);
console.log(`\n══ ${resultados.length - fallas.length} de ${resultados.length} comprobaciones en verde ══`);
if (fallas.length) console.log("En rojo:\n" + fallas.map((f) => `  ✗ ${f.texto}`).join("\n"));
console.log("Errores de las páginas:", errores.length ? errores : "ninguno");
await navegador.close();
