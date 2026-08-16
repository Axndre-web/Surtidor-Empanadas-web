"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CONFIG = {
  whatsapp: "34602487576",
  unitPrice: 1.50,

  /*
    Coste de envío.
    Modifica estos valores según las zonas reales de reparto.
    0 = sin coste.
  */
  shipping: {
    pickup: 0,
    home: 2.50
  },

  currency: "EUR",

  /*
    Contraseña del panel local.
    IMPORTANTE: para administración real debe existir
    un backend/servidor con autenticación.
  */
  adminPassword: "AzuqueCa2026"
};

const PACKS = {
  6: {
    name: "Pack x6",
    quantity: 6,
    price: 9.00
  },

  10: {
    name: "Pack x10",
    quantity: 10,
    price: 15.00
  },

  20: {
    name: "Pack x20",
    quantity: 20,
    price: 30.00
  }
};

let cart = [];

let selectedDelivery = "pickup";

let paypalRendered = false;

let currentOrder = null;

/* =========================================================
   HELPERS
========================================================= */

const $ = selector => document.querySelector(selector);

const $$ = selector => [...document.querySelectorAll(selector)];

function money(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    style: "currency",
    currency: CONFIG.currency
  });
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = $("#toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================================
   REVEAL ANIMATIONS
========================================================= */

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12
  }
);

$$(".reveal").forEach(element => {
  revealObserver.observe(element);
});

/* =========================================================
   CURSOR NEON
========================================================= */

document.addEventListener("pointermove", event => {
  const glow = $(".cursor-glow");

  if (!glow) return;

  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

/* =========================================================
   FECHA Y HORA
========================================================= */

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const date = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  $("#liveTime").textContent = time;
  $("#liveDate").textContent =
    date.charAt(0).toUpperCase() + date.slice(1);
}

updateClock();
setInterval(updateClock, 1000);

/* =========================================================
   VISITAS
========================================================= */

function registerVisit() {
  const current = Number(
    localStorage.getItem("empanadas_visits") || "0"
  );

  const updated = current + 1;

  localStorage.setItem(
    "empanadas_visits",
    String(updated)
  );

  $("#visitCounter").textContent =
    String(updated).padStart(6, "0");
}

function getVisits() {
  return Number(
    localStorage.getItem("empanadas_visits") || "0"
  );
}

registerVisit();

/* =========================================================
   FECHA MÍNIMA DEL PEDIDO
========================================================= */

function setupDate() {
  const input = $("#orderDate");

  if (!input) return;

  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const formatted = `${yyyy}-${mm}-${dd}`;

  input.min = formatted;

  if (!input.value) {
    input.value = formatted;
  }
}

setupDate();

$("#currentYear").textContent = new Date().getFullYear();

/* =========================================================
   CARRITO
========================================================= */

function getCartQuantity() {
  return cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
}

function getCartSubtotal() {
  return cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

function getShipping() {
  if (cart.length === 0) {
    return 0;
  }

  return CONFIG.shipping[selectedDelivery];
}

function getCartTotal() {
  return getCartSubtotal() + getShipping();
}

function addProduct(quantity = 1) {
  const existing = cart.find(
    item => item.id === "pollo"
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: "pollo",
      name: "Empanada de pollo",
      quantity,
      price: CONFIG.unitPrice,
      icon: "🥟",
      type: "unit"
    });
  }

  saveCart();
  renderCart();

  showToast(
    quantity > 1
      ? `${quantity} empanadas añadidas al carrito`
      : "Empanada añadida al carrito"
  );
}

function addPack(quantity) {
  const pack = PACKS[quantity];

  if (!pack) return;

  const existing = cart.find(
    item => item.id === `pack-${quantity}`
  );

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: `pack-${quantity}`,
      name: pack.name,
      quantity: 1,
      price: pack.price,
      icon: "🥟",
      type: "pack",
      units: pack.quantity
    });
  }

  saveCart();
  renderCart();

  showToast(`${pack.name} añadido al carrito`);
}

function removeCartItem(id) {
  cart = cart.filter(item => item.id !== id);

  saveCart();
  renderCart();

  showToast("Producto eliminado");
}

function updateCartItem(id, delta) {
  const item = cart.find(item => item.id === id);

  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeCartItem(id);
    return;
  }

  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem(
    "empanadas_cart",
    JSON.stringify(cart)
  );
}

