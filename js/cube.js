/* ==========================================================
   js/cube.js
   Motor interactivo 3D para el cubo de navegación de BilboByte.
   Basado en la arquitectura física de dist/script.js:
   - Rotación libre 3D continua con inercia, par motor y fricción
   - Cálculo dinámico de la cara orientada al frente (lados 1 a 6)
   - Navegación reactiva al arrastrar hacia cualquier cara
   - Soporte total para clics directos en cualquier cara visible o selector
   - Sincronización con destellos del circuito de fondo
   - Encabezado móvil sin saltos ni pestañeos de layout
   ========================================================== */

/* ===== 01. SISTEMA DE EVENTOS (Events) ===== */

function Events() {
    this.events = {};
}

Events.prototype.on = function(name, fn) {
    if (!this.events[name]) {
        this.events[name] = [fn];
    } else if (this.events[name].indexOf(fn) === -1) {
        this.events[name].push(fn);
    }
    return this;
};

Events.prototype.emit = function(name, args) {
    const list = this.events[name];
    if (list) {
        let i = list.length;
        while (i--) {
            if (list[i]) list[i].call(this, args);
        }
    }
    return this;
};

const events = {
    add: function(obj) { obj.events = {}; },
    implement: function(fn) { fn.prototype = Object.create(Events.prototype); }
};


/* ===== 02. MAPEO DE CARAS A SECCIONES BILBOBYTE ===== */

const SIDE_TO_SECTION = {
    1: "contact",   // Superior: CONTACTO
    2: "home",      // Frontal: HOME
    3: "solutions", // Derecha: SOLUCIONES
    4: "home",      // Trasera: HOME
    5: "solutions", // Izquierda: SOLUCIONES
    6: "contact"    // Inferior: CONTACTO
};

// Ángulos de orientación exacta por cara
const SIDE_ANGLES = {
    1: { x: 0,   y: 270 }, // CONTACTO (arriba)
    2: { x: 0,   y: 0 },   // HOME (frente)
    3: { x: 270, y: 0 },   // SOLUCIONES (derecha)
    4: { x: 180, y: 0 },   // HOME (atrás)
    5: { x: 90,  y: 0 },   // SOLUCIONES (izquierda)
    6: { x: 0,   y: 90 }   // CONTACTO (abajo)
};


/* ===== 03. MOTOR 3D Y FÍSICA (Viewport) ===== */

function Viewport(data) {
    events.add(this);

    const self = this;

    this.element = data.element;
    this.viewportElement = data.viewportElement;
    this.sensivity = data.sensivity || 0.1;
    this.sensivityFade = data.sensivityFade || 0.93;
    this.touchSensivity = data.touchSensivity || 1.5;
    this.speed = data.speed || 2;

    this.lastX = 0;
    this.lastY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.distanceX = 0;
    this.distanceY = 0;

    // Posición inicial: cara HOME frontal (0, 0)
    this.positionX = 0;
    this.positionY = 0;
    this.torqueX = 0;
    this.torqueY = 0;

    this.down = false;
    this.isDrag = false;
    this.upsideDown = false;

    this.previousPositionX = 0;
    this.previousPositionY = 0;

    this.currentSide = 2; // Lado 2 = HOME
    this.calculatedSide = 2;

    this.isTargeting = false;
    this.targetX = 0;
    this.targetY = 0;

    this.startClientX = 0;
    this.startClientY = 0;

    // Iniciar arrastre sólo al interactuar sobre el cubo
    this.viewportElement.addEventListener("mousedown", function(e) {
        if (e.button !== 0) return;
        self.down = true;
        self.isDrag = false;
        self.isTargeting = false;
        self.startClientX = e.clientX;
        self.startClientY = e.clientY;
        self.mouseX = e.pageX;
        self.mouseY = e.pageY;
        self.lastX = self.mouseX;
        self.lastY = self.mouseY;
    });

    window.addEventListener("mousemove", function(e) {
        self.mouseX = e.pageX;
        self.mouseY = e.pageY;
        if (self.down) {
            const dist = Math.hypot(e.clientX - self.startClientX, e.clientY - self.startClientY);
            if (dist > 5) {
                self.isDrag = true;
                self.viewportElement.classList.add("is-dragging");
            }
        }
    });

    window.addEventListener("mouseup", function() {
        self.down = false;
        self.viewportElement.classList.remove("is-dragging");
    });

    // Soporte táctil en dispositivos móviles
    this.viewportElement.addEventListener("touchstart", function(e) {
        self.down = true;
        self.isDrag = false;
        self.isTargeting = false;
        const touch = e.touches ? e.touches[0] : e;
        self.startClientX = touch.clientX;
        self.startClientY = touch.clientY;
        self.mouseX = touch.pageX / self.touchSensivity;
        self.mouseY = touch.pageY / self.touchSensivity;
        self.lastX = self.mouseX;
        self.lastY = self.mouseY;
    }, { passive: true });

    window.addEventListener("touchmove", function(e) {
        if (self.down) {
            const touch = e.touches ? e.touches[0] : e;
            self.mouseX = touch.pageX / self.touchSensivity;
            self.mouseY = touch.pageY / self.touchSensivity;
            const dist = Math.hypot(touch.clientX - self.startClientX, touch.clientY - self.startClientY);
            if (dist > 5) {
                self.isDrag = true;
                self.viewportElement.classList.add("is-dragging");
                if (e.cancelable) e.preventDefault();
            }
        }
    }, { passive: false });

    window.addEventListener("touchend", function() {
        self.down = false;
        self.viewportElement.classList.remove("is-dragging");
    });

    // Loop de renderizado continuo a máxima tasa de refresco
    this.tick = this.animate.bind(this);
    requestAnimationFrame(this.tick);
}

