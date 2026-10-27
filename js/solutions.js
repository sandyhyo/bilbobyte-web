/* ==========================================================
   01. ORDEN Y ESTADO DEL NAVEGADOR DE PRODUCTOS

   PRODUCT_ORDER define la secuencia izquierda → derecha.
   currentProduct rastrea el producto actualmente visible.
   isProductTransitioning bloquea cambios durante el giro.
   ========================================================== */

const PRODUCT_ORDER = [
    "connect",
    "core",
    "vault",
    "suite",
    "print"
];

const PANEL_EXIT_DURATION = 240;

let currentProduct       = "connect";
let isProductTransitioning = false;


/* ==========================================================
   02. REFERENCIAS DEL DOM
   ========================================================== */

const productNavButtons =
    document.querySelectorAll(".product-nav__button");


/* ==========================================================
   03. ACTUALIZAR PESTAÑAS

   Marca la pestaña activa y actualiza aria-current.
   ========================================================== */

function updateProductTabs(productName) {

    productNavButtons.forEach((button) => {

        const isActive =
            button.dataset.product === productName;

        button.classList.toggle(
            "product-nav__button--active",
            isActive
        );

        if (isActive) {
            button.setAttribute("aria-current", "true");
        } else {
            button.removeAttribute("aria-current");
        }

    });

}


/* ==========================================================
   04. ACTIVAR PRODUCTO

   Orquesta la transición 3D entre paneles:

   1. Determina la dirección (avanzar → derecha / retroceder → izquierda).
   2. Hace flotar el panel saliente en posición absolute con
      la animación de salida correspondiente.
   3. Muestra el panel entrante con la animación de entrada
      en la dirección opuesta.
   4. Limpia las clases de transición al terminar.

   Si no hay panel activo (p.ej. al llegar desde HOME),
   muestra el nuevo panel directamente sin salida.
   ========================================================== */

function activateProduct(productName) {

    if (productName === currentProduct || isProductTransitioning) {
        return;
    }


    /* ---- Dirección ---- */

    const currentIndex =
        PRODUCT_ORDER.indexOf(currentProduct);

    const targetIndex =
        PRODUCT_ORDER.indexOf(productName);

    const goingForward =
        targetIndex > currentIndex;


    /* ---- Paneles ---- */

    const currentPanel =
        document.getElementById(`product-${currentProduct}`);

    const targetPanel =
        document.getElementById(`product-${productName}`);


    isProductTransitioning = true;


    /* ---- Actualizar pestañas inmediatamente ---- */

    updateProductTabs(productName);
    currentProduct = productName;


    /* ---- Salida del panel actual ---- */

    if (currentPanel && currentPanel.classList.contains("product--active")) {

        currentPanel.classList.remove("product--active", "product--from-left");

        currentPanel.classList.add(
            "product--exiting",
            goingForward ? "product--to-left" : "product--to-right"
        );


        /*
         Limpiamos el panel saliente cuando termina su animación.
         Usamos animationend para no depender de timeouts fijos.
        */

        function onExitEnd(event) {

            /* Ignorar eventos de hijos si los hubiera */
            if (event.target !== currentPanel) {
                return;
            }

            currentPanel.classList.remove(
                "product--exiting",
                "product--to-left",
                "product--to-right"
            );

            currentPanel.removeEventListener(
                "animationend",
                onExitEnd
            );

        }

        currentPanel.addEventListener("animationend", onExitEnd);

    }


    /* ---- Entrada del panel nuevo ---- */

    if (targetPanel) {

        /* Limpiamos posibles clases residuales */
        targetPanel.classList.remove(
            "product--exiting",
            "product--to-left",
            "product--to-right",
            "product--from-left"
        );

        /* Asignamos la dirección de entrada antes de activar */
        if (!goingForward) {
            targetPanel.classList.add("product--from-left");
        }

        targetPanel.classList.add("product--active");


        /* Desbloquear tras la animación de entrada */

        function onEnterEnd(event) {

            if (event.target !== targetPanel) {
                return;
            }

            targetPanel.classList.remove("product--from-left");

            isProductTransitioning = false;

            targetPanel.removeEventListener(
                "animationend",
                onEnterEnd
            );

        }

        targetPanel.addEventListener("animationend", onEnterEnd);

    } else {

        isProductTransitioning = false;

    }

}