function loadCart() {
  try {
    const saved = localStorage.getItem("empanadas_cart");

    cart = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch {
    cart = [];
  }

  renderCart();
}

function renderCart() {
  const quantity = getCartQuantity();
  const subtotal = getCartSubtotal();
  const shipping = getShipping();
  const total = subtotal + shipping;

  $("#cartCount").textContent = quantity;
  $("#summaryItems").textContent = `${quantity} uds.`;

  $("#subtotal").textContent = money(subtotal);
  $("#shipping").textContent =
    shipping === 0 ? "GRATIS" : money(shipping);

  $("#total").textContent = money(total);
  $("#drawerTotal").textContent = money(total);
  $("#paymentTotal").textContent = money(total);

  const container = $("#cartItems");
  const drawer = $("#drawerItems");

  if (cart.length === 0) {
    const empty = `
      <div class="empty-cart">
        <span>🛒</span>
        <p>Tu carrito está vacío</p>
        <a href="#menu">Ver empanadas</a>
      </div>
    `;

    container.innerHTML = empty;
    drawer.innerHTML = empty;

    updateConfirmation();

    return;
  }

  const html = cart.map(item => {
    const itemTotal = item.price * item.quantity;

    const unitsText =
      item.type === "pack"
        ? `${item.quantity} × ${item.units} unidades`
        : `${item.quantity} unidad${item.quantity !== 1 ? "es" : ""}`;

    return `
      <div class="cart-item">

        <div class="cart-item-icon">
          ${item.icon}
        </div>

        <div>
          <div class="cart-item-name">
            ${escapeHTML(item.name)}
          </div>

          <div class="cart-item-meta">
            ${unitsText}
          </div>

          <button
            class="remove-item"
            data-remove="${escapeHTML(item.id)}">
            ELIMINAR
          </button>
        </div>

        <div class="cart-item-price">
          ${money(itemTotal)}
        </div>

      </div>
    `;
  }).join("");

  container.innerHTML = html;
  drawer.innerHTML = html;

  updateConfirmation();
}

document.addEventListener("click", event => {

  const plus = event.target.closest(".qty-plus");

  if (plus) {
    const id = plus.dataset.id;

    if (id === "pollo") {
      const qty = Number(
        $("#qty-pollo").textContent
      );

      $("#qty-pollo").textContent = qty + 1;
    }

    return;
  }

  const minus = event.target.closest(".qty-minus");

  if (minus) {
    const id = minus.dataset.id;

    if (id === "pollo") {
      const qty = Number(
        $("#qty-pollo").textContent
      );

      $("#qty-pollo").textContent =
        Math.max(0, qty - 1);
    }

    return;
  }

  const add = event.target.closest(".add-product");

  if (add) {
    const quantity = Number(
      $("#qty-pollo").textContent
    ) || 1;

    addProduct(quantity);

    $("#qty-pollo").textContent = "0";

    return;
  }

  const pack = event.target.closest(".pack-add");

  if (pack) {
    addPack(Number(pack.dataset.qty));
    return;
  }

  const remove = event.target.closest("[data-remove]");

  if (remove) {
    removeCartItem(remove.dataset.remove);
  }
});

/* =========================================================
   CARRITO DRAWER
========================================================= */

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#cartOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#cartOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#cartOverlay").addEventListener("click", closeCart);

$("#goOrder").addEventListener("click", closeCart);

/* =========================================================
   ENTREGA
========================================================= */

$$(".delivery-option").forEach(button => {

  button.addEventListener("click", () => {

    $$(".delivery-option").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    selectedDelivery =
      button.dataset.delivery;

    $("#deliveryType").value =
      selectedDelivery;

    if (selectedDelivery === "home") {
      $("#homeAddress").classList.add("visible");
      $("#pickupAddress").style.display = "none";
    } else {
      $("#homeAddress").classList.remove("visible");
      $("#pickupAddress").style.display = "block";
    }

    renderCart();
  });

});

/* =========================================================
   FORMULARIO
========================================================= */

function getCustomerData() {

  return {
    name: $("#customerName").value.trim(),
    phone: $("#customerPhone").value.trim(),
    date: $("#orderDate").value,
    time: $("#orderTime").value,
    address: $("#customerAddress").value.trim(),
    city: $("#customerCity").value.trim(),
    zip: $("#customerZip").value.trim(),
    message: $("#customerMessage").value.trim()
  };

}

function validateOrder(showMessage = true) {

  if (cart.length === 0) {
    if (showMessage) {
      showToast("Añade al menos una empanada al carrito.");
    }

    return false;
  }

  const customer = getCustomerData();

  if (!customer.name) {
    if (showMessage) {
      showToast("Introduce tu nombre.");
    }

    $("#customerName").focus();

    return false;
  }

  if (!customer.phone) {
    if (showMessage) {
      showToast("Introduce tu teléfono de contacto.");
    }

    $("#customerPhone").focus();

    return false;
  }

  if (!customer.date) {
    if (showMessage) {
      showToast("Selecciona la fecha del pedido.");
    }

    return false;
  }

  if (selectedDelivery === "home") {

    if (!customer.address) {
      if (showMessage) {
        showToast("Introduce la dirección de entrega.");
      }

      $("#customerAddress").focus();

      return false;
    }

    if (!customer.city) {
      if (showMessage) {
        showToast("Introduce la localidad.");
      }

      $("#customerCity").focus();

      return false;
    }
  }

  if (!$("#acceptTerms").checked) {
    if (showMessage) {
      showToast("Confirma que revisarás los datos del pedido.");
    }

    return false;
  }

  return true;
}

function buildOrder() {

  const customer = getCustomerData();

  return {
    id: `EMP-${Date.now()}`,
    createdAt: new Date().toISOString(),

    customer,

    delivery: selectedDelivery,

    deliveryText:
      selectedDelivery === "pickup"
        ? "Recogida en estación Renfe de Azuqueca de Henares"
        : "Entrega a domicilio",

    items: cart.map(item => ({
      ...item
    })),

    subtotal: getCartSubtotal(),
    shipping: getShipping(),
    total: getCartTotal(),

    payment: "Pendiente"
  };
}

/* =========================================================
   CONFIRMACIÓN
========================================================= */

function updateConfirmation() {

  const preview = $("#confirmationPreview");

  if (!preview) return;

  if (cart.length === 0) {
    preview.innerHTML = `
      <p>
        Completa tus datos y el carrito para ver
        aquí el resumen del pedido.
      </p>
    `;

    return;
  }

  const customer = getCustomerData();

  const products = cart.map(item => {
    const units =
      item.type === "pack"
        ? `${item.quantity} × ${item.units}`
        : item.quantity;

    return `${item.name} (${units})`;
  }).join(", ");

  preview.innerHTML = `
    <div class="confirmation-list">

      <div>
        <span>👤 Nombre</span>
        <strong>${escapeHTML(customer.name || "...")}</strong>
      </div>

      <div>
        <span>🥟 Pedido</span>
        <strong>${escapeHTML(products)}</strong>
      </div>

      <div>
        <span>💶 Total</span>
        <strong>${money(getCartTotal())}</strong>
      </div>

      <div>
        <span>📦 Entrega</span>
        <strong>
          ${
            selectedDelivery === "pickup"
              ? "🚉 Renfe Azuqueca · GRATIS"
              : "🚚 A domicilio"
          }
        </strong>
      </div>

      <div>
        <span>📅 Fecha</span>
        <strong>${escapeHTML(customer.date || "...")}</strong>
      </div>

      <div>
        <span>📱 Teléfono</span>
        <strong>${escapeHTML(customer.phone || "...")}</strong>
      </div>

    </div>
  `;
}

[
  "#customerName",
  "#customerPhone",
  "#orderDate",
  "#orderTime",
  "#customerAddress",
  "#customerCity",
  "#customerZip",
  "#customerMessage"
].forEach(selector => {

  const element = $(selector);

  if (element) {
    element.addEventListener("input", updateConfirmation);
    element.addEventListener("change", updateConfirmation);
  }

});

/* =========================================================
   WHATSAPP
========================================================= */

function buildWhatsAppMessage(order, payment = "Pendiente") {

  const items = order.items.map(item => {

    if (item.type === "pack") {
      return `🥟 ${item.name}: ${item.quantity} pack(s) × ${item.units} unidades = ${money(item.price * item.quantity)}`;
    }

    return `🥟 Empanada de pollo: ${item.quantity} unidad(es) × 1,50 € = ${money(item.price * item.quantity)}`;

  }).join("\n");

  const delivery =
    order.delivery === "pickup"
      ? `🚉 Recogida en Estación Renfe de Azuqueca de Henares\n💚 Sin gasto de envío`
      : `🚚 A domicilio\n📍 ${order.customer.address}, ${order.customer.zip} ${order.customer.city}\n📦 Gastos de envío: ${money(order.shipping)}`;

  return `🥟 *NUEVO PEDIDO DE EMPANADAS*

👤 *Nombre:* ${order.customer.name}

📱 *Teléfono:* ${order.customer.phone}

${items}

💶 *Subtotal:* ${money(order.subtotal)}

${delivery}

📅 *Fecha:* ${order.customer.date}

🕐 *Hora:* ${order.customer.time || "A confirmar"}

💶 *TOTAL:* ${money(order.total)}

💳 *Pago:* ${payment}

📝 *Mensaje:* ${order.customer.message || "Sin observaciones"}

🆔 *Pedido:* ${order.id}

¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.`;
}

function sendWhatsApp(order = null, payment = "Pendiente") {

  if (!order) {

    if (!validateOrder(true)) {
      return;
    }

    order = buildOrder();
  }

  const message = buildWhatsAppMessage(
    order,
    payment
  );

  const url =
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener");

  saveOrder(order);
}

$("#sendWhatsApp").addEventListener(
  "click",
  () => sendWhatsApp()
);

/* =========================================================
   GUARDADO DE PEDIDOS
========================================================= */

function getOrders() {

  try {

    const saved =
      localStorage.getItem("empanadas_orders");

    const orders =
      saved ? JSON.parse(saved) : [];

    return Array.isArray(orders)
      ? orders
      : [];

  } catch {

    return [];

  }
}

function saveOrder(order) {

  const orders = getOrders();

  const exists = orders.some(
    item => item.id === order.id
  );

  if (!exists) {
    orders.unshift(order);
  }

  localStorage.setItem(
    "empanadas_orders",
    JSON.stringify(orders)
  );

  currentOrder = order;

  renderAdmin();
}

/* =========================================================
   PAYPAL DINÁMICO
========================================================= */

/*
  El SDK utiliza el importe real del carrito.
  El botón HostedButtons que PayPal entrega para un importe
  fijo no permite cambiar dinámicamente el precio del carrito,
  por lo que aquí se utiliza PayPal Buttons dinámico con el
  mismo Client ID proporcionado.
*/

function renderPayPal() {

  if (paypalRendered) return;

  if (
    typeof paypal === "undefined" ||
    !paypal.Buttons
  ) {
    setTimeout(renderPayPal, 800);
    return;
  }

  paypal.Buttons({

    style: {
      layout: "vertical",
      shape: "rect",
      color: "gold",
      label: "paypal",
      height: 48
    },

    onClick: function(data, actions) {

      if (!validateOrder(true)) {
        return actions.reject();
      }

      currentOrder = buildOrder();

      return actions.resolve();
    },

    createOrder: function(data, actions) {

      const total =
        getCartTotal().toFixed(2);

      currentOrder = buildOrder();

      return actions.order.create({
        purchase_units: [
          {
            description:
              "Pedido de empanadas de pollo",

            custom_id:
              currentOrder.id,

            amount: {
              currency_code: "EUR",
              value: total
            }
          }
        ]
      });

    },

    onApprove: async function(data, actions) {

      try {

        const details =
          await actions.order.capture();

        if (!currentOrder) {
          currentOrder = buildOrder();
        }

        currentOrder.payment =
          "PayPal confirmado";

        currentOrder.paypalOrderId =
          details.id;

        saveOrder(currentOrder);

        showToast(
          "Pago confirmado. Abriendo WhatsApp..."
        );

        setTimeout(() => {

          sendWhatsApp(
            currentOrder,
            "PayPal confirmado"
          );

        }, 700);

      } catch (error) {

        console.error(error);

        showToast(
          "No se pudo confirmar el pago."
        );

      }

    },

    onCancel: function() {

      showToast(
        "Pago cancelado. Tu carrito sigue disponible."
      );

    },

    onError: function(error) {

      console.error(error);

      showToast(
        "PayPal no está disponible en este momento."
      );

    }

  })
  .render("#paypal-button-container")
  .then(() => {

    paypalRendered = true;

  })
  .catch(error => {

    console.error(
      "Error cargando PayPal:",
      error
    );

  });

}

renderPayPal();

/* =========================================================
   CONTINUAR AL PAGO
========================================================= */

$("#continuePayment").addEventListener(
  "click",
  () => {

    if (!validateOrder(true)) {
      return;
    }

    currentOrder = buildOrder();

    document
      .querySelector("#pago")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    showToast(
      "Pedido preparado. Selecciona PayPal o metálico."
    );

  }
);

/* =========================================================
   PAGO EN METÁLICO
========================================================= */

$("#cashPayment").addEventListener(
  "click",
  () => {

    if (!validateOrder(true)) {
      return;
    }

    const order = buildOrder();

    order.payment =
      "Metálico al recibir / recoger";

    saveOrder(order);

    showToast(
      "Pedido preparado. Abriendo WhatsApp..."
    );

    setTimeout(() => {

      sendWhatsApp(
        order,
        "Metálico al recibir / recoger"
      );

    }, 500);

  }
);

/* =========================================================
   BUSCADOR GOOGLE
========================================================= */

function googleSearch(query) {

  const clean = query.trim();

  if (!clean) {
    showToast("Escribe algo para buscar.");
    return;
  }

  window.open(
    `https://www.google.com/search?q=${encodeURIComponent(clean)}`,
    "_blank",
    "noopener"
  );
}

$("#googleSearch").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    googleSearch(
      $("#googleQuery").value
    );

  }
);