events.implement(Viewport);

Viewport.prototype.rotateToSide = function(sideNum) {
    const target = SIDE_ANGLES[sideNum];
    if (!target) return;
    this.targetX = target.x;
    this.targetY = target.y;
    this.isTargeting = true;
    this.torqueX = 0;
    this.torqueY = 0;
    this.currentSide = sideNum;
    this.calculatedSide = sideNum;
    this.emit("sideChange", sideNum);
};

Viewport.prototype.animate = function() {
    this.distanceX = (this.mouseX - this.lastX);
    this.distanceY = (this.mouseY - this.lastY);

    this.lastX = this.mouseX;
    this.lastY = this.mouseY;

    if (this.down) {
        this.torqueX = this.torqueX * this.sensivityFade + (this.distanceX * this.speed - this.torqueX) * this.sensivity;
        this.torqueY = this.torqueY * this.sensivityFade + (this.distanceY * this.speed - this.torqueY) * this.sensivity;
    }

    if (this.isTargeting) {
        let diffX = ((this.targetX - this.positionX + 540) % 360) - 180;
        let diffY = ((this.targetY - this.positionY + 540) % 360) - 180;

        if (Math.abs(diffX) < 0.4 && Math.abs(diffY) < 0.4) {
            this.positionX = (this.targetX % 360 + 360) % 360;
            this.positionY = (this.targetY % 360 + 360) % 360;
            this.isTargeting = false;
            this.torqueX = 0;
            this.torqueY = 0;
        } else {
            this.positionX += diffX * 0.16;
            this.positionY += diffY * 0.16;
        }
    } else if (Math.abs(this.torqueX) > 0.05 || Math.abs(this.torqueY) > 0.05 || this.down) {
        if (!this.down) {
            this.torqueX *= this.sensivityFade;
            this.torqueY *= this.sensivityFade;
        }

        this.positionY -= this.torqueY;

        if (this.positionY > 360) {
            this.positionY -= 360;
        } else if (this.positionY < 0) {
            this.positionY += 360;
        }

        if (this.positionY > 90 && this.positionY < 270) {
            this.positionX -= this.torqueX;

            if (!this.upsideDown) {
                this.upsideDown = true;
                this.emit("upsideDown", { upsideDown: this.upsideDown });
            }
        } else {
            this.positionX += this.torqueX;

            if (this.upsideDown) {
                this.upsideDown = false;
                this.emit("upsideDown", { upsideDown: this.upsideDown });
            }
        }

        if (this.positionX > 360) {
            this.positionX -= 360;
        } else if (this.positionX < 0) {
            this.positionX += 360;
        }

        // Matriz de cálculo de lado activo (dist/script.js)
        if (!(this.positionY >= 46 && this.positionY <= 130) && !(this.positionY >= 220 && this.positionY <= 308)) {
            if (this.upsideDown) {
                if (this.positionX >= 42 && this.positionX <= 130) {
                    this.calculatedSide = 3;
                } else if (this.positionX >= 131 && this.positionX <= 223) {
                    this.calculatedSide = 2;
                } else if (this.positionX >= 224 && this.positionX <= 314) {
                    this.calculatedSide = 5;
                } else {
                    this.calculatedSide = 4;
                }
            } else {
                if (this.positionX >= 42 && this.positionX <= 130) {
                    this.calculatedSide = 5;
                } else if (this.positionX >= 131 && this.positionX <= 223) {
                    this.calculatedSide = 4;
                } else if (this.positionX >= 224 && this.positionX <= 314) {
                    this.calculatedSide = 3;
                } else {
                    this.calculatedSide = 2;
                }
            }
        } else {
            if (this.positionY >= 46 && this.positionY <= 130) {
                this.calculatedSide = 6;
            }
            if (this.positionY >= 220 && this.positionY <= 308) {
                this.calculatedSide = 1;
            }
        }

        if (this.calculatedSide !== this.currentSide) {
            this.currentSide = this.calculatedSide;
            this.emit("sideChange", this.currentSide);
        }
    }

    this.element.style.transform = "rotateX(" + this.positionY + "deg) rotateY(" + this.positionX + "deg)";

    if (this.positionY !== this.previousPositionY || this.positionX !== this.previousPositionX) {
        this.previousPositionY = this.positionY;
        this.previousPositionX = this.positionX;
        this.emit("rotate");
    }

    requestAnimationFrame(this.tick);
};


