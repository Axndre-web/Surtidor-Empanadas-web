/* script.js */

document.addEventListener("DOMContentLoaded", () => {

  const WHATSAPP_NUMBER = "34602487576";

  const PRICE_PER_UNIT = 1;

  /*
    CONFIGURACIÓN DE ENVÍO

    Puedes modificar estos valores según tu zona.

    Si una zona tiene coste 0, no se añade ningún gasto.
    Puedes añadir más zonas al objeto SHIPPING_ZONES.
  */

  const SHIPPING_ZONES = {
    "azuqueca": 0,
    "alcala": 5,
    "madrid": 10,
    "otro": 10
  };


  const $ = (selector) =>
    document.querySelector(selector);


  /* LOADER */

  window.addEventListener("load", () => {

    setTimeout(() => {

      $("#loader").classList.add("hide");

    }, 500);

  });


  /* RELOJ */

  function updateClock() {

    const now = new Date();

    const hours =
      String(now.getHours()).padStart(2, "0");

    const minutes =
      String(now.getMinutes()).padStart(2, "0");

    const seconds =
      String(now.getSeconds()).padStart(2, "0");

    const day =
      String(now.getDate()).padStart(2, "0");

    const month =
      String(now.getMonth() + 1).padStart(2, "0");

    const year =
      now.getFullYear();


    $("#liveTime").textContent =
      `${hours}:${minutes}:${seconds}`;

    $("#liveDate").textContent =
      `${day}/${month}/${year}`;

  }


  updateClock();

  setInterval(updateClock, 1000);


  /* AÑO */

  $("#currentYear").textContent =
    new Date().getFullYear();


  /* ELEMENTOS */

  const quantity =
    $("#quantity");

  const deliveryType =
    $("#deliveryType");

  const address =
    $("#address");


  /* CALCULAR ENVÍO */

  function calculateShipping() {

    if (deliveryType.value === "recogida") {

      return 0;

    }


    /*
      Para domicilio se puede seleccionar
      una zona escribiéndola en la dirección.

      Azuqueca = 0 €
      Alcalá = 5 €
      Madrid = 10 €
      Otro = 10 €
    */

    const text =
      address.value
        .trim()
        .toLowerCase();


    if (
      text.includes("azuqueca") ||
      text.includes("azuqueca de henares")
    ) {

      return SHIPPING_ZONES.azuqueca;

    }


    if (
      text.includes("alcala") ||
      text.includes("alcalá")
    ) {

      return SHIPPING_ZONES.alcala;

    }


    if (
      text.includes("madrid")
    ) {

      return SHIPPING_ZONES.madrid;

    }


    return SHIPPING_ZONES.otro;

  }


  /* ACTUALIZAR TOTAL */

  function updateTotals() {

    let amount =
      parseInt(quantity.value, 10) || 1;


    amount =
      Math.max(
        1,
        Math.min(100, amount)
      );


    quantity.value =
      amount;


    const subtotal =
      amount * PRICE_PER_UNIT;


    const shipping =
      calculateShipping();


    const total =
      subtotal + shipping;


    $("#productSubtotal")
      .textContent =
      subtotal.toFixed(0);


    $("#shippingCost")
      .textContent =
      `${shipping.toFixed(0)} €`;


    $("#grandTotal")
      .textContent =
      total.toFixed(0);


    $("#summaryQuantity")
      .textContent =
      amount;


    $("#summaryShipping")
      .textContent =
      `${shipping.toFixed(0)} €`;


    $("#summaryTotal")
      .textContent =
      total.toFixed(0);

  }


  /* CANTIDAD */

  $("#decrease").addEventListener(
    "click",
    () => {

      quantity.value =
        Math.max(
          1,
          (parseInt(quantity.value,10) || 1) - 1
        );

      updateTotals();

    }
  );


  $("#increase").addEventListener(
    "click",
    () => {

      quantity.value =
        Math.min(
          100,
          (parseInt(quantity.value,10) || 1) + 1
        );

      updateTotals();

    }
  );


  quantity.addEventListener(
    "input",
    updateTotals
  );


  /* ENTREGA */

  function updateDeliveryInterface() {

    const isHome =
      deliveryType.value === "domicilio";


    $("#homeDelivery")
      .classList.toggle(
        "hidden",
        !isHome
      );


    $("#pickupInfo")
      .classList.toggle(
        "hidden",
        isHome
      );


    address.required =
      isHome;


    $("#summaryDelivery")
      .textContent =
      isHome
        ? "A domicilio"
        : "Recogida";


    updateTotals();

  }


  deliveryType.addEventListener(
    "change",
    updateDeliveryInterface
  );


  address.addEventListener(
    "input",
    updateTotals
  );


  updateDeliveryInterface();


  /* WHATSAPP */

  $("#orderForm").addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const form =
        event.currentTarget;


      if (!form.checkValidity()) {

        form.reportValidity();

        return;

      }


      const name =
        $("#customerName")
          .value
          .trim();


      const phone =
        $("#customerPhone")
          .value
          .trim();


      const amount =
        parseInt(
          quantity.value,
          10
        );


      const subtotal =
        amount * PRICE_PER_UNIT;


      const shipping =
        calculateShipping();


      const total =
        subtotal + shipping;


      const delivery =
        deliveryType.value;


      const customerAddress =
        address.value
          .trim();


      const message =
        $("#message")
          .value
          .trim() ||
        "Sin observaciones.";


      const now =
        new Date();


      const date =
        `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2,"0")}-${String(
          now.getDate()
        ).padStart(2,"0")}`;


      let deliveryText;


      if (
        delivery === "domicilio"
      ) {

        deliveryText =
`🏠 *Entrega:* A domicilio
📍 *Dirección:* ${customerAddress}
🚚 *Gastos de envío:* ${shipping} €`;

      } else {

        deliveryText =
`🚆 *Entrega:* Punto de recogida
📍 *Punto:* Estación de Renfe de Azuqueca de Henares
🚚 *Gastos de recogida:* 0 €`;

      }


      const whatsappMessage =
`🥟 *NUEVO PEDIDO DE EMPANADAS*

👤 *Nombre:* ${name}
📞 *Teléfono:* ${phone}
🥟 *Cantidad:* ${amount}
💶 *Subtotal:* ${subtotal} €
${deliveryText}
💰 *TOTAL:* ${total} €
📅 *Fecha:* ${date}
📝 *Mensaje:* ${message}

🔐 *PAGO ANTICIPADO*
El pedido debe abonarse antes de preparar y coordinar la entrega.

¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.`;


      const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(
          whatsappMessage
        )}`;


      showToast(
        "Pedido preparado. Abriendo WhatsApp..."
      );


      setTimeout(() => {

        window.open(
          whatsappURL,
          "_blank",
          "noopener,noreferrer"
        );

      }, 500);

    }
  );


  /* MENÚ MÓVIL */

  const menuToggle =
    $("#menuToggle");

  const mainNav =
    $("#mainNav");


  menuToggle.addEventListener(
    "click",
    () => {

      const opened =
        mainNav.classList.toggle(
          "open"
        );


      menuToggle.setAttribute(
        "aria-expanded",
        String(opened)
      );

    }
  );


  mainNav
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {

          mainNav.classList.remove(
            "open"
          );

          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });


  /* ANIMACIONES */

  const observer =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

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

        });

      },
      {
        threshold: .12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach((element) => {

      observer.observe(element);

    });


  /* GOOGLE */

  $("#googleSearch")
    .addEventListener(
      "submit",
      (event) => {

        event.preventDefault();


        const query =
          $("#googleQuery")
            .value
            .trim();


        if (!query) {

          showToast(
            "Escribe algo para buscar."
          );

          return;

        }


        const googleURL =
          `https://www.google.com/search?q=` +
          encodeURIComponent(query);


        window.open(
          googleURL,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );


  /* BOTÓN ARRIBA */

  const backTop =
    $("#backTop");


  window.addEventListener(
    "scroll",
    () => {

      if (
        window.scrollY > 500
      ) {

        backTop.classList.add(
          "show"
        );

      } else {

        backTop.classList.remove(
          "show"
        );

      }

    },
    {
      passive: true
    }
  );


  backTop.addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );


  /* MENSAJE */

  function showToast(message) {

    const toast =
      $("#toast");


    toast.textContent =
      message;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      showToast.timer
    );


    showToast.timer =
      setTimeout(
        () => {

          toast.classList.remove(
            "show"
          );

        },
        3500
      );

  }


  /* INICIO */

  updateTotals();

});