/* ==========================================================
   05. ACTIVAR PRODUCTO DESDE HOME (sin animación de salida)

   Cuando llegamos desde HOME a SOLUCIONES directamente,
   no hay panel previo visible, por lo que activamos el
   destino con la animación de entrada estándar sin
   esperar a que salga nada.
   ========================================================== */

function activateProductDirect(productName) {

    /* Si ya está activo, no hacemos nada */
    if (productName === currentProduct) {
        return;
    }

    const panels =
        document.querySelectorAll(".product-panel");

    /* Limpiar todos los paneles */
    panels.forEach((panel) => {

        panel.classList.remove(
            "product--active",
            "product--exiting",
            "product--to-left",
            "product--to-right",
            "product--from-left"
        );

    });

    const targetPanel =
        document.getElementById(`product-${productName}`);

    if (targetPanel) {

        /* La dirección desde HOME es siempre "desde el frente" */
        targetPanel.classList.add("product--active");

    }

    updateProductTabs(productName);
    currentProduct = productName;

}


/* ==========================================================
   06. EVENTOS DE LAS PESTAÑAS
   ========================================================== */

productNavButtons.forEach((button) => {

    button.addEventListener("click", () => {

        activateProduct(button.dataset.product);

    });

});


/* ==========================================================
   07. BOTONES DE SOLUCIONES EN HOME

   Al pulsar CONNECT / CORE / VAULT / SUITE / PRINT en HOME,
   navegamos a SOLUCIONES y abrimos directamente el producto.

   Usamos activateProductDirect porque en ese momento no
   hay ningún panel visualmente activo desde la perspectiva
   del usuario — la sección SOLUCIONES acaba de aparecer.
   ========================================================== */

const homeSolutionButtons =
    document.querySelectorAll(".home-solutions button[data-product]");


homeSolutionButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const product = button.dataset.product;

        /* Navegar a SOLUCIONES — función definida en cube.js */
        navigateTo("solutions");

        /*
         Esperamos a que el contenido haya aparecido
         (CONTENT_CHANGE_DELAY + margen de animación de entrada
         de la sección) antes de cambiar el producto.
        */

        window.setTimeout(() => {

            activateProductDirect(product);

        }, CONTENT_CHANGE_DELAY + 80);

    });

});


/* ==========================================================
   08. FORMULARIO DE CONTACTO
   ========================================================== */

const contactForm =
    document.getElementById("contactForm");

const contactFormStatus =
    document.getElementById("contact-form-status");


