// script.js

"use strict";

/* =========================================
   CONFIGURACIÓN
========================================= */

const CONFIG = {
  whatsapp: "34602487576",
  productName: "Empanada de pollo",
  unitPrice: 3.00,

  /*
   * Si posteriormente defines un precio fijo para el domicilio,
   * cambia este valor.
   *
   * Si permanece en null, el pedido indicará:
   * "Consultar envío".
   */
  homeDeliveryPrice: null,

  pickupLocation: "Estación de RENFE de Azuqueca de Henares"
};


/* =========================================
   ELEMENTOS
========================================= */

const loader = document.getElementById("pageLoader");
const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");

const quantityElement = document.getElementById("quantity");
const summaryQuantity = document.getElementById("summaryQuantity");
const subtotalElement = document.getElementById("subtotal");
const shippingElement = document.getElementById("shipping");
const totalElement = document.getElementById("total");
const paypalTotal = document.getElementById("paypalTotal");

const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

const addressBox = document.getElementById("addressBox");
const deliveryPriceLabel = document.getElementById("deliveryPriceLabel");

const paypalWrapper = document.getElementById("paypalWrapper");
const cashWrapper = document.getElementById("cashWrapper");

const orderForm = document.getElementById("orderForm");

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");


/* =========================================
   ESTADO
========================================= */

let quantity = 1;


/* =========================================
   UTILIDADES
========================================= */

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function escapeText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}


/* =========================================
   RELOJ Y FECHA EN TIEMPO REAL
========================================= */

function updateClock() {
  const now = new Date();

  const time = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  const date = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(now);

  if (clockElement) {
    clockElement.textContent = time;
  }

  if (dateElement) {
    dateElement.textContent =
      date.charAt(0).toUpperCase() + date.slice(1);
  }
}

updateClock();
setInterval(updateClock, 1000);


/* =========================================
   FECHA MÍNIMA DEL PEDIDO
========================================= */

const dateInput = document.getElementById("dateInput");

if (dateInput) {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const todayString = `${year}-${month}-${day}`;

  dateInput.min = todayString;
  dateInput.value = todayString;
}


/* =========================================
   HORA POR DEFECTO
========================================= */

const timeInput = document.getElementById("timeInput");

