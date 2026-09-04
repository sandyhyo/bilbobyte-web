 /* ==========================================================
   01. CONFIGURACIÓN DE TRANSICIONES

   CUBE_DURATION:
   Duración completa del giro del cubo.
   Debe coincidir con --cube-duration en cube.css.

   CONTENT_CHANGE_DELAY:
   Momento, dentro del giro, en el que comienza a aparecer
   el contenido de la nueva sección.

   Estos dos valores permiten ajustar fácilmente la sensación
   general de la navegación.
   ========================================================== */

const CUBE_DURATION = 700;
const CONTENT_CHANGE_DELAY = 380;


/* ==========================================================
   02. ELEMENTOS PRINCIPALES
   ========================================================== */

const navigationCube = document.getElementById("navigationCube");

const navigationButtons = document.querySelectorAll(
    "[data-section]"
);

const sectionSelectorButtons = document.querySelectorAll(
    ".section-selector__button"
);

const pageSections = document.querySelectorAll(
    ".page-section"
);


/* ==========================================================
   03. ESTADO ACTUAL

   currentSection:
   Área principal que se encuentra abierta.

   isCubeRotating:
   Evita nuevas órdenes mientras existe una transición
   principal en curso.
   ========================================================== */

let currentSection = "home";
let isCubeRotating = false;


/* ==========================================================
   04. POSICIONES DEL CUBO

   Cada sección tiene una orientación que coloca su cara
   correspondiente como protagonista.

   Conservamos cierta inclinación para que el objeto siga
   percibiéndose tridimensional incluso en reposo.
   ========================================================== */

const cubePositions = {

    home: {
        x: -30,
        y: -28
    },

    solutions: {
        x: -30,
        y: -118
    },

    contact: {
        x: -120,
        y: -28
    }

};


/* ==========================================================
   05. ORIENTAR EL CUBO

   Aplica las rotaciones X/Y correspondientes al destino.
   CSS se encarga de interpolar el movimiento.
   ========================================================== */

function rotateCube(sectionName) {

    const position = cubePositions[sectionName];

    if (!position) {
        return;
    }

    navigationCube.style.transform =
        `rotateX(${position.x}deg) rotateY(${position.y}deg)`;
}


/* ==========================================================
   06. ACTUALIZAR SELECTOR

   Marca visualmente cuál de las tres áreas principales
   se encuentra abierta.
   ========================================================== */

function updateSectionSelector(sectionName) {

    sectionSelectorButtons.forEach((button) => {

        const isActive =
            button.dataset.section === sectionName;

        button.classList.toggle("active", isActive);
    });
}


/* ==========================================================
   07. NAVEGAR ENTRE ÁREAS

   La transición completa funciona como una única secuencia:

   1. Comienza la salida del contenido actual.
   2. El cubo empieza a girar simultáneamente.
   3. Durante el giro aparece el nuevo contenido.
   4. El cubo termina de asentarse.
   5. Se desbloquea nuevamente la navegación.

   El objetivo es evitar la sensación artificial de:
   "primero gira el cubo y después cambia la página".
   ========================================================== */

function navigateTo(sectionName) {

    /* ------------------------------------------------------
       Evitar cambios mientras existe una transición activa
       o si ya estamos en la sección solicitada.
       ------------------------------------------------------ */

    if (
        isCubeRotating ||
        sectionName === currentSection
    ) {
        return;
    }

    isCubeRotating = true;


    /* ------------------------------------------------------
       1. SALIDA DEL CONTENIDO ACTUAL
       ------------------------------------------------------ */

    const currentPage =
        document.getElementById(currentSection);

    if (currentPage) {
        currentPage.classList.add("leaving");
    }


    /* ------------------------------------------------------
       2. INICIO DEL GIRO DEL CUBO
       ------------------------------------------------------ */

    rotateCube(sectionName);


    /* ------------------------------------------------------
       3. CAMBIO DE CONTENIDO DURANTE EL GIRO

       La nueva sección aparece antes de que el cubo haya
       terminado completamente su movimiento.
       ------------------------------------------------------ */

    window.setTimeout(() => {

        if (currentPage) {

            currentPage.classList.remove(
                "active",
                "leaving"
            );
        }


        const targetPage =
            document.getElementById(sectionName);

        if (targetPage) {

            targetPage.classList.add(
                "active",
                "entering"
            );


            /*
             Esperamos dos frames.

             Esto permite que el navegador registre primero
             el estado inicial transparente/desplazado antes
             de aplicar el estado final de la animación.
            */

            requestAnimationFrame(() => {

                requestAnimationFrame(() => {

                    targetPage.classList.add(
                        "entering-active"
                    );

                });

            });
        }


        currentSection = sectionName;

        updateSectionSelector(sectionName);

    }, CONTENT_CHANGE_DELAY);


    /* ------------------------------------------------------
       4. FIN DE LA TRANSICIÓN

       Eliminamos las clases temporales y permitimos una
       nueva navegación.
       ------------------------------------------------------ */

    window.setTimeout(() => {

        const targetPage =
            document.getElementById(sectionName);

        if (targetPage) {

            targetPage.classList.remove(
                "entering",
                "entering-active"
            );
        }

        isCubeRotating = false;

    }, CUBE_DURATION);
}


/* ==========================================================
   08. EVENTOS DE NAVEGACIÓN

   Tanto las caras interactivas del cubo como el selector
   utilizan data-section para indicar su destino.
   ========================================================== */

navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const targetSection =
            button.dataset.section;

        navigateTo(targetSection);
    });

});