if (contactForm) {


    /* ----------------------------------------------------------
       Fallback :user-invalid — añade .input--touched cuando
       el usuario abandona un campo, para navegadores sin
       soporte nativo de :user-invalid.
       ---------------------------------------------------------- */

    const trackedInputs =
        contactForm.querySelectorAll(".contact-form__input");

    trackedInputs.forEach((input) => {

        input.addEventListener("blur", () => {
            input.classList.add("input--touched");
        });

    });


    /* ----------------------------------------------------------
       Validación y envío
       ---------------------------------------------------------- */

    contactForm.addEventListener("submit", (event) => {

        event.preventDefault();

        clearFormErrors();


        /* ---- Detección de honeypot ---- */

        const honeypot =
            contactForm.querySelector("[name='website']");

        if (honeypot && honeypot.value.trim() !== "") {
            /* Probable bot — silenciar sin retroalimentación */
            showFormSuccess();
            return;
        }


        /* ---- Recogida de valores ---- */

        const nameField =
            contactForm.querySelector("#contact-name");

        const emailField =
            contactForm.querySelector("#contact-email");

        const messageField =
            contactForm.querySelector("#contact-message");


        /* ---- Validación manual + aria-invalid ---- */

        let isValid = true;

        if (!nameField.validity.valid) {
            showFieldError(
                nameField,
                "contact-name-error",
                "Por favor, escribe tu nombre."
            );
            isValid = false;
        }

        if (!emailField.validity.valid) {
            showFieldError(
                emailField,
                "contact-email-error",
                "Por favor, indica un correo electrónico válido."
            );
            isValid = false;
        }

        if (!messageField.validity.valid) {
            showFieldError(
                messageField,
                "contact-message-error",
                "Por favor, escribe tu mensaje."
            );
            isValid = false;
        }

        if (!isValid) {
            return;
        }


        /* ---- Envío real via Web3Forms ---- */

        const submitButton =
            contactForm.querySelector(".contact-form__submit");

        submitButton.disabled = true;

        /*
         Web3Forms: reenvía el mensaje al email del propietario sin
         almacenar los datos en servidores de terceros.
         Reemplaza "TU_ACCESS_KEY_AQUI" con la key obtenida en
         https://web3forms.com (gratis, sin registro de cuenta).
        */

        const WEB3FORMS_ACCESS_KEY = "56f32ab1-3283-43b9-9558-63c7818023b7";

        const formPayload = {
            access_key:   WEB3FORMS_ACCESS_KEY,
            name:         nameField.value.trim(),
            email:        emailField.value.trim(),
            message:      messageField.value.trim(),
            subject:      "Nuevo mensaje de contacto — BilboByte",
            from_name:    "Formulario BilboByte",
            /* Bloquea el reCAPTCHA invisible de Web3Forms */
            botcheck:     false,
        };

        fetch("https://api.web3forms.com/submit", {
            method:  "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body:    JSON.stringify(formPayload),
        })
        .then((response) => response.json())
        .then((data) => {

            if (data.success) {
                showFormSuccess();
                contactForm.reset();
                trackedInputs.forEach((input) => {
                    input.classList.remove("input--touched");
                    input.removeAttribute("aria-invalid");
                });
            } else {
                /* Error devuelto por Web3Forms (key inválida, etc.) */
                contactFormStatus.textContent =
                    "Hubo un problema al enviar el mensaje. Por favor, inténtalo de nuevo.";
                contactFormStatus.className =
                    "contact-form__status contact-form__status--error";
                console.error("Web3Forms error:", data);
            }

        })
        .catch(() => {
            /* Error de red (sin conexión, timeout, etc.) */
            contactFormStatus.textContent =
                "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.";
            contactFormStatus.className =
                "contact-form__status contact-form__status--error";
        })
        .finally(() => {
            submitButton.disabled = false;
        });

    });

}


/* ==========================================================
   09. UTILIDADES DEL FORMULARIO
   ========================================================== */

function showFieldError(field, errorId, message) {

    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", errorId);

    const errorEl = document.getElementById(errorId);

    if (errorEl) {
        errorEl.textContent = message;
    }

}


function clearFormErrors() {

    if (!contactForm) {
        return;
    }

    contactForm
        .querySelectorAll(".contact-form__error")
        .forEach((el) => {
            el.textContent = "";
        });

    contactForm
        .querySelectorAll(".contact-form__input")
        .forEach((el) => {
            el.removeAttribute("aria-invalid");
            el.removeAttribute("aria-describedby");
        });

    contactFormStatus.textContent = "";
    contactFormStatus.className = "contact-form__status";

}


function showFormSuccess() {

    contactFormStatus.textContent =
        "Mensaje enviado. Nos pondremos en contacto contigo pronto.";

    contactFormStatus.className =
        "contact-form__status contact-form__status--success";

}