$("#modalGoogleSearch").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    googleSearch(
      $("#modalGoogleQuery").value
    );

  }
);

$("#openSearch").addEventListener(
  "click",
  () => {
    $("#searchModal").classList.add("open");
    setTimeout(
      () => $("#modalGoogleQuery").focus(),
      150
    );
  }
);

/* =========================================================
   MODALES
========================================================= */

$$("[data-close]").forEach(button => {

  button.addEventListener("click", () => {

    const id = button.dataset.close;

    $(`#${id}`).classList.remove("open");

  });

});

$$(".modal").forEach(modal => {

  modal.addEventListener("click", event => {

    if (event.target === modal) {
      modal.classList.remove("open");
    }

  });

});

/* =========================================================
   PANEL ADMINISTRACIÓN
========================================================= */

$("#adminButton").addEventListener(
  "click",
  () => {

    $("#adminModal").classList.add("open");

    $("#adminLogin").hidden = false;
    $("#adminContent").hidden = true;

    $("#adminPassword").value = "";

  }
);

$("#adminLoginBtn").addEventListener(
  "click",
  () => {

    const password =
      $("#adminPassword").value;

    if (password !== CONFIG.adminPassword) {

      showToast(
        "Contraseña incorrecta."
      );

      return;
    }

    $("#adminLogin").hidden = true;
    $("#adminContent").hidden = false;

    renderAdmin();

  }
);

