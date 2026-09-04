/* ==========================================================
   01. ELEMENTOS DE NAVEGACIÓN
   Localizamos los botones y las tres secciones principales.
   ========================================================== */

const navigationButtons = document.querySelectorAll(
    ".main-navigation button"
);

const pageSections = document.querySelectorAll(
    ".page-section"
);


/* ==========================================================
   02. CAMBIO DE SECCIÓN
   Muestra la sección solicitada y oculta las demás.

   Más adelante esta función activará primero el giro 3D
   del cubo y cambiará el contenido al terminar la animación.
   ========================================================== */

function showSection(sectionName) {

    pageSections.forEach((section) => {
        section.classList.remove("active");
    });

    const targetSection = document.getElementById(sectionName);

    if (targetSection) {
        targetSection.classList.add("active");
    }
}


/* ==========================================================
   03. EVENTOS DE NAVEGACIÓN
   data-section indica qué sección debe abrir cada botón.
   ========================================================== */

navigationButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const targetSection = button.dataset.section;

        showSection(targetSection);
    });

});