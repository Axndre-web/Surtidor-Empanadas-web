/* script.js */

document.addEventListener("DOMContentLoaded", () => {

  const WHATSAPP = "34602487576";
  const PRICE = 1;

  const $ = (selector) => document.querySelector(selector);


  /* LOADER */

  window.addEventListener("load", () => {

    setTimeout(() => {

      $("#loader").classList.add("hidden");

    }, 400);

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

    $("#time").textContent =
      `${hours}:${minutes}:${seconds}`;

    $("#date").textContent =
      `${day}/${month}/${year}`;

  }

  updateClock();

  setInterval(updateClock, 1000);


  /* AÑO */

  $("#year").textContent =
    new Date().getFullYear();


  /* CANTIDAD */

  const quantity = $("#quantity");

  function updatePrice() {

    let value =
      parseInt(quantity.value, 10) || 1;

    value =
      Math.max(1, Math.min(100, value));

    quantity.value = value;

    const total =
      value * PRICE;

    $("#total").textContent =
      total.toFixed(0);

    $("#summaryTotal").textContent =
      total.toFixed(0);

    $("#summaryQuantity").textContent =
      value;

  }


  $("#minus").addEventListener("click", () => {

    quantity.value =
      Math.max(
        1,
        (parseInt(quantity.value, 10) || 1) - 1
      );

    updatePrice();

  });


  $("#plus").addEventListener("click", () => {

    quantity.value =
      Math.min(
        100,
        (parseInt(quantity.value, 10) || 1) + 1
      );

    updatePrice();

  });


  quantity.addEventListener(
    "input",
    updatePrice
  );


  /* ENTREGA */

  const delivery =
    $("#delivery");

  function updateDelivery() {

    const home =
      delivery.value === "domicilio";

    $("#addressContainer")
      .classList.toggle(
        "hidden",
        !home
      );

    $("#pickupContainer")
      .classList.toggle(
        "hidden",
        home
      );

    $("#address").required =
      home;

    $("#summaryDelivery")
      .textContent =
      home
        ? "A domicilio"
        : "Recogida";

  }


  delivery.addEventListener(
    "change",
    updateDelivery
  );

  updateDelivery();


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
        $("#name").value.trim();

      const phone =
        $("#phone").value.trim();

      const amount =
        parseInt(
          $("#quantity").value,
          10
        );

      const total =
        amount * PRICE;

      const type =
        $("#delivery").value;

      const address =
        $("#address").value.trim();

      const message =
        $("#message").value.trim() ||
        "Sin mensaje adicional.";


      const now =
        new Date();

      const date =
        `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(
          now.getDate()
        ).padStart(2, "0")}`;


      let deliveryText;


      if (type === "domicilio") {

        deliveryText =
`🏠 *Entrega:* A domicilio
📍 *Dirección:* ${address}`;

      } else {

        deliveryText =
`🚆 *Entrega:* Recogida gratuita
📍 *Punto de recogida:* Estación de Renfe de Azuqueca de Henares`;

      }


      const whatsappMessage =
`🥟 *NUEVO PEDIDO DE EMPANADAS*

👤 *Nombre:* ${name}
📞 *Teléfono:* ${phone}
🥟 *Cantidad:* ${amount} unidades
💶 *Total:* ${total} €
${deliveryText}
📅 *Fecha:* ${date}
📝 *Mensaje:* ${message}

¡Hola! Me gustaría confirmar la disponibilidad de mi pedido.`;


      const url =
        `https://wa.me/${WHATSAPP}?text=` +
        encodeURIComponent(
          whatsappMessage
        );


      showToast(
        "Pedido preparado. Abriendo WhatsApp..."
      );


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );

    }
  );


  /* MENÚ MÓVIL */

  const menuButton =
    $("#menuButton");

  const nav =
    $("#nav");


  menuButton.addEventListener(
    "click",
    () => {

      nav.classList.toggle(
        "open"
      );

    }
  );


  nav.querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {

          nav.classList.remove(
            "open"
          );

        }
      );

    });


  /* ANIMACIONES */

  const observer =
    new IntersectionObserver(
      (entries, observer) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

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
        threshold: 0.12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach((element) => {

      observer.observe(element);

    });


  /* GOOGLE */

  $("#googleForm")
    .addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        const query =
          $("#googleInput")
            .value
            .trim();

        if (!query) {

          showToast(
            "Escribe algo para buscar."
          );

          return;

        }


        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );


  /* BOTÓN ARRIBA */

  const topButton =
    $("#topButton");


  window.addEventListener(
    "scroll",
    () => {

      if (window.scrollY > 500) {

        topButton.classList.add(
          "show"
        );

      } else {

        topButton.classList.remove(
          "show"
        );

      }

    },
    {
      passive: true
    }
  );


  topButton.addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );


  /* TOAST */

  function showToast(text) {

    const toast =
      $("#toast");

    toast.textContent =
      text;

    toast.classList.add(
      "show"
    );

    clearTimeout(
      showToast.timeout
    );

    showToast.timeout =
      setTimeout(() => {

        toast.classList.remove(
          "show"
        );

      }, 3500);

  }


  /* PRECIO INICIAL */

  updatePrice();

});