$("#adminPassword").addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      $("#adminLoginBtn").click();
    }

  }
);

function renderAdmin() {

  const orders = getOrders();

  const sales =
    orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

  $("#adminOrdersCount").textContent =
    orders.length;

  $("#adminVisits").textContent =
    getVisits();

  $("#adminSales").textContent =
    money(sales);

  const list = $("#adminOrdersList");

  if (!orders.length) {

    list.innerHTML = `
      <div class="empty-cart">
        <span>📦</span>
        <p>No hay pedidos registrados.</p>
      </div>
    `;

    return;
  }

  list.innerHTML = orders.map(order => {

    const date =
      new Date(order.createdAt)
        .toLocaleString("es-ES");

    return `
      <div class="admin-order">

        <strong>
          ${escapeHTML(order.id)}
        </strong>

        <small>
          👤 ${escapeHTML(order.customer.name)}
        </small>

        <small>
          📱 ${escapeHTML(order.customer.phone)}
        </small>

        <small>
          📦 ${escapeHTML(order.deliveryText)}
        </small>

        <small>
          💶 ${money(order.total)}
        </small>

        <small>
          💳 ${escapeHTML(order.payment)}
        </small>

        <small>
          🕐 ${escapeHTML(date)}
        </small>

      </div>
    `;

  }).join("");
}