/* ===== 04. CONTROLADOR DEL CUBO (Cube) ===== */

function CubeController(data) {
    const self = this;

    this.element = data.element;
    this.sides = this.element.getElementsByClassName("cube-face");
    this.viewport = data.viewport;

    this.viewport.on("sideChange", function(sideNum) {
        self.onSideChange(sideNum);
    });

    this.viewport.on("upsideDown", function(obj) {
        self.onUpsideDown(obj);
    });
}

CubeController.prototype.onSideChange = function(sideNum) {
    // Resaltar cara activa del cubo
    for (let i = 0; i < this.sides.length; i++) {
        this.sides[i].classList.remove("active");
    }
    if (this.sides[sideNum - 1]) {
        this.sides[sideNum - 1].classList.add("active");
    }

    // Cambiar la sección activa en la página
    const targetSection = SIDE_TO_SECTION[sideNum];
    if (targetSection) {
        switchActiveSection(targetSection);
    }
};

CubeController.prototype.onUpsideDown = function(obj) {
    // Mantener orientación legible
    const deg = obj.upsideDown ? "rotate(180deg)" : "rotate(0deg)";
    for (let i = 1; i <= 4; i++) {
        if (this.sides[i]) {
            // caras laterales se mantienen perfectamente legibles
        }
    }
};


/* ===== 05. NAVEGACIÓN Y SINCRONIZACIÓN DE PÁGINA ===== */

const pageSections = document.querySelectorAll(".page-section");
const sectionSelectorButtons = document.querySelectorAll(".section-selector__button");

let currentActiveSection = "home";

function switchActiveSection(sectionName) {
    if (!sectionName || sectionName === currentActiveSection) return;
    currentActiveSection = sectionName;

    // Cambiar sección visible de inmediato (sin retardos artificiales)
    pageSections.forEach(section => {
        section.classList.toggle("active", section.id === sectionName);
    });

    // Actualizar botones de texto del selector inferior
    sectionSelectorButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.section === sectionName);
    });

    // Actualizar destellos del circuito de fondo
    if (window.setCircuitSection) {
        window.setCircuitSection(sectionName);
    }
    window.dispatchEvent(
        new CustomEvent("sectionchange", { detail: { section: sectionName } })
    );
}

function navigateTo(sectionName) {
    if (sectionName === "home") {
        viewportInstance.rotateToSide(2);
        switchActiveSection("home");
    } else if (sectionName === "solutions") {
        viewportInstance.rotateToSide(3);
        switchActiveSection("solutions");
    } else if (sectionName === "contact") {
        viewportInstance.rotateToSide(1);
        switchActiveSection("contact");
    }
}
window.navigateTo = navigateTo;
window.CONTENT_CHANGE_DELAY = 80;


/* ===== 06. INICIALIZACIÓN DEL CUBO ===== */

const cubeSceneElement = document.querySelector(".cube-scene");
const navigationCubeElement = document.getElementById("navigationCube");

const viewportInstance = new Viewport({
    element: navigationCubeElement,
    viewportElement: cubeSceneElement,
    fps: 16,
    sensivity: 0.1,
    sensivityFade: 0.93,
    speed: 2,
    touchSensivity: 1.5
});