if (timeInput) {
  const now = new Date();

  let hours = now.getHours();
  let minutes = now.getMinutes();

  minutes = Math.ceil(minutes / 15) * 15;

  if (minutes >= 60) {
    hours += 1;
    minutes = 0;
  }

  if (hours > 23) {
    hours = 23;
    minutes = 45;
  }

  timeInput.value =
    `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


/* =========================================
   CÁLCULO DEL PEDIDO
========================================= */

function getDelivery() {
  const selected = document.querySelector(
    'input[name="delivery"]:checked'
  );

  return selected ? selected.value : "pickup";
}

function getShippingCost() {
  const delivery = getDelivery();

  if (delivery === "pickup") {
    return 0;
  }

  if (typeof CONFIG.homeDeliveryPrice === "number") {
    return CONFIG.homeDeliveryPrice;
  }

  return null;
}

function calculateOrder() {
  const subtotal = quantity * CONFIG.unitPrice;
  const shipping = getShippingCost();

  const total = shipping === null
    ? subtotal
    : subtotal + shipping;

  return {
    subtotal,
    shipping,
    total
  };
}

function updateOrderSummary() {
  const order = calculateOrder();

  quantityElement.textContent = quantity;

  summaryQuantity.textContent =
    `${quantity} × ${formatPrice(CONFIG.unitPrice)}`;

  subtotalElement.textContent =
    formatPrice(order.subtotal);

  if (order.shipping === null) {
    shippingElement.textContent = "Consultar";
    totalElement.textContent = formatPrice(order.subtotal) + " + envío";
  } else {
    shippingElement.textContent =
      formatPrice(order.shipping);

    totalElement.textContent =
      formatPrice(order.total);
  }

  if (paypalTotal) {
    paypalTotal.textContent =
      order.shipping === null
        ? `${formatPrice(order.subtotal)} + envío`
        : formatPrice(order.total);
  }
}


/* =========================================
   CANTIDAD
========================================= */

function setQuantity(value) {
  quantity = Math.max(1, Math.min(99, Number(value) || 1));

  updateOrderSummary();

  document.querySelectorAll("[data-qty]").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.qty) === quantity
    );
  });
}

plusBtn?.addEventListener("click", () => {
  setQuantity(quantity + 1);
});

minusBtn?.addEventListener("click", () => {
  setQuantity(quantity - 1);
});

document.querySelectorAll("[data-qty]").forEach(button => {
  button.addEventListener("click", () => {
    setQuantity(button.dataset.qty);
  });
});


/* =========================================
   ENTREGA
========================================= */

function updateDeliveryUI() {
  const delivery = getDelivery();

  if (delivery === "home") {
    addressBox?.classList.remove("hidden");

    if (CONFIG.homeDeliveryPrice === null) {
      deliveryPriceLabel.textContent = "Consultar";
    } else {
      deliveryPriceLabel.textContent =
        formatPrice(CONFIG.homeDeliveryPrice);
    }
  } else {
    addressBox?.classList.add("hidden");
    deliveryPriceLabel.textContent = "GRATIS";
  }

  updateOrderSummary();
}

document.querySelectorAll('input[name="delivery"]').forEach(input => {
  input.addEventListener("change", updateDeliveryUI);
});


/* =========================================
   MÉTODO DE PAGO
========================================= */

function updatePaymentUI() {
  const payment = document.querySelector(
    'input[name="payment"]:checked'
  )?.value;

  if (payment === "paypal") {
    paypalWrapper?.classList.remove("hidden");
    cashWrapper?.classList.add("hidden");
  } else {
    paypalWrapper?.classList.add("hidden");
    cashWrapper?.classList.remove("hidden");
  }
}

document.querySelectorAll('input[name="payment"]').forEach(input => {
  input.addEventListener("change", updatePaymentUI);
});


/* =========================================
   MENÚ MÓVIL
========================================= */

menuToggle?.addEventListener("click", () => {
  mainNav?.classList.toggle("open");
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav?.classList.remove("open");
  });
});


/* =========================================
   ANIMACIONES DE ENTRADA
========================================= */

function initRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach(element => {
      element.classList.add("visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    }
  );

  elements.forEach(element => {
    observer.observe(element);
  });
}

initRevealAnimations();


/* =========================================
   LOADER
========================================= */

window.addEventListener("load", () => {
  setTimeout(() => {
    loader?.classList.add("loaded");
  }, 700);
});


/* =========================================
   EFECTO DE LUZ DEL CURSOR
========================================= */

const cursorGlow = document.querySelector(".cursor-glow");

if (cursorGlow && window.matchMedia("(pointer:fine)").matches) {
  document.addEventListener("pointermove", event => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  });
}


/* =========================================
   VALIDACIÓN
========================================= */

function validateDeliveryData() {
  const delivery = getDelivery();

  if (delivery !== "home") {
    return true;
  }

  const address = document.getElementById("address")?.value.trim();
  const city = document.getElementById("city")?.value.trim();
  const postal = document.getElementById("postal")?.value.trim();

  if (!address || !city || !postal) {
    showToast("Completa la dirección de entrega.");
    document.getElementById("address")?.focus();
    return false;
  }

  return true;
}


/* =========================================
   GENERAR PEDIDO PARA WHATSAPP
========================================= */

function buildWhatsAppMessage() {
  const name =
    document.getElementById("name")?.value.trim() || "";

  const phone =
    document.getElementById("phone")?.value.trim() || "";

  const orderDate =
    document.getElementById("dateInput")?.value || "";

  const orderTime =
    document.getElementById("timeInput")?.value || "";

  const message =
    document.getElementById("message")?.value.trim() || "Sin observaciones";

  const delivery = getDelivery();

  const payment =
    document.querySelector(
      'input[name="payment"]:checked'
    )?.value || "paypal";

  const order = calculateOrder();

  const address =
    document.getElementById("address")?.value.trim() || "";

  const city =
    document.getElementById("city")?.value.trim() || "";

  const postal =
    document.getElementById("postal")?.value.trim() || "";

  let deliveryText = "";

  if (delivery === "pickup") {
    deliveryText =
      `🚉 *Punto de recogida:* ${CONFIG.pickupLocation}\n` +
      `💶 *Gasto de envío:* 0,00 €`;
  } else {
    deliveryText =
      `🏠 *Entrega:* A domicilio\n` +
      `📍 *Dirección:* ${address}\n` +
      `🏙️ *Localidad:* ${city}\n` +
      `📮 *Código postal:* ${postal}\n`;

    if (order.shipping === null) {
      deliveryText +=
        `💶 *Gasto de envío:* Por confirmar`;
    } else {
      deliveryText +=
        `💶 *Gasto de envío:* ${formatPrice(order.shipping)}`;
    }
  }

  const paymentText =
    payment === "paypal"
      ? "PayPal · Pago online"
      : "Metálico";

  const totalText =
    order.shipping === null
      ? `${formatPrice(order.subtotal)} + envío`
      : formatPrice(order.total);

  return (
    `🥟 *NUEVO PEDIDO DE EMPANADAS*\n\n` +

    `👤 *Nombre:* ${name}\n` +
    `📞 *Teléfono:* ${phone}\n` +
    `🥟 *Producto:* ${CONFIG.productName}\n` +
    `🥟 *Cantidad:* ${quantity}\n` +
    `💶 *Subtotal:* ${formatPrice(order.subtotal)}\n` +
    `💶 *Total:* ${totalText}\n\n` +

    `${deliveryText}\n\n` +

    `📅 *Fecha:* ${orderDate}\n` +
    `⏰ *Hora preferida:* ${orderTime}\n` +
    `💳 *Método de pago:* ${paymentText}\n` +
    `📝 *Mensaje:* ${message}\n\n` +

    `¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.`
  );
}


/* =========================================
   ENVÍO A WHATSAPP
========================================= */

orderForm?.addEventListener("submit", event => {
  event.preventDefault();

  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    showToast("Completa los campos obligatorios.");
    return;
  }

  if (!validateDeliveryData()) {
    return;
  }

  const message = buildWhatsAppMessage();

  const whatsappURL =
    `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;

  showToast("Abriendo WhatsApp con tu pedido...");

  setTimeout(() => {
    window.open(
      whatsappURL,
      "_blank",
      "noopener,noreferrer"
    );
  }, 500);
});


/* =========================================
   ABRIR WHATSAPP DIRECTAMENTE
========================================= */

document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  link.addEventListener("click", () => {
    link.style.transform = "scale(.98)";

    setTimeout(() => {
      link.style.transform = "";
    }, 180);
  });
});


/* =========================================
   ACTUALIZACIÓN INICIAL
========================================= */

setQuantity(1);
updateDeliveryUI();
updatePaymentUI();


/* =========================================
   PARALLAX SUAVE
========================================= */

if (
  window.matchMedia("(pointer:fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const heroProduct = document.querySelector(".hero-product");

  document.addEventListener("pointermove", event => {
    if (!heroProduct) return;

    const x =
      (event.clientX / window.innerWidth - 0.5) * 8;

    const y =
      (event.clientY / window.innerHeight - 0.5) * 8;

    heroProduct.style.transform =
      `translate(${x}px, ${y}px)`;
  });
}


/* =========================================
   TECLADO: ESC CIERRA MENÚ
========================================= */

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    mainNav?.classList.remove("open");
  }
});