$("#exportOrders").addEventListener(
  "click",
  () => {

    const orders = getOrders();

    if (!orders.length) {
      showToast("No hay pedidos para exportar.");
      return;
    }

    const blob = new Blob(
      [JSON.stringify(orders, null, 2)],
      { type: "application/json" }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `pedidos-empanadas-${new Date().toISOString().slice(0,10)}.json`;

    link.click();

    URL.revokeObjectURL(url);

    showToast(
      "Pedidos exportados correctamente."
    );

  }
);

$("#clearOrders").addEventListener(
  "click",
  () => {

    const confirmed =
      window.confirm(
        "¿Borrar todos los pedidos guardados en este navegador?"
      );

    if (!confirmed) return;

    localStorage.removeItem(
      "empanadas_orders"
    );

    renderAdmin();

    showToast(
      "Pedidos eliminados."
    );

  }
);

/* =========================================================
   NAVEGACIÓN
========================================================= */

$$('a[href^="#"]').forEach(link => {

  link.addEventListener("click", () => {

    const target =
      link.getAttribute("href");

    if (
      target &&
      target !== "#" &&
      document.querySelector(target)
    ) {

      setTimeout(() => {
        closeCart();
      }, 50);

    }

  });

});

/* =========================================================
   TECLADO
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeCart();

      $$(".modal.open").forEach(modal => {
        modal.classList.remove("open");
      });

    }

  }
);

/* =========================================================
   CARGA INICIAL
========================================================= */

loadCart();
updateConfirmation();
renderAdmin();

/* =========================================================
   EFECTO DE ENTRADA
========================================================= */

window.addEventListener(
  "load",
  () => {

    document.body.classList.add(
      "page-loaded"
    );

  }
);