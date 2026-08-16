// script.js

"use strict";


/* =========================================================
   CONFIGURACIÓN PRINCIPAL
========================================================= */

const CONFIG = {
  whatsapp: "34602487576",

  product: {
    name: "Empanada de pollo",
    price: 1.00
  },

  pickup: {
    name: "Punto de recogida",
    location: "Estación de RENFE de Azuqueca de Henares",
    shipping: 0
  },

  /*
    Si quieres establecer posteriormente un precio fijo
    para el domicilio, cambia null por un número.

    Ejemplo:
    homeDeliveryShipping: 2.50

    Si permanece en null:
    el coste se mostrará como "Consultar".
  */
  homeDeliveryShipping: null
};


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = selector =>
  document.querySelector(selector);

const $$ = selector =>
  document.querySelectorAll(selector);

const loader = $("#pageLoader");

const clock = $("#clock");
const date = $("#date");

const quantityElement = $("#quantity");
const plusBtn = $("#plusBtn");
const minusBtn = $("#minusBtn");

const summaryQuantity = $("#summaryQuantity");
const subtotalElement = $("#subtotal");
const shippingElement = $("#shipping");
const totalElement = $("#total");

const paypalTotal = $("#paypalTotal");
const paypalUnits = $("#paypalUnits");

const addressPanel = $("#addressPanel");
const shippingLabel = $("#shippingLabel");

const paypalPanel = $("#paypalPanel");
const cashPanel = $("#cashPanel");

const orderForm = $("#orderForm");

const menuToggle = $("#menuToggle");
const mainNav = $("#mainNav");

const toast = $("#toast");
const toastText = $("#toastText");


/* =========================================================
   ESTADO
========================================================= */

let quantity = 1;


/* =========================================================
   FORMATO DE DINERO
========================================================= */

function money(value) {

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(value);

}


/* =========================================================
   TOAST
========================================================= */

function notify(message) {

  if (!toast || !toastText) return;

  toastText.textContent = message;

  toast.classList.add("show");

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {

    toast.classList.remove("show");

  }, 3500);

}


/* =========================================================
   RELOJ
========================================================= */

function updateClock() {

  const now = new Date();

  const currentTime =
    new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);

  const currentDate =
    new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(now);

  if (clock) {

    clock.textContent =
      currentTime;

  }

  if (date) {

    date.textContent =
      currentDate
        .charAt(0)
        .toUpperCase()
      +
      currentDate.slice(1);

  }

}

updateClock();

setInterval(
  updateClock,
  1000
);


/* =========================================================
   FECHA MÍNIMA
========================================================= */

const orderDate = $("#orderDate");

if (orderDate) {

  const today = new Date();

  const yyyy =
    today.getFullYear();

  const mm =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");

  const dd =
    String(
      today.getDate()
    ).padStart(2, "0");

  const todayString =
    `${yyyy}-${mm}-${dd}`;

  orderDate.min =
    todayString;

  orderDate.value =
    todayString;

}


/* =========================================================
   HORA POR DEFECTO
========================================================= */

const orderTime = $("#orderTime");

