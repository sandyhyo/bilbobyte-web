/* ==========================================================
   01. CONFIGURACIÓN DE LA NAVEGACIÓN 3D

   CUBE_DURATION:
   Duración completa del giro.

   CONTENT_CHANGE_DELAY:
   Momento durante el giro en el que cambia el contenido.

   IMPORTANTE:
   El cubo mantiene una inclinación visual constante de
   -30º en X y -28º en Y.

   A esa inclinación se añaden giros exactos de 90º para
   mostrar HOME, SOLUCIONES o CONTACTO.
   ========================================================== */

const CUBE_DURATION = 800;
const CONTENT_CHANGE_DELAY = 420;

const BASE_X = -30;
const BASE_Y = -28;


/* ==========================================================
   02. ELEMENTOS PRINCIPALES
   ========================================================== */

const navigationCube =
    document.getElementById("navigationCube");

const navigationButtons =
    document.querySelectorAll("[data-section]");

const sectionSelectorButtons =
    document.querySelectorAll(".section-selector__button");

const pageSections =
    document.querySelectorAll(".page-section");


/* ==========================================================
   03. ESTADO DE LA NAVEGACIÓN

   currentSection:
   Sección que se encuentra actualmente abierta.

   isCubeRotating:
   Impide lanzar otra navegación mientras el cubo está
   realizando un giro.
   ========================================================== */

let currentSection = "home";
let isCubeRotating = false;


/* ==========================================================
   04. ROTACIÓN LÓGICA DEL CUBO

   HOME es nuestra posición 0 / 0.

   SOLUCIONES está físicamente a la derecha:
   necesita un giro de -90º sobre Y.

   CONTACTO está físicamente arriba:
   necesita un giro de -90º sobre X.

   Estos valores representan únicamente el giro del objeto.
   La inclinación visual BASE_X / BASE_Y se añade después.
   ========================================================== */

const cubeRotations = {

    home: {
        x: 0,
        y: 0
    },

    solutions: {
        x: 0,
        y: -90
    },

    contact: {
        x: -90,
        y: 0
    }

};


/* ==========================================================
   05. ORIENTAR EL CUBO

   Calculamos primero la orientación final.

   El navegador recibe UN único cambio de transform y CSS
   interpola desde la orientación actual hasta la siguiente.

   No eliminamos transition ni sustituimos clases durante
   este proceso.
   ========================================================== */

function rotateCube(sectionName) {

    const rotation = cubeRotations[sectionName];

    if (!rotation) {
        return;
    }

    const finalX =
        BASE_X + rotation.x;

    const finalY =
        BASE_Y + rotation.y;

    navigationCube.style.transform =
        `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
}


/* ==========================================================
   06. ACTUALIZAR SELECTOR PRINCIPAL

   Marca HOME, SOLUCIONES o CONTACTO como sección activa.
   ========================================================== */

function updateSectionSelector(sectionName) {

    sectionSelectorButtons.forEach((button) => {

        const isActive =
            button.dataset.section === sectionName;

        button.classList.toggle(
            "active",
            isActive
        );

    });

}


/* ==========================================================
   07. CAMBIAR CONTENIDO

   El cambio de contenido se realiza mientras el cubo está
   en movimiento para que navegación y página formen una
   única transición.
   ========================================================== */

function changeContent(sectionName) {

    const currentPage =
        document.getElementById(currentSection);

    const targetPage =
        document.getElementById(sectionName);


    /* ------------------------------------------------------
       Retirar sección anterior
       ------------------------------------------------------ */

    if (currentPage) {

        currentPage.classList.remove(
            "active",
            "leaving",
            "entering",
            "entering-active"
        );

    }


    /* ------------------------------------------------------
       Mostrar nueva sección en su estado inicial
       ------------------------------------------------------ */

    if (targetPage) {

        targetPage.classList.add(
            "active",
            "entering"
        );


        /*
         Dos frames permiten que el navegador registre
         primero el estado inicial antes de comenzar
         la transición de entrada.
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
}


/* ==========================================================
   08. NAVEGAR ENTRE ÁREAS

   SECUENCIA:

   0 ms
   ├── contenido actual comienza a desaparecer
   └── cubo comienza su giro

   420 ms
   └── aparece el nuevo contenido

   800 ms
   └── termina el giro y se desbloquea la navegación
   ========================================================== */

function navigateTo(sectionName) {

    /* ------------------------------------------------------
       Validaciones
       ------------------------------------------------------ */

    if (
        isCubeRotating ||
        sectionName === currentSection ||
        !cubeRotations[sectionName]
    ) {
        return;
    }


    isCubeRotating = true;


    /* ------------------------------------------------------
       1. Comenzar salida del contenido actual
       ------------------------------------------------------ */

    const currentPage =
        document.getElementById(currentSection);

    if (currentPage) {
        currentPage.classList.add("leaving");
    }


    /* ------------------------------------------------------
       2. Forzar al navegador a confirmar el estado actual

       Esta lectura provoca que el navegador cierre el frame
       anterior antes de recibir la nueva transformación.

       Así evitamos que origen y destino se procesen dentro
       del mismo ciclo de renderizado y aparezca un salto.
       ------------------------------------------------------ */

    navigationCube.getBoundingClientRect();


    /* ------------------------------------------------------
       3. Iniciar giro
       ------------------------------------------------------ */

    requestAnimationFrame(() => {

        rotateCube(sectionName);

    });


    /* ------------------------------------------------------
       4. Cambiar contenido durante el movimiento
       ------------------------------------------------------ */

    window.setTimeout(() => {

        changeContent(sectionName);

    }, CONTENT_CHANGE_DELAY);


    /* ------------------------------------------------------
       5. Finalizar navegación
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
   09. EVENTOS

   Las caras del cubo y el selector inferior comparten
   data-section, por lo que ambos utilizan la misma función
   de navegación.
   ========================================================== */

navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const targetSection =
            button.dataset.section;

        navigateTo(targetSection);

    });

});


/* ==========================================================
   10. ESTADO INICIAL

   Establecemos explícitamente la posición HOME.

   Desactivamos momentáneamente la transición para evitar
   que el cubo haga una animación al cargar la página.
   ========================================================== */

navigationCube.style.transition = "none";

navigationCube.style.transform =
    `rotateX(${BASE_X}deg) rotateY(${BASE_Y}deg)`;


/*
Esperamos dos frames antes de devolver el control de la
transición a cube.css.
*/

requestAnimationFrame(() => {

    requestAnimationFrame(() => {

        navigationCube.style.transition = "";

    });

});