const cubeControllerInstance = new CubeController({
    viewport: viewportInstance,
    element: navigationCubeElement
});


/* ===== 07. CLICS DIRECTOS EN CARAS Y BOTONES SELECTORES ===== */

let justFinishedDrag = false;

// Clics directos en las caras del cubo
const cubeFaceButtons = document.querySelectorAll(".cube-face");
cubeFaceButtons.forEach(button => {
    button.addEventListener("click", function(e) {
        if (viewportInstance.isDrag) {
            e.preventDefault();
            return;
        }

        registerCubeInteraction();

        let sideNum = parseInt(this.dataset.side, 10);
        if (!sideNum) {
            if (this.classList.contains("cube-face--top")) sideNum = 1;
            else if (this.classList.contains("cube-face--front")) sideNum = 2;
            else if (this.classList.contains("cube-face--right")) sideNum = 3;
            else if (this.classList.contains("cube-face--back")) sideNum = 4;
            else if (this.classList.contains("cube-face--left")) sideNum = 5;
            else if (this.classList.contains("cube-face--bottom")) sideNum = 6;
        }

        if (sideNum) {
            viewportInstance.rotateToSide(sideNum);
            const section = this.dataset.section || SIDE_TO_SECTION[sideNum];
            if (section) switchActiveSection(section);
        }
    });
});

// Clics directos en el selector inferior (HOME / SOLUCIONES / CONTACTO)
sectionSelectorButtons.forEach(button => {
    button.addEventListener("click", function() {
        registerCubeInteraction();
        const section = this.dataset.section;
        if (section === "home") {
            viewportInstance.rotateToSide(2);
            switchActiveSection("home");
        } else if (section === "solutions") {
            viewportInstance.rotateToSide(3);
            switchActiveSection("solutions");
        } else if (section === "contact") {
            viewportInstance.rotateToSide(1);
            switchActiveSection("contact");
        }
    });
});


/* ===== 08. INDICADOR DE ROTABILIDAD Y BIENVENIDA FÍSICA ===== */

const cubeHintElement = document.getElementById("cubeHint");
let hasUserInteracted = false;

function registerCubeInteraction() {
    if (!hasUserInteracted) {
        hasUserInteracted = true;
        if (cubeHintElement) {
            cubeHintElement.classList.add("has-interacted");
        }
    }
}

if (cubeSceneElement) {
    cubeSceneElement.addEventListener("mousedown", registerCubeInteraction);
    cubeSceneElement.addEventListener("touchstart", registerCubeInteraction, { passive: true });
}

// Nudge físico inicial: tras 1.2s de carga, realiza un suave bamboleo 3D de bienvenida
window.addEventListener("load", () => {
    setTimeout(() => {
        if (!hasUserInteracted && !viewportInstance.down && !viewportInstance.isDrag && window.scrollY < 60) {
            viewportInstance.torqueX = 1.35;
            viewportInstance.torqueY = -0.45;
            setTimeout(() => {
                if (!hasUserInteracted && !viewportInstance.down) {
                    viewportInstance.rotateToSide(2);
                }
            }, 650);
        }
    }, 1200);
});


/* ===== 09. CABECERA MÓVIL ESTABLE (ZERO-FLICKER SCROLL) ===== */

const siteHeader = document.querySelector(".site-header");
const headerWrapper = document.querySelector(".site-header-wrapper");
let isHeaderScrolled = false;

function updateHeaderWrapperHeight() {
    if (headerWrapper && siteHeader && !isHeaderScrolled) {
        headerWrapper.style.minHeight = siteHeader.offsetHeight + "px";
    }
}

function handleHeaderScroll() {
    if (!siteHeader) return;
    const scrollY = window.scrollY;

    // Histéresis: activa al rebasar 70px, desactiva sólo al subir de 25px
    if (!isHeaderScrolled && scrollY > 70) {
        isHeaderScrolled = true;
        siteHeader.classList.add("is-scrolled");
    } else if (isHeaderScrolled && scrollY < 25) {
        isHeaderScrolled = false;
        siteHeader.classList.remove("is-scrolled");
        updateHeaderWrapperHeight();
    }
}

window.addEventListener("scroll", handleHeaderScroll, { passive: true });
window.addEventListener("resize", updateHeaderWrapperHeight);
updateHeaderWrapperHeight();
handleHeaderScroll();