if (orderTime) {

  const now = new Date();

  let hour =
    now.getHours();

  let minute =
    now.getMinutes();

  minute =
    Math.ceil(minute / 15) * 15;

  if (minute >= 60) {

    minute = 0;
    hour++;

  }

  if (hour > 23) {

    hour = 23;
    minute = 45;

  }

  orderTime.value =
    `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

}


/* =========================================================
   ENTREGA SELECCIONADA
========================================================= */

function getDelivery() {

  return $(
    'input[name="delivery"]:checked'
  )?.value || "pickup";

}


/* =========================================================
   PAGO SELECCIONADO
========================================================= */

function getPayment() {

  return $(
    'input[name="payment"]:checked'
  )?.value || "paypal";

}


/* =========================================================
   COSTE DE ENVÍO
========================================================= */

function getShipping() {

  const delivery =
    getDelivery();

  if (delivery === "pickup") {

    return 0;

  }

  return CONFIG.homeDeliveryShipping;

}


/* =========================================================
   CALCULAR PEDIDO
========================================================= */

function calculateOrder() {

  const subtotal =
    quantity *
    CONFIG.product.price;

  const shipping =
    getShipping();

  const total =
    shipping === null
      ? null
      : subtotal + shipping;

  return {
    quantity,
    subtotal,
    shipping,
    total
  };

}


/* =========================================================
   ACTUALIZAR RESUMEN
========================================================= */

function updateSummary() {

  const order =
    calculateOrder();

  if (quantityElement) {

    quantityElement.textContent =
      quantity;

  }

  if (summaryQuantity) {

    summaryQuantity.textContent =
      `${quantity} × ${money(CONFIG.product.price)}`;

  }

  if (subtotalElement) {

    subtotalElement.textContent =
      money(order.subtotal);

  }

  if (order.shipping === null) {

    shippingElement.textContent =
      "Consultar";

    totalElement.textContent =
      `${money(order.subtotal)} + envío`;

  } else {

    shippingElement.textContent =
      money(order.shipping);

    totalElement.textContent =
      money(order.total);

  }

  if (paypalTotal) {

    paypalTotal.textContent =
      order.total === null
        ? `${money(order.subtotal)} + envío`
        : money(order.total);

  }

  if (paypalUnits) {

    paypalUnits.textContent =
      quantity === 1
        ? "1 unidad"
        : `${quantity} unidades`;

  }

}


/* =========================================================
   CANTIDAD
========================================================= */

function setQuantity(value) {

  const parsed =
    Number(value);

  if (!Number.isFinite(parsed)) {

    quantity = 1;

  } else {

    quantity =
      Math.max(
        1,
        Math.min(
          99,
          Math.round(parsed)
        )
      );

  }

  updateSummary();

  $$(".offer-card").forEach(card => {

    card.classList.toggle(
      "active",
      Number(card.dataset.qty) === quantity
    );

  });

}


/* =========================================================
   BOTONES + / -
========================================================= */

plusBtn?.addEventListener(
  "click",
  () => {

    setQuantity(
      quantity + 1
    );

  }
);


minusBtn?.addEventListener(
  "click",
  () => {

    setQuantity(
      quantity - 1
    );

  }
);


/* =========================================================
   OFERTAS / PACKS
========================================================= */

$$(".offer-card").forEach(
  card => {

    card.addEventListener(
      "click",
      () => {

        const qty =
          Number(
            card.dataset.qty
          );

        setQuantity(qty);

        notify(
          `Pack de ${qty} seleccionado.`
        );

      }
    );

  }
);


/* =========================================================
   ENTREGA
========================================================= */

function updateDelivery() {

  const delivery =
    getDelivery();

  if (delivery === "home") {

    addressPanel?.classList.remove(
      "hidden"
    );

    if (
      CONFIG.homeDeliveryShipping === null
    ) {

      shippingLabel.textContent =
        "CONSULTAR";

    } else {

      shippingLabel.textContent =
        money(
          CONFIG.homeDeliveryShipping
        );

    }

  } else {

    addressPanel?.classList.add(
      "hidden"
    );

    shippingLabel.textContent =
      "GRATIS";

  }

  updateSummary();

}


$$('input[name="delivery"]')
  .forEach(input => {

    input.addEventListener(
      "change",
      updateDelivery
    );

  });


/* =========================================================
   MÉTODO DE PAGO
========================================================= */

function updatePayment() {

  const payment =
    getPayment();

  if (payment === "paypal") {

    paypalPanel?.classList.remove(
      "hidden"
    );

    cashPanel?.classList.add(
      "hidden"
    );

  } else {

    paypalPanel?.classList.add(
      "hidden"
    );

    cashPanel?.classList.remove(
      "hidden"
    );

  }

}


$$('input[name="payment"]')
  .forEach(input => {

    input.addEventListener(
      "change",
      updatePayment
    );

  });


/* =========================================================
   MENÚ MÓVIL
========================================================= */

menuToggle?.addEventListener(
  "click",
  () => {

    mainNav?.classList.toggle(
      "open"
    );

  }
);


$$(".main-nav a").forEach(
  link => {

    link.addEventListener(
      "click",
      () => {

        mainNav?.classList.remove(
          "open"
        );

      }
    );

  }
);


/* =========================================================
   ANIMACIONES DE ENTRADA
========================================================= */

function initReveal() {

  const elements =
    $$(".reveal");

  if (
    !("IntersectionObserver" in window)
  ) {

    elements.forEach(
      element =>
        element.classList.add(
          "visible"
        )
    );

    return;
  }

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: .12,
        rootMargin:
          "0px 0px -40px 0px"
      }
    );

  elements.forEach(
    element =>
      observer.observe(element)
  );

}

initReveal();


/* =========================================================
   LOADER
========================================================= */

window.addEventListener(
  "load",
  () => {

    setTimeout(
      () => {

        loader?.classList.add(
          "loaded"
        );

      },
      650
    );

  }
);


/* =========================================================
   VALIDAR DIRECCIÓN
========================================================= */

function validateAddress() {

  if (
    getDelivery() !== "home"
  ) {

    return true;

  }

  const address =
    $("#address")?.value.trim();

  const city =
    $("#city")?.value.trim();

  const postal =
    $("#postal")?.value.trim();

  if (
    !address ||
    !city ||
    !postal
  ) {

    notify(
      "Completa todos los datos de entrega."
    );

    $("#address")?.focus();

    return false;

  }

  return true;

}


/* =========================================================
   TEXTO DE ENTREGA
========================================================= */

function buildDeliveryText(order) {

  if (
    getDelivery() === "pickup"
  ) {

    return (
      `📦 *Entrega:* Punto de recogida\n` +
      `🚉 *Lugar:* ${CONFIG.pickup.location}\n` +
      `💶 *Gasto de envío:* 0,00 €`
    );

  }

  const address =
    $("#address")?.value.trim() || "";

  const city =
    $("#city")?.value.trim() || "";

  const postal =
    $("#postal")?.value.trim() || "";

  let text =
    `📦 *Entrega:* A domicilio\n` +
    `📍 *Dirección:* ${address}\n` +
    `🏙️ *Localidad:* ${city}\n` +
    `📮 *Código postal:* ${postal}\n`;

  if (
    order.shipping === null
  ) {

    text +=
      `💶 *Gasto de envío:* Por confirmar`;

  } else {

    text +=
      `💶 *Gasto de envío:* ${money(order.shipping)}`;

  }

  return text;

}


/* =========================================================
   CONSTRUIR PEDIDO WHATSAPP
========================================================= */

function buildWhatsAppMessage() {

  const name =
    $("#name")?.value.trim() || "";

  const phone =
    $("#phone")?.value.trim() || "";

  const date =
    $("#orderDate")?.value || "";

  const time =
    $("#orderTime")?.value || "";

  const message =
    $("#message")?.value.trim()
    || "Sin observaciones";

  const payment =
    getPayment();

  const order =
    calculateOrder();

  const paymentText =
    payment === "paypal"
      ? "PayPal · Pago online"
      : "Metálico";

  const totalText =
    order.total === null
      ? `${money(order.subtotal)} + envío`
      : money(order.total);

  return (
    `🥟 *NUEVO PEDIDO DE EMPANADAS*\n\n` +

    `👤 *Nombre:* ${name}\n` +

    `📞 *Teléfono:* ${phone}\n` +

    `🥟 *Producto:* ${CONFIG.product.name}\n` +

    `🥟 *Cantidad:* ${quantity}\n` +

    `💶 *Precio unidad:* ${money(CONFIG.product.price)}\n` +

    `💶 *Subtotal:* ${money(order.subtotal)}\n` +

    `💶 *Total:* ${totalText}\n\n` +

    `${buildDeliveryText(order)}\n\n` +

    `📅 *Fecha:* ${date}\n` +

    `⏰ *Hora:* ${time}\n` +

    `💳 *Método de pago:* ${paymentText}\n` +

    `📝 *Mensaje:* ${message}\n\n` +

    `¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.`
  );

}


/* =========================================================
   ENVIAR PEDIDO A WHATSAPP
========================================================= */

orderForm?.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    if (
      !orderForm.checkValidity()
    ) {

      orderForm.reportValidity();

      notify(
        "Completa los campos obligatorios."
      );

      return;

    }

    if (
      !validateAddress()
    ) {

      return;

    }

    const message =
      buildWhatsAppMessage();

    const whatsappUrl =
      `https://wa.me/${CONFIG.whatsapp}` +
      `?text=${encodeURIComponent(message)}`;

    notify(
      "Abriendo WhatsApp con tu pedido..."
    );

    setTimeout(
      () => {

        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer"
        );

      },
      450
    );

  }
);


/* =========================================================
   EFECTO INTERACTIVO DEL RATÓN
========================================================= */

if (
  window.matchMedia(
    "(pointer:fine)"
  ).matches &&
  !window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
) {

  const heroArt =
    document.querySelector(
      ".hero-art"
    );

  document.addEventListener(
    "pointermove",
    event => {

      if (!heroArt) return;

      const x =
        (event.clientX /
          window.innerWidth -
          .5) * 8;

      const y =
        (event.clientY /
          window.innerHeight -
          .5) * 8;

      heroArt.style.transform =
        `translate(${x}px, ${y}px)`;

    }
  );

}


/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      mainNav?.classList.remove(
        "open"
      );

    }

  }
);


/* =========================================================
   INICIALIZACIÓN
========================================================= */

setQuantity(1);

updateDelivery();

updatePayment();