import type { Texto } from "./tipos";

/**
 * Las guías públicas de Docs. Cada una es su propia página con dirección fija
 * en inglés (/docs/register-a-sale), en español y en inglés, escrita para el
 * dueño del negocio y su equipo: qué es, para qué sirve y cómo se usa.
 *
 * Aquí no va nada interno: ni nombres de tablas, ni direcciones privadas, ni
 * proveedores. Lo de adentro se cuenta como «Proinshop».
 */

export type Bloque =
  | { tipo: "parrafo"; texto: Texto }
  | { tipo: "subtitulo"; texto: Texto }
  | { tipo: "pasos"; pasos: Texto[] }
  | { tipo: "lista"; puntos: Texto[] }
  | { tipo: "nota"; texto: Texto }
  | { tipo: "captura"; archivo: string; alt: Texto };

export type SeccionDocs = { id: string; icono: string; titulo: Texto };

export type Guia = {
  slug: string;
  seccion: string;
  icono: string;
  titulo: Texto;
  resumen: Texto;
  bloques: Bloque[];
  relacionadas?: string[];
};

export const SECCIONES_DOCS: SeccionDocs[] = [
  { id: "empezar", icono: "🚀", titulo: { es: "Primeros pasos", en: "Getting started" } },
  { id: "vender", icono: "💵", titulo: { es: "Vender y cobrar", en: "Selling and payments" } },
  { id: "inventario", icono: "📦", titulo: { es: "Inventario", en: "Inventory" } },
  { id: "clientes", icono: "👥", titulo: { es: "Clientes y cobros", en: "Customers and collections" } },
  { id: "numeros", icono: "📊", titulo: { es: "Números del negocio", en: "Business numbers" } },
  { id: "tienda", icono: "🏪", titulo: { es: "Tienda en línea", en: "Online store" } },
];

const t = (es: string, en: string): Texto => ({ es, en });

export const GUIAS: Guia[] = [
  // ─── Primeros pasos ──────────────────────────────────────────────────────
  {
    slug: "getting-started",
    seccion: "empezar",
    icono: "👋",
    titulo: t("Crear tu cuenta y entrar al panel", "Create your account and sign in"),
    resumen: t(
      "Cómo se crea la cuenta del propietario, cómo entra tu equipo y qué hacer si alguien olvida su contraseña.",
      "How the owner account is created, how your team signs in, and what to do if someone forgets a password.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "El panel de Proinshop es donde administras tu negocio: ventas, inventario, clientes, caja y tu tienda en línea. Todo lo que registras aquí se publica solo en tu tienda.",
          "The Proinshop dashboard is where you run your business: sales, inventory, customers, cash register and your online store. Everything you record here is published to your store automatically.",
        ),
      },
      { tipo: "subtitulo", texto: t("La primera vez: la cuenta del propietario", "The first time: the owner account") },
      {
        tipo: "pasos",
        pasos: [
          t("Abre el panel desde la dirección de tu tienda, agregando /panel al final.", "Open the dashboard from your store address, adding /panel at the end."),
          t("Como todavía no hay ninguna cuenta, verás «Crear cuenta». Escribe tu nombre, tu correo y una contraseña.", "Since there are no accounts yet, you'll see “Create account”. Enter your name, your email and a password."),
          t("Listo: entras directo al panel como Propietario, con acceso a todo.", "That's it: you go straight into the dashboard as the Owner, with access to everything."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "Solo la primera persona crea su cuenta así. Después, nadie más puede registrarse por su cuenta: el propietario invita a cada persona desde Equipo.",
          "Only the first person creates an account this way. After that, nobody can sign up on their own: the owner invites each person from Team.",
        ),
      },
      { tipo: "subtitulo", texto: t("Entrar los demás días", "Signing in after that") },
      {
        tipo: "parrafo",
        texto: t(
          "Escribe tu correo y tu contraseña, o toca «Entrar con huella o cara» si ya la activaste en ese dispositivo. La sesión dura 30 días en ese celular o computadora, salvo que toques «Salir».",
          "Enter your email and password, or tap “Sign in with fingerprint or face” if you already turned it on for that device. Your session lasts 30 days on that phone or computer unless you tap “Sign out”.",
        ),
      },
      { tipo: "subtitulo", texto: t("Si alguien olvida su contraseña", "If someone forgets their password") },
      {
        tipo: "parrafo",
        texto: t(
          "El propietario entra a Equipo, abre a esa persona y genera un enlace para que cree una contraseña nueva. Ese enlace sirve una sola vez y vence pronto, así que conviene mandarlo enseguida por WhatsApp.",
          "The owner opens Team, picks that person and creates a link to set a new password. The link works only once and expires soon, so send it right away over WhatsApp.",
        ),
      },
      {
        tipo: "nota",
        texto: t(
          "Después de cinco contraseñas equivocadas seguidas, la entrada se frena por 15 minutos. Es una protección contra quien intenta adivinar claves.",
          "After five wrong passwords in a row, sign-in pauses for 15 minutes. It protects you from anyone trying to guess passwords.",
        ),
      },
    ],
    relacionadas: ["fingerprint-login", "team-and-permissions"],
  },
  {
    slug: "fingerprint-login",
    seccion: "empezar",
    icono: "🔐",
    titulo: t("Entrar con huella o cara", "Sign in with fingerprint or face"),
    resumen: t(
      "Activa la huella, la cara o el PIN de tu celular para entrar sin escribir la contraseña.",
      "Turn on your phone's fingerprint, face or PIN to sign in without typing your password.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "En vez de escribir la contraseña, entras con lo mismo que usas para desbloquear tu celular o tu computadora: la huella, la cara o el PIN. Es más rápido y más seguro, porque no hay contraseña que alguien pueda ver o robar.",
          "Instead of typing your password, you sign in the same way you unlock your phone or computer: fingerprint, face or PIN. It's faster and safer, because there's no password anyone can see or steal.",
        ),
      },
      { tipo: "subtitulo", texto: t("Activarla", "Turn it on") },
      {
        tipo: "pasos",
        pasos: [
          t("Entra al panel con tu correo y contraseña desde el celular o la computadora que vas a usar.", "Sign in with your email and password on the phone or computer you'll use."),
          t("Ve a Explorar → Mi cuenta.", "Go to Explore → My account."),
          t("En «Entrar con huella o cara», toca «Activar en este dispositivo».", "Under “Sign in with fingerprint or face”, tap “Turn on for this device”."),
          t("Tu celular te pide la huella o la cara. Confirma y listo: aparece en la lista con el nombre del dispositivo.", "Your phone asks for your fingerprint or face. Confirm and you're done: the device shows up in the list."),
        ],
      },
      { tipo: "captura", archivo: "fingerprint-login.png", alt: t("Mi cuenta con la huella activada", "My account with fingerprint sign-in turned on") },
      { tipo: "subtitulo", texto: t("Usarla", "Use it") },
      {
        tipo: "parrafo",
        texto: t(
          "En la pantalla de entrar, toca «Entrar con huella o cara». Ni siquiera hace falta escribir el correo: tu dispositivo sabe cuál es tu cuenta.",
          "On the sign-in screen, tap “Sign in with fingerprint or face”. You don't even need to type your email: your device knows which account is yours.",
        ),
      },
      {
        tipo: "lista",
        puntos: [
          t("Se activa en cada dispositivo por separado: el celular y la computadora, cada uno una vez.", "Turn it on separately on each device: your phone and your computer, once each."),
          t("Tu huella nunca sale de tu celular. Proinshop no la ve ni la guarda.", "Your fingerprint never leaves your phone. Proinshop never sees or stores it."),
          t("Si pierdes un celular, quítalo de la lista con los tres puntos ⋮ desde otro dispositivo.", "If you lose a phone, remove it from the list with the three dots ⋮ from another device."),
          t("Tu contraseña sigue funcionando siempre, por si la necesitas.", "Your password keeps working, in case you need it."),
        ],
      },
    ],
    relacionadas: ["getting-started"],
  },
  {
    slug: "team-and-permissions",
    seccion: "empezar",
    icono: "🧑‍🤝‍🧑",
    titulo: t("Equipo y permisos", "Team and permissions"),
    resumen: t(
      "Invita a tus vendedores y a tu bodega, y decide qué puede ver y hacer cada persona.",
      "Invite your salespeople and warehouse staff, and decide what each person can see and do.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Cada persona de tu equipo entra con su propia cuenta. Así sabes quién vendió qué, y cada uno ve solo lo que le toca. Por ejemplo, un vendedor puede vender sin ver tus costos ni tu ganancia.",
          "Each person on your team signs in with their own account. That way you know who sold what, and everyone sees only what they need. For example, a salesperson can sell without seeing your costs or profit.",
        ),
      },
      { tipo: "subtitulo", texto: t("Invitar a alguien", "Invite someone") },
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Explorar → Equipo y permisos.", "Go to Explore → Team and permissions."),
          t("En «Invitar a alguien», escribe su nombre, elige el rol (Vendedor o Bodega) y crea la invitación.", "Under “Invite someone”, enter their name, pick the role (Salesperson or Warehouse) and create the invitation."),
          t("Mándale el enlace por WhatsApp. La persona lo abre, escribe su nombre, su correo y su contraseña, y ya entra.", "Send the link over WhatsApp. They open it, enter their name, email and password, and they're in."),
        ],
      },
      { tipo: "subtitulo", texto: t("Qué trae cada rol", "What each role includes") },
      {
        tipo: "lista",
        puntos: [
          t("Propietario: todo, siempre.", "Owner: everything, always."),
          t("Vendedor: vender, caja, pedidos de la tienda, clientes y cotizaciones.", "Salesperson: selling, cash register, store orders, customers and quotes."),
          t("Bodega: vender, pedidos, productos, compras, conteo de inventario y gastos.", "Warehouse: selling, orders, products, purchases, stock counts and expenses."),
        ],
      },
      { tipo: "subtitulo", texto: t("Ajustar los permisos de una persona", "Adjust one person's permissions") },
      {
        tipo: "parrafo",
        texto: t(
          "En Equipo, abre «Rol y permisos» de esa persona y prende o apaga cada módulo: anular ventas, ver costos y ganancia, reportes, compras y los demás. Se guarda al momento y la próxima pantalla que abra ya lo respeta.",
          "In Team, open that person's “Role and permissions” and switch each module on or off: voiding sales, seeing costs and profit, reports, purchases and the rest. It saves instantly and the next screen they open already follows it.",
        ),
      },
      { tipo: "captura", archivo: "team-and-permissions.png", alt: t("Permisos de una persona del equipo", "A team member's permissions") },
      {
        tipo: "nota",
        texto: t(
          "Si alguien intenta abrir una sección sin permiso, vuelve al inicio con un aviso claro: «Tu cuenta no tiene permiso para esa sección». Nunca ve una pantalla en blanco.",
          "If someone opens a section without permission, they go back to the home screen with a clear notice. They never see a blank screen.",
        ),
      },
    ],
    relacionadas: ["getting-started", "activity-and-alerts"],
  },

  // ─── Vender y cobrar ─────────────────────────────────────────────────────
  {
    slug: "register-a-sale",
    seccion: "vender",
    icono: "🧾",
    titulo: t("Registrar una venta", "Record a sale"),
    resumen: t(
      "Busca o escanea productos, elige color o talla, cobra y comparte el recibo por WhatsApp.",
      "Search or scan products, pick a color or size, take payment and share the receipt over WhatsApp.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Cada venta descuenta el inventario, suma al balance del día y queda en el historial del cliente. Lo que pones en el carrito se guarda solo: si se cierra la ventana a mitad de una venta, al volver está igual.",
          "Every sale updates your inventory, adds to the day's balance and is saved in the customer's history. Your cart saves itself: if the window closes halfway through a sale, it's right there when you come back.",
        ),
      },
      {
        tipo: "pasos",
        pasos: [
          t("Toca «Registrar venta» en el inicio.", "Tap “Record sale” on the home screen."),
          t("Busca el producto por nombre, código de barras o SKU, o toca «Escanear» para leerlo con la cámara. Un lector de códigos de los de mostrador también funciona.", "Search by name, barcode or SKU, or tap “Scan” to read it with the camera. A countertop barcode reader works too."),
          t("Si el producto tiene colores o tallas, elige cuál. Usa + y − para la cantidad.", "If the product has colors or sizes, pick one. Use + and − for the quantity."),
          t("Si quieres, elige el cliente, pon un descuento o escribe una nota.", "Optionally pick the customer, add a discount or write a note."),
          t("En «¿Cómo te pagan?», elige el método y toca «Registrar venta».", "Under “How are they paying?”, choose the method and tap “Record sale”."),
        ],
      },
      { tipo: "captura", archivo: "register-a-sale.png", alt: t("Pantalla de registrar venta", "Record sale screen") },
      { tipo: "subtitulo", texto: t("El recibo", "The receipt") },
      {
        tipo: "parrafo",
        texto: t(
          "Al terminar ves el recibo de la venta. Desde ahí lo mandas por WhatsApp o por correo, o lo imprimes o guardas como PDF.",
          "When you're done you'll see the receipt. From there you can send it over WhatsApp or email, or print it or save it as a PDF.",
        ),
      },
      {
        tipo: "lista",
        puntos: [
          t("No te deja vender más unidades de las que hay. Los servicios no llevan inventario.", "It won't let you sell more units than you have. Services don't track inventory."),
          t("Los precios siempre salen de tu inventario: nadie los puede cambiar desde la pantalla de venta.", "Prices always come from your inventory: nobody can change them from the sale screen."),
          t("Si tienes una segunda moneda configurada, el total se muestra también en esa moneda.", "If you set up a second currency, the total also shows in that currency."),
        ],
      },
    ],
    relacionadas: ["split-payments-and-credit", "void-a-sale", "offline-mode"],
  },
  {
    slug: "split-payments-and-credit",
    seccion: "vender",
    icono: "🔀",
    titulo: t("Pago mixto y venta fiada", "Split payments and store credit"),
    resumen: t(
      "Cobra una venta con varios métodos a la vez y deja una parte fiada para cobrarla después.",
      "Take one sale with several payment methods and leave part of it on credit to collect later.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Hay clientes que pagan una parte en efectivo y otra por transferencia, o que se llevan la mercancía y pagan una parte después. El pago mixto lo registra tal cual pasó, y tu caja y tus reportes cuadran.",
          "Some customers pay part in cash and part by bank transfer, or take the goods and pay part of it later. Split payment records it exactly as it happened, so your cash register and reports add up.",
        ),
      },
      {
        tipo: "pasos",
        pasos: [
          t("En la venta, en «¿Cómo te pagan?», toca «Mixto».", "In the sale, under “How are they paying?”, tap “Split” (Mixto)."),
          t("Escribe cuánto se pagó con cada método: efectivo, transferencia, tarjeta o fiado. Puedes agregar más filas.", "Enter how much was paid with each method: cash, transfer, card or credit. You can add more rows."),
          t("La pantalla te dice cuánto falta o cuánto sobra. Cuando cuadra con el total, toca «Registrar venta».", "The screen tells you how much is missing or left over. When it matches the total, tap “Record sale”."),
        ],
      },
      { tipo: "captura", archivo: "split-payments-and-credit.png", alt: t("Venta con pago mixto", "Sale with split payment") },
      { tipo: "subtitulo", texto: t("La parte fiada", "The credit part") },
      {
        tipo: "parrafo",
        texto: t(
          "Si una parte es fiada, tienes que elegir el cliente. Esa parte queda en Cuentas por cobrar con vencimiento a 30 días, y el resto cuenta como pagado.",
          "If part of the sale is on credit, you need to pick the customer. That part goes to Accounts receivable, due in 30 days, and the rest counts as paid.",
        ),
      },
    ],
    relacionadas: ["receivables", "cash-register"],
  },
  {
    slug: "void-a-sale",
    seccion: "vender",
    icono: "↩️",
    titulo: t("Anular una venta", "Void a sale"),
    resumen: t(
      "Si una venta se registró por error, anúlala: la mercancía vuelve al inventario y deja de contar en el balance.",
      "If a sale was recorded by mistake, void it: the goods go back to inventory and it stops counting in your balance.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Abre la venta desde el historial o desde el recibo.", "Open the sale from the history or from the receipt."),
          t("Toca los tres puntos ⋮ y elige «Anular venta».", "Tap the three dots ⋮ and choose “Void sale”."),
          t("Confirma. Los productos vuelven al inventario, la deuda que había creado se borra y la venta deja de sumar.", "Confirm. The products go back to inventory, any credit it created is removed, and the sale stops counting."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "La venta no desaparece: queda marcada como anulada, para que siempre puedas ver qué pasó. Solo puede anular quien tenga ese permiso.",
          "The sale doesn't disappear: it's marked as voided, so you can always see what happened. Only people with that permission can void sales.",
        ),
      },
    ],
    relacionadas: ["register-a-sale", "team-and-permissions"],
  },
  {
    slug: "cash-register",
    seccion: "vender",
    icono: "🗄",
    titulo: t("Abrir y cerrar caja", "Open and close the cash register"),
    resumen: t(
      "Empieza el día con el efectivo que hay, ciérralo contando, y Proinshop te dice si sobra o falta.",
      "Start the day with the cash on hand, close it by counting, and Proinshop tells you if anything is over or short.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Al empezar el día, ve a Caja y escribe con cuánto efectivo abres.", "When the day starts, go to Cash register and enter how much cash you open with."),
          t("Vende normalmente. Caja va sumando el efectivo de las ventas y de los abonos, y restando los gastos y las compras pagadas en efectivo.", "Sell as usual. The register adds cash from sales and payments received, and subtracts expenses and purchases paid in cash."),
          t("Al cerrar, cuenta los billetes y escribe cuánto hay.", "At closing time, count the bills and enter the amount."),
          t("Proinshop compara lo contado con lo esperado y te dice si cuadra, si sobra o si falta, y cuánto.", "Proinshop compares what you counted with what was expected and tells you whether it matches, is over or is short, and by how much."),
        ],
      },
      { tipo: "captura", archivo: "cash-register.png", alt: t("Cierre de caja", "Closing the register") },
      {
        tipo: "nota",
        texto: t(
          "Cada apertura y cierre queda guardado con quién lo hizo y a qué hora. El propietario lo ve en Actividad.",
          "Every opening and closing is saved with who did it and when. The owner can see it in Activity.",
        ),
      },
    ],
    relacionadas: ["register-a-sale", "balance-and-expenses"],
  },
  {
    slug: "offline-mode",
    seccion: "vender",
    icono: "📶",
    titulo: t("Vender sin señal", "Selling offline"),
    resumen: t(
      "Si se va el internet, el panel sigue abriendo y las ventas se guardan en tu dispositivo hasta que vuelva la señal.",
      "If the internet goes down, the dashboard keeps opening and sales are saved on your device until you're back online.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "En una tienda la señal se cae. Proinshop guarda en tu celular o computadora una copia de las pantallas que usas, y si cobras sin internet, la venta queda guardada y se envía sola cuando vuelve la conexión.",
          "In a store, the signal drops. Proinshop keeps a copy of the screens you use on your phone or computer, and if you charge a sale offline, it's saved and sent automatically when you're back online.",
        ),
      },
      {
        tipo: "pasos",
        pasos: [
          t("Abre el panel con internet al empezar el día. Eso deja listas las pantallas de vender e inventario.", "Open the dashboard while online at the start of the day. That gets the sell and inventory screens ready."),
          t("Si se va la señal, arriba aparece «Sin señal». Puedes seguir vendiendo igual.", "If the signal drops, you'll see “Offline” at the top. You can keep selling."),
          t("Al registrar la venta, verás «Venta guardada sin señal».", "When you record the sale, you'll see “Sale saved offline”."),
          t("Cuando vuelve el internet, las ventas guardadas se envían solas y verás «Se enviaron las ventas hechas sin señal». Ya están en el balance con la hora en que se vendieron.", "When you're back online, saved sales are sent automatically and you'll see a confirmation. They show up in your balance with the time they were made."),
        ],
      },
      { tipo: "captura", archivo: "offline-mode.png", alt: t("Panel sin señal", "Dashboard while offline") },
      {
        tipo: "lista",
        puntos: [
          t("Una venta nunca se guarda dos veces, aunque se corte la señal a mitad del envío.", "A sale is never saved twice, even if the signal drops halfway through sending it."),
          t("Si mientras tanto se agotó un producto, la venta se registra igual: la mercancía ya salió.", "If a product sold out in the meantime, the sale is still recorded: the goods already left the store."),
          t("Si una venta no se puede guardar (por ejemplo, el producto se borró), te avisa por qué y puedes reintentarla o descartarla.", "If a sale can't be saved (for example, the product was deleted), you'll see why and can retry or discard it."),
          t("Sin señal no se pueden crear productos ni ver reportes nuevos: eso necesita internet.", "Creating products and seeing new reports need an internet connection."),
        ],
      },
    ],
    relacionadas: ["register-a-sale", "cash-register"],
  },
  {
    slug: "quotes",
    seccion: "vender",
    icono: "📄",
    titulo: t("Cotizaciones", "Quotes"),
    resumen: t(
      "Arma una cotización, compártela con un enlace y conviértela en venta con un toque cuando el cliente acepta.",
      "Build a quote, share it with a link, and turn it into a sale with one tap when the customer accepts.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Cotizaciones y crea una nueva: elige el cliente y los productos. La cotización vale por 15 días.", "Go to Quotes and create a new one: pick the customer and the products. The quote is valid for 15 days."),
          t("Comparte el enlace por WhatsApp. El cliente ve la cotización con tu marca y la puede imprimir o guardar como PDF.", "Share the link over WhatsApp. The customer sees the quote with your branding and can print it or save it as a PDF."),
          t("Cuando acepte, elige cómo te pagó y toca «Convertir en venta». Se registra la venta y se descuenta el inventario.", "When they accept, choose how they paid and tap “Turn into sale”. The sale is recorded and inventory is updated."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "Si al convertirla ya no hay unidades suficientes, Proinshop te avisa antes de hacer nada.",
          "If there aren't enough units left when you convert it, Proinshop warns you before doing anything.",
        ),
      },
    ],
    relacionadas: ["register-a-sale", "customers"],
  },
  {
    slug: "store-orders",
    seccion: "vender",
    icono: "🛒",
    titulo: t("Pedidos de la tienda en línea", "Online store orders"),
    resumen: t(
      "Los pedidos de tu tienda llegan al panel con aviso al momento. Confírmalos y se vuelven ventas.",
      "Orders from your store arrive in the dashboard with an instant alert. Confirm them and they become sales.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Cuando alguien compra en tu tienda, el pedido aparece en Pedidos con un punto rojo, y si tienes el panel abierto te sale un aviso al momento, aunque estés en otra pantalla.",
          "When someone buys from your store, the order shows up in Orders with a red dot, and if the dashboard is open you get an instant alert, even on another screen.",
        ),
      },
      {
        tipo: "pasos",
        pasos: [
          t("Abre el pedido para ver qué pidió, cómo paga y adónde se envía.", "Open the order to see what was ordered, how they're paying and where it ships."),
          t("Cuando confirmes el pago, toca «Confirmar pedido y registrar la venta»: se convierte en venta y se descuenta el inventario.", "Once payment is confirmed, tap “Confirm order and record the sale”: it becomes a sale and inventory is updated."),
          t("Ve cambiando el estado (preparando, enviado, entregado) para llevar el control.", "Update the status (preparing, shipped, delivered) to keep track."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "Para recibir el aviso aunque el panel esté en otra pestaña, toca «Activar notificaciones en este equipo» y acepta las notificaciones del navegador.",
          "To get alerts even when the dashboard is in another tab, tap “Turn on notifications on this device” and allow browser notifications.",
        ),
      },
    ],
    relacionadas: ["activity-and-alerts", "online-store"],
  },

  // ─── Inventario ──────────────────────────────────────────────────────────
  {
    slug: "products-and-variants",
    seccion: "inventario",
    icono: "📦",
    titulo: t("Productos, variantes y servicios", "Products, variants and services"),
    resumen: t(
      "Crea productos con foto, precio y existencias, agrega colores o tallas, y registra servicios que no llevan inventario.",
      "Create products with a photo, price and stock, add colors or sizes, and record services that don't track inventory.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Inventario y toca «Cargar producto».", "Go to Inventory and tap “Add product”."),
          t("Toma o sube la foto, escribe el nombre en español y en inglés, el precio, el costo y cuántas unidades tienes.", "Take or upload a photo, enter the name in Spanish and English, the price, the cost and how many units you have."),
          t("Si viene en colores o tallas, agrégalos como variantes, cada uno con sus unidades.", "If it comes in colors or sizes, add them as variants, each with its own units."),
          t("Elige la categoría y guarda. Si está marcado como publicado, ya aparece en tu tienda.", "Choose the category and save. If it's marked as published, it's already in your store."),
        ],
      },
      { tipo: "captura", archivo: "products-and-variants.png", alt: t("Lista de inventario", "Inventory list") },
      { tipo: "subtitulo", texto: t("Servicios", "Services") },
      {
        tipo: "parrafo",
        texto: t(
          "Marca «Es un servicio» para cosas como instalación, envío o mantenimiento. Se venden igual, pero no tienen existencias que se agoten.",
          "Check “This is a service” for things like installation, delivery or maintenance. They sell the same way, but have no stock to run out.",
        ),
      },
      { tipo: "subtitulo", texto: t("Aviso de pocas unidades", "Low stock alert") },
      {
        tipo: "parrafo",
        texto: t(
          "En «Avisarme cuando queden» escribe el mínimo de ese producto. Cuando baje de ahí, aparece en «Por agotarse» en el inicio y en el inventario. Si lo dejas vacío, se usa el mínimo general de Mi tienda.",
          "In “Alert me when there are” enter the minimum for that product. When stock drops below it, it shows up under “Running low” on the home screen and in inventory. If you leave it blank, the general minimum from My store is used.",
        ),
      },
      {
        tipo: "nota",
        texto: t(
          "El inventario se puede ordenar por recientes, más vendidos, menos unidades o nombre, y arriba ves el costo total de lo que tienes y lo que vale a precio de venta.",
          "You can sort inventory by newest, best-selling, lowest stock or name, and at the top you see the total cost of what you have and its value at retail price.",
        ),
      },
    ],
    relacionadas: ["purchases", "stock-count", "bulk-edit-and-excel"],
  },
  {
    slug: "purchases",
    seccion: "inventario",
    icono: "🚚",
    titulo: t("Compras a proveedores", "Supplier purchases"),
    resumen: t(
      "Registra lo que le compras a tus proveedores: suben las existencias y el costo se ajusta solo.",
      "Record what you buy from suppliers: stock goes up and the cost adjusts automatically.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Compras y toca «Registrar compra».", "Go to Purchases and tap “Record purchase”."),
          t("Elige el proveedor, los productos, cuántas unidades llegaron y a qué costo cada una.", "Pick the supplier, the products, how many units arrived and the cost of each."),
          t("Elige cómo pagaste: efectivo, transferencia, tarjeta o a crédito con el proveedor.", "Choose how you paid: cash, transfer, card or on credit with the supplier."),
          t("Guarda. Las unidades se suman al inventario, también por color o talla.", "Save. The units are added to inventory, including by color or size."),
        ],
      },
      { tipo: "captura", archivo: "purchases.png", alt: t("Registrar una compra", "Recording a purchase") },
      {
        tipo: "parrafo",
        texto: t(
          "El costo se recalcula como promedio: si tenías 10 unidades a $100 y compras 8 a $125, el costo queda en $111.11. Así tu ganancia sale siempre bien calculada.",
          "Cost is recalculated as an average: if you had 10 units at $100 and buy 8 at $125, the cost becomes $111.11. That way your profit is always calculated correctly.",
        ),
      },
      {
        tipo: "nota",
        texto: t(
          "Las compras pagadas en efectivo se restan del efectivo esperado en la caja.",
          "Purchases paid in cash are subtracted from the expected cash in the register.",
        ),
      },
    ],
    relacionadas: ["products-and-variants", "cash-register"],
  },
  {
    slug: "stock-count",
    seccion: "inventario",
    icono: "📋",
    titulo: t("Conteo de inventario", "Stock count"),
    resumen: t(
      "Cuenta lo que hay de verdad en la bodega, compáralo con lo registrado y ajusta las diferencias de una vez.",
      "Count what's really on the shelves, compare it with your records and fix the differences in one go.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Inventario → Conteo de inventario.", "Go to Inventory → Stock count."),
          t("Los productos salen agrupados por categoría, con lo que dice el sistema. Escribe lo que contaste en cada uno, también por color o talla.", "Products are grouped by category, showing what the system says. Enter what you counted for each one, including by color or size."),
          t("Deja vacío lo que no contaste: no se toca.", "Leave blank anything you didn't count: it stays as it is."),
          t("Guarda. Proinshop ajusta las existencias y te muestra cuántas diferencias hubo y cuánto valen.", "Save. Proinshop adjusts the stock and shows how many differences there were and what they're worth."),
        ],
      },
      { tipo: "captura", archivo: "stock-count.png", alt: t("Conteo de inventario", "Stock count") },
      {
        tipo: "nota",
        texto: t(
          "Cada conteo queda guardado con la fecha, quién lo hizo y el valor de la diferencia, para que veas si se está perdiendo mercancía.",
          "Every count is saved with the date, who did it and the value of the difference, so you can tell if goods are going missing.",
        ),
      },
    ],
    relacionadas: ["products-and-variants", "bulk-edit-and-excel"],
  },
  {
    slug: "bulk-edit-and-excel",
    seccion: "inventario",
    icono: "📥",
    titulo: t("Edición masiva y Excel", "Bulk editing and Excel"),
    resumen: t(
      "Sube muchos productos de una vez desde Excel, descarga tu inventario y cambia precios en bloque.",
      "Upload many products at once from Excel, download your inventory and change prices in bulk.",
    ),
    bloques: [
      { tipo: "subtitulo", texto: t("Cargar desde Excel", "Upload from Excel") },
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Inventario → Cargar desde Excel y descarga la plantilla.", "Go to Inventory → Upload from Excel and download the template."),
          t("Llénala en Excel o Google Sheets: nombre, precio, costo, unidades, categoría, código de barras.", "Fill it in with Excel or Google Sheets: name, price, cost, units, category, barcode."),
          t("Guárdala como CSV y súbela. Los productos nuevos se crean; los que ya existen (por código de barras o SKU) se actualizan.", "Save it as CSV and upload it. New products are created; existing ones (matched by barcode or SKU) are updated."),
        ],
      },
      { tipo: "captura", archivo: "bulk-edit-and-excel.png", alt: t("Cargar productos desde Excel", "Uploading products from Excel") },
      {
        tipo: "nota",
        texto: t(
          "Si una categoría no existe, se crea sola. Las filas sin nombre se saltan y te dice cuántas.",
          "If a category doesn't exist, it's created automatically. Rows without a name are skipped and you're told how many.",
        ),
      },
      { tipo: "subtitulo", texto: t("Descargar tu inventario", "Download your inventory") },
      {
        tipo: "parrafo",
        texto: t(
          "Toca «Descargar Excel» para bajar todo tu inventario. Sirve como respaldo o para editarlo y volverlo a subir.",
          "Tap “Download Excel” to get your whole inventory. Use it as a backup, or edit it and upload it again.",
        ),
      },
      { tipo: "subtitulo", texto: t("Cambiar precios en bloque", "Change prices in bulk") },
      {
        tipo: "parrafo",
        texto: t(
          "En Edición masiva, marca los productos y elige qué hacer con todos a la vez: subir o bajar el precio por porcentaje, cambiar la categoría, publicarlos o quitarlos de la tienda, destacarlos en la portada o cambiar el aviso de pocas unidades. Ideal cuando cambia el dólar o llega una lista nueva del proveedor.",
          "In Bulk edit, select products and choose what to do with all of them at once: raise or lower the price by percentage, change the category, publish them or remove them from the store, feature them on the home page, or change the low stock alert. Perfect when exchange rates move or a supplier sends a new price list.",
        ),
      },
    ],
    relacionadas: ["products-and-variants", "stock-count"],
  },

  // ─── Clientes y cobros ───────────────────────────────────────────────────
  {
    slug: "customers",
    seccion: "clientes",
    icono: "👥",
    titulo: t("Clientes", "Customers"),
    resumen: t(
      "Tu lista de clientes con su historial de compras, lo que deben y tus notas.",
      "Your customer list with purchase history, what they owe and your notes.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Cada cliente tiene su ficha: datos de contacto, todo lo que te ha comprado, cuánto te debe y una nota tuya (por ejemplo, «prefiere que lo llamen en la tarde»).",
          "Each customer has a profile: contact details, everything they've bought, how much they owe and a note of yours (for example, “prefers calls in the afternoon”).",
        ),
      },
      {
        tipo: "lista",
        puntos: [
          t("Búscalos por nombre o teléfono.", "Search by name or phone."),
          t("Ordénalos por nombre, por los que más compran, por los que deben o por los más recientes.", "Sort by name, top buyers, who owes you, or most recent."),
          t("Desde la ficha, escríbele por WhatsApp con un toque. Si te debe, el botón le recuerda el pago.", "Message them on WhatsApp with one tap from their profile. If they owe you, the button sends a payment reminder."),
          t("Puedes crear un cliente rápido desde la pantalla de venta con «+ Cliente».", "You can quickly add a customer from the sale screen with “+ Customer”."),
        ],
      },
      { tipo: "captura", archivo: "customers.png", alt: t("Ficha de un cliente", "Customer profile") },
      {
        tipo: "nota",
        texto: t(
          "Un cliente que todavía te debe no se puede eliminar: primero se cobra o se salda la deuda.",
          "A customer who still owes you can't be deleted: collect or settle the balance first.",
        ),
      },
    ],
    relacionadas: ["receivables", "split-payments-and-credit"],
  },
  {
    slug: "receivables",
    seccion: "clientes",
    icono: "💰",
    titulo: t("Cuentas por cobrar", "Accounts receivable"),
    resumen: t(
      "Lo que te deben tus clientes, los abonos que van haciendo y los cobros vencidos.",
      "What customers owe you, the payments they make and overdue balances.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Cada venta fiada (o la parte fiada de un pago mixto) crea una cuenta por cobrar a nombre del cliente, con vencimiento a 30 días.",
          "Every sale on credit (or the credit part of a split payment) creates a receivable under the customer's name, due in 30 days.",
        ),
      },
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Cuentas por cobrar.", "Go to Accounts receivable."),
          t("Cuando el cliente pague, toca «Registrar abono» en su cuenta, escribe cuánto pagó y cómo.", "When the customer pays, tap “Record payment” on their balance, and enter how much and how."),
          t("El saldo baja solo. Cuando llega a cero, la cuenta queda saldada.", "The balance goes down automatically. When it reaches zero, it's settled."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "Los cobros vencidos aparecen en el inicio en rojo, con el monto total, para que no se te pase ninguno.",
          "Overdue balances show up in red on the home screen with the total amount, so none slip through.",
        ),
      },
    ],
    relacionadas: ["customers", "split-payments-and-credit"],
  },

  // ─── Números ─────────────────────────────────────────────────────────────
  {
    slug: "reports",
    seccion: "numeros",
    icono: "📊",
    titulo: t("Reportes", "Reports"),
    resumen: t(
      "Ventas, ganancia, productos más vendidos y gastos, filtrados por fecha, vendedor o método de pago, y descargables en Excel.",
      "Sales, profit, best sellers and expenses, filtered by date, salesperson or payment method, and downloadable to Excel.",
    ),
    bloques: [
      {
        tipo: "pasos",
        pasos: [
          t("Ve a Reportes.", "Go to Reports."),
          t("Elige las fechas y, si quieres, el vendedor, el método de pago, un producto, o si la venta fue en el local o en la tienda en línea.", "Pick the dates and, optionally, the salesperson, payment method, a product, or whether the sale was in-store or online."),
          t("Arriba ves ventas, ganancia bruta, gastos y ticket promedio. Abajo, el detalle por producto, por vendedor y por método de pago.", "At the top you see sales, gross profit, expenses and average ticket. Below, the breakdown by product, salesperson and payment method."),
          t("Toca «Descargar» para bajar ventas, productos o gastos en Excel, o imprime el reporte.", "Tap “Download” to export sales, products or expenses to Excel, or print the report."),
        ],
      },
      { tipo: "captura", archivo: "reports.png", alt: t("Reportes con filtros", "Reports with filters") },
      {
        tipo: "nota",
        texto: t(
          "Las ventas anuladas no cuentan en ningún reporte. La ganancia usa el costo de cada producto en el momento de la venta.",
          "Voided sales don't count in any report. Profit uses each product's cost at the time of the sale.",
        ),
      },
    ],
    relacionadas: ["balance-and-expenses", "activity-and-alerts"],
  },
  {
    slug: "balance-and-expenses",
    seccion: "numeros",
    icono: "💵",
    titulo: t("Balance y gastos", "Balance and expenses"),
    resumen: t(
      "Lo que entra y lo que sale cada día, y cómo registrar los gastos del negocio.",
      "What comes in and goes out each day, and how to record business expenses.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "El balance te muestra ingresos (ventas y abonos) contra egresos (gastos) por día, semana o mes. En el inicio ves el resumen de hoy.",
          "The balance shows income (sales and payments received) against expenses by day, week or month. The home screen shows today's summary.",
        ),
      },
      { tipo: "subtitulo", texto: t("Registrar un gasto", "Record an expense") },
      {
        tipo: "pasos",
        pasos: [
          t("Toca «Registrar gasto».", "Tap “Record expense”."),
          t("Escribe el monto, elige la categoría (importación, mercancía, arriendo, servicios, nómina, transporte u otra) y cómo pagaste.", "Enter the amount, pick the category (imports, merchandise, rent, utilities, payroll, transportation or other) and how you paid."),
          t("Si quieres, elige el proveedor y escribe una nota. Guarda.", "Optionally pick the supplier and add a note. Save."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "El día del balance usa la hora de tu negocio, no la de otro país: una venta de las 11 de la noche cuenta en ese día.",
          "The balance uses your business's local time: a sale at 11 p.m. counts on that day.",
        ),
      },
    ],
    relacionadas: ["reports", "cash-register"],
  },
  {
    slug: "activity-and-alerts",
    seccion: "numeros",
    icono: "🔔",
    titulo: t("Actividad del equipo y avisos en vivo", "Team activity and live alerts"),
    resumen: t(
      "Mira al momento qué hace cada persona de tu equipo y recibe avisos de ventas y pedidos.",
      "See what each team member is doing in real time and get alerts for sales and orders.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Como propietario, en Actividad ves todo lo que pasa: quién vendió, quién anuló, quién abrió o cerró caja, quién ajustó inventario. Cada línea lleva la hora y te lleva al detalle con un toque.",
          "As the owner, Activity shows you everything that happens: who sold, who voided, who opened or closed the register, who adjusted inventory. Each line shows the time and opens the details with one tap.",
        ),
      },
      {
        tipo: "parrafo",
        texto: t(
          "Con el panel abierto, cuando alguien de tu equipo registra algo o llega un pedido de la tienda, aparece una franja verde arriba. Si activas los avisos del navegador, te llegan aunque estés en otra pestaña.",
          "With the dashboard open, when someone on your team records something or a store order comes in, a green banner appears at the top. If you turn on browser alerts, you get them even in another tab.",
        ),
      },
    ],
    relacionadas: ["team-and-permissions", "store-orders"],
  },

  // ─── Tienda ──────────────────────────────────────────────────────────────
  {
    slug: "online-store",
    seccion: "tienda",
    icono: "🏪",
    titulo: t("Tu tienda en línea", "Your online store"),
    resumen: t(
      "Cómo lo que registras en el panel se publica solo en tu tienda, y qué puedes configurar en Mi tienda.",
      "How what you record in the dashboard is published to your store automatically, and what you can set up in My store.",
    ),
    bloques: [
      {
        tipo: "parrafo",
        texto: t(
          "Tu tienda y tu panel son lo mismo: cuando creas un producto, cambias un precio o vendes la última unidad, la tienda se actualiza sola. No hay que subir nada dos veces.",
          "Your store and your dashboard are the same thing: when you create a product, change a price or sell the last unit, the store updates itself. Nothing needs to be uploaded twice.",
        ),
      },
      { tipo: "subtitulo", texto: t("Lo que configuras en Mi tienda", "What you set up in My store") },
      {
        tipo: "lista",
        puntos: [
          t("Nombre, WhatsApp de ventas, correo y dirección que ven tus clientes.", "Name, sales WhatsApp, email and address your customers see."),
          t("Costo de envío.", "Shipping cost."),
          t("Si se muestran las unidades disponibles y si se ocultan los productos agotados.", "Whether available units are shown and whether sold-out products are hidden."),
          t("El mínimo general para el aviso de «Por agotarse».", "The general minimum for the “Running low” alert."),
          t("Una segunda moneda y su tasa, para ver los totales también en esa moneda.", "A second currency and its rate, to see totals in that currency too."),
        ],
      },
      {
        tipo: "nota",
        texto: t(
          "Los servicios siempre aparecen disponibles en la tienda, porque no tienen existencias que se agoten.",
          "Services always show as available in the store, because they have no stock to run out.",
        ),
      },
    ],
    relacionadas: ["products-and-variants", "store-orders"],
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((guia) => guia.slug === slug);
}

/** El texto de una guía en un solo renglón, para el buscador. */
export function textoPlano(guia: Guia, idioma: "es" | "en"): string {
  const partes: string[] = [guia.titulo[idioma], guia.resumen[idioma]];
  for (const bloque of guia.bloques) {
    if (bloque.tipo === "parrafo" || bloque.tipo === "subtitulo" || bloque.tipo === "nota") {
      partes.push(bloque.texto[idioma]);
    } else if (bloque.tipo === "pasos") {
      partes.push(...bloque.pasos.map((paso) => paso[idioma]));
    } else if (bloque.tipo === "lista") {
      partes.push(...bloque.puntos.map((punto) => punto[idioma]));
    }
  }
  return partes.join(" ");
}

/** Sin acentos ni mayúsculas: «cotizacion» encuentra «Cotización». */
export function normalizarBusqueda(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
