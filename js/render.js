/**
 * ============================================================================
 * BILBOBYTE — RENDERIZADOR DINÁMICO DE CONTENIDO (js/render.js)
 * Carga los archivos JSON de /content o usa respaldo local (compatible con file://)
 * ============================================================================
 */

(function () {
  'use strict';

  // Datos base de respaldo por si el navegador bloquea fetch() en protocolo local file://
  const FALLBACK_DATA = {
    config: {
      nombre: "BilboByte",
      eslogan: "Infraestructura invisible para que tu negocio avance.",
      whatsapp: "+34 657 69 01 06",
      email: "contacto@bilbobyte.es",
      ubicacion: "Bilbao, Bizkaia",
      horario: "Lunes a Viernes 09:00 - 19:00",
      cobertura: "Servicio presencial en Bilbao y Bizkaia. Envíos y soporte remoto a toda la península."
    },
    sobre_mi: {
      titulo: "Presentación",
      kicker: "¿Cómo nace BilboByte?",
      subtitulo: "Nuestra visión y objetivos",
      parrafos: [
        "BilboByte nace con la voluntad de dar visibilidad al alcance que ofrecen las tecnologías de código abierto frente a los productos tradicionales del sector tecnológico.",
        "Tras años trabajando con algunas de ellas, hemos podido ver cómo han evolucionado y madurado, hasta convertirse en herramientas capaces de ofrecer soluciones sólidas y profesionales. Por desgracia, muchas veces pasan desapercibidas fuera de los sectores especializados.",
        "Por eso queremos brindar su acceso a pequeñas y medianas empresas que buscan mejorar su infraestructura, sin asumir necesariamente los elevados costes normalmente asociados a ese tipo de soluciones.",
        "Partiendo del estudio de las necesidades derivadas de cada proyecto, nos proponemos buscar una solución ajustada, seleccionando las herramientas adecuadas y proporcionando tanto el equipamiento necesario para su implantación, como el soporte para mantenerla. Apostando por un modelo que permita al cliente adquirir progresivamente su propia infraestructura y ganar autonomía sobre ella."
      ],
      lema: "Infraestructura invisible para que tu negocio avance.",
      metricas: [
        { cifra: "100%", etiqueta: "Autonomía e Infraestructura Propia" },
        { cifra: "5", etiqueta: "Soluciones ERB Modulares" },
        { cifra: "+500", etiqueta: "Piezas 3D Fabricadas" },
        { cifra: "<24h", etiqueta: "Tiempo de Respuesta" }
      ]
    },
    servicios: {
      titulo: "Soluciones ERB",
      kicker: "Productos y Servicios Especializados",
      introduccion: "Después de analizar las áreas que habitualmente requieren más atención en el desarrollo tecnológico de una empresa, hemos preparado una serie de propuestas orientadas a cubrir sus principales necesidades y facilitar su crecimiento. Todas pensadas para acompañar su evolución, proteger su información, materializar sus ideas y perdurar a largo plazo.",
      items: [
        {
          id: "erb-connect",
          nombre: "ERB Connect",
          lema: "Todo comienza por estar conectados",
          categoria: "Conectividad & Redes",
          tipo: "tech",
          descripcion: "La clave para que la información fluya por la empresa, parte de una buena conectividad. Nos encargamos de crear una red estable, organizada y adaptada a tu forma de trabajo.",
          incluye: [
            "Conexión y separación de puestos, dispositivos o servicios según necesidades",
            "Acceso remoto seguro y controlado a los recursos desde fuera de la empresa",
            "Solución sencilla y centralizada, lista para escalar junto a tu negocio",
            "Instalación, configuración y soporte para mantener la red siempre operativa"
          ],
          whatsapp_msg: "Hola BilboByte, me interesa información sobre la solución ERB Connect."
        },
        {
          id: "erb-core",
          nombre: "ERB CORE",
          lema: "Desata el potencial a tu alcance",
          sublema: "“Divide et impera”",
          categoria: "Infraestructura & Servidores",
          tipo: "tech",
          descripcion: "No siempre es necesario disponer de un equipo diferente para cada tarea. Una sola máquina puede hacer mucho más de lo que parece. ERB CORE permite aprovechar al máximo sus recursos, dividiéndolos entre diferentes entornos independientes.",
          incluye: [
            "Múltiples entornos y aplicaciones alojadas simultáneamente en una sola máquina",
            "Aprovechamiento eficiente evitando dedicar hardware físico innecesario",
            "Redistribución flexible de capacidad según las necesidades de cada momento",
            "Instalación, monitorización y sistemas de copia y recuperación ante incidencias"
          ],
          whatsapp_msg: "Hola BilboByte, quisiera consultar sobre la solución ERB CORE para mi empresa."
        },
        {
          id: "erb-vault",
          nombre: "ERB Vault",
          lema: "Porque guardar no es lo mismo que proteger",
          categoria: "Almacenamiento & Seguridad",
          tipo: "tech",
          descripcion: "La información relevante de una empresa puede terminar repartida entre diferentes ordenadores y ubicaciones. ERB VAULT permite centralizar la gestión de archivos y documentos en un espacio común, organizado y accesible.",
          incluye: [
            "Carpetas compartidas por usuarios, departamentos o proyectos con permisos específicos",
            "Medidas de redundancia destinadas a mantener datos disponibles ante imprevistos",
            "Sistemas de copia y recuperación independientes ante averías o borrados",
            "Supervisión y soporte continuo para mantener protegida tu información"
          ],
          whatsapp_msg: "Hola BilboByte, me gustaría implementar ERB Vault para centralizar nuestros archivos."
        },
        {
          id: "erb-suite",
          nombre: "ERB Suite",
          lema: "Tu trabajo, simplificado y siempre a mano",
          categoria: "Gestión & Productividad",
          tipo: "tech",
          descripcion: "Gestionar un negocio muchas veces implica repartir la gestión entre diferentes aplicaciones y dispositivos. ERB SUITE sirve como un puente común hacia las herramientas y la información que necesitas.",
          incluye: [
            "Gestión centralizada de contactos, citas, calendarios y papeleo de clientes",
            "Envío ágil de documentos a través de canales de mensajería directa",
            "Historial completo de intervenciones sin búsquedas dispersas",
            "Acceso unificado desde PC o móvil con datos 100% en tu propio equipo"
          ],
          whatsapp_msg: "Hola BilboByte, quisiera información sobre la plataforma de gestión ERB Suite."
        },
        {
          id: "erb-print",
          nombre: "ERB Print",
          lema: "Desde las ideas, a tus manos",
          categoria: "Impresión 3D & Prototipado",
          tipo: "maker",
          descripcion: "La impresión 3D permite transformar un diseño digital en un objeto físico, ofreciendo una forma flexible de crear prototipos o pequeñas series de piezas conservando su esencia en el resultado final.",
          incluye: [
            "Adaptación y fabricación desde diseños 3D listos o vectorización desde bocetos",
            "Elementos personalizados de imagen y promoción (llaveros, identificadores de marca)",
            "Piezas con funcionalidades añadidas, como tecnología y chips NFC",
            "Verificación de tolerancias y ajustes antes de producir nuevas unidades"
          ],
          whatsapp_msg: "Hola BilboByte, quisiera cotizar un proyecto de impresión 3D con ERB Print."
        }
      ]
    },
    proyectos: [
      {
        id: "p1",
        titulo: "Identificadores y Llaveros Corporativos con Chip NFC",
        categoria: "maker",
        solucion: "ERB Print",
        problema: "Empresa necesitaba identificadores de marca resistentes que compartieran su catálogo digital al contacto con smartphones.",
        solucion_tecnica: "Diseño y fabricación 3D en PETG de dos tonos con cápsula interna estanca para chip NFC reescribible.",
        resultado: "120 piezas entregadas en 4 días, sin costes de moldes y con lectura instantánea.",
        tags: ["ERB Print", "NFC Integrado", "PETG Técnico"]
      },
      {
        id: "p2",
        titulo: "Centralización de Archivos y Copias de Seguridad",
        categoria: "tech",
        solucion: "ERB Vault & Connect",
        problema: "Estudio técnico con archivos dispersos en 6 portátiles y riesgo crítico de pérdida de proyectos.",
        solucion_tecnica: "Implantación de ERB Vault en red local segura ERB Connect, con permisos por rol y respaldos redundantes.",
        resultado: "Información centralizada, acceso rápido sin cortes y seguridad total ante fallos de disco.",
        tags: ["ERB Vault", "ERB Connect", "Backup Seguro"]
      },
      {
        id: "p3",
        titulo: "Consolidación de Servicios en Hardware Único",
        categoria: "tech",
        solucion: "ERB CORE",
        problema: "Pyme necesitaba entorno de gestión, base de datos y servidor de pruebas sin comprar 3 servidores físicos.",
        solucion_tecnica: "Despliegue de ERB CORE en una sola máquina optimizada, aislando entornos con monitorización continua.",
        resultado: "Ahorro de más de 2.000€ en hardware y reducción del 60% en consumo eléctrico.",
        tags: ["ERB CORE", "Divide et Impera", "Virtualización"]
      },
      {
        id: "p4",
        titulo: "Recreación de Soporte Roto de Maquinaria",
        categoria: "maker",
        solucion: "ERB Print",
        problema: "Rotura de soporte plástico de una máquina de embalaje con plazo de recambio oficial de 6 semanas.",
        solucion_tecnica: "Ingeniería inversa, modelado CAD e impresión técnica en filamento ASA con insertos de latón.",
        resultado: "Línea de producción operativa en menos de 24 horas.",
        tags: ["ERB Print", "Filamento ASA", "Ingeniería Inversa"]
      }
    ],
    testimonios: [
      {
        nombre: "Miren Garai",
        rol: "Gerente en Taller Mecánico · Bilbao",
        avatar: "MG",
        texto: "Nos diseñaron una serie de piezas y soportes especiales con ERB Print que necesitábamos urgentemente. La rapidez y la precisión en las medidas fueron extraordinarias.",
        servicio: "ERB Print"
      },
      {
        nombre: "Aitor Larrañaga",
        rol: "Director Técnico · Bizkaia",
        avatar: "AL",
        texto: "ERB CORE nos permitió unificar varias herramientas en una sola máquina sin tener que gastar en servidores desmesurados. El soporte técnico y la cercanía de BilboByte marcan una gran diferencia.",
        servicio: "ERB CORE"
      },
      {
        nombre: "Sonia Ugarte",
        rol: "Responsable de Administración",
        avatar: "SU",
        texto: "Gracias a ERB Vault tenemos todos los archivos de clientes organizados y protegidos con copias automáticas. Saber que nuestros datos están en nuestras propias manos da muchísima tranquilidad.",
        servicio: "ERB Vault"
      },
      {
        nombre: "Iñaki Echevarria",
        rol: "Profesional Autónomo",
        avatar: "IE",
        texto: "Con ERB Suite gestiono mis presupuestos, contactos y calendario desde el móvil y el ordenador sin pagar cuotas mensuales a terceros. Una solución limpia, intuitiva y profesional.",
        servicio: "ERB Suite"
      }
    ],
    proceso: [
      {
        numero: 1,
        titulo: "Estudio de Necesidades",
        descripcion: "Analizamos en profundidad tu caso concreto: el archivo 3D o pieza a reproducir, o las áreas de infraestructura y gestión que tu negocio necesita mejorar."
      },
      {
        numero: 2,
        titulo: "Propuesta Ajustada",
        descripcion: "Seleccionamos las herramientas y materiales adecuados. Te presentamos un presupuesto transparente sin cuotas ocultas y con plazos de entrega definidos."
      },
      {
        numero: 3,
        titulo: "Implantación o Fabricación",
        descripcion: "Instalamos y configuramos el equipamiento en tus instalaciones o fabricamos tus piezas 3D con tolerancias mecánicas verificadas."
      },
      {
        numero: 4,
        titulo: "Acompañamiento & Autonomía",
        descripcion: "Te entregamos el control total de tu solución, con la formación y el soporte técnico necesario para garantizar su funcionamiento continuo."
      }
    ],
    faq: [
      {
        pregunta: "¿Qué ventajas tienen las soluciones de código abierto frente a las comerciales tradicionales?",
        respuesta: "Permiten acceder a herramientas sólidas, seguras y profesionales sin atarse a licencias recurrentes desorbitadas. Lo más importante: adquieres tu propia infraestructura y mantienes el control absoluto y la privacidad de tus datos."
      },
      {
        pregunta: "¿Qué información necesito enviar para solicitar una pieza con ERB Print?",
        respuesta: "Si ya dispones de un archivo digital (STL, STEP, 3MF), podemos estudiarlo de inmediato. Si no lo tienes, podemos partir de una pieza física deteriorada, planos, un boceto con cotas o simplemente tu idea para vectorizarla y modelarla."
      },
      {
        pregunta: "¿Cómo funciona el soporte técnico tras la instalación de una solución ERB?",
        respuesta: "Proporcionamos tanto el equipamiento y su puesta en marcha como el servicio de asistencia, monitorización y mantenimiento para que la solución permanezca siempre operativa y crezca con tu negocio."
      },
      {
        pregunta: "¿ERB Vault sustituye a una copia de seguridad externa?",
        respuesta: "No necesariamente. Almacenar información de forma centralizada y segura en un espacio común no sustituye a una copia independiente. Por eso, ERB Vault incorpora sistemas de respaldo y recuperación redundantes para protegerte frente a averías o borrados accidentales."
      },
      {
        pregunta: "¿Hacen envíos de piezas y atienden presencialmente?",
        respuesta: "Sí. Realizamos visitas técnicas y recogida/entrega de equipamiento presencial en Bilbao y Bizkaia. Además, realizamos envíos seguros de piezas 3D y asistencia remota a toda la península."
      }
    ]
  };

  /**
   * Helper para cargar JSON con fallback
   */
  async function loadJson(fileKey, relativePath) {
    try {
      const response = await fetch(relativePath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(`[BilboByte] Carga de ${relativePath} usó datos de respaldo locales:`, err.message);
      return FALLBACK_DATA[fileKey];
    }
  }

  /**
   * Renderiza la sección Presentación (Sobre Nosotros)
   */
  function renderPresentacion(data) {
    const container = document.getElementById('presentacion-content');
    if (!container || !data) return;

    const paragraphsHtml = data.parrafos.map(p => `<p class="presentation-p">${p}</p>`).join('');
    const metricsHtml = (data.metricas || []).map(m => `
      <div class="metric-card">
        <span class="metric-number">${m.cifra}</span>
        <span class="metric-label">${m.etiqueta}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="about-grid">
        <div class="about-text-content">
          <span class="section-kicker section-kicker--neutral">${data.kicker || 'Conócenos'}</span>
          <h2 class="section-title">${data.titulo}</h2>
          <p class="section-lead"><strong>${data.lema || ''}</strong></p>
          <div class="presentation-body">
            ${paragraphsHtml}
          </div>
          <div class="about-actions" style="margin-top: 1.5rem;">
            <a href="#contacto" class="btn btn-outline">
              <span>¿Hablamos de tu caso?</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
        <div class="metrics-grid">
          ${metricsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza los Productos y Soluciones ERB
   */
  function renderServicios(data, config) {
    const container = document.getElementById('servicios-container');
    if (!container || !data) return;

    const items = data.items || [];
    const phone = (config && config.whatsapp) ? config.whatsapp : '34600000000';

    const cardsHtml = items.map(item => {
      const isMaker = item.tipo === 'maker';
      const badgeClass = isMaker ? 'badge-maker' : 'badge-tech';
      const cardModifier = isMaker ? 'service-card--maker' : 'service-card--tech';
      const btnClass = isMaker ? 'btn-maker' : 'btn-tech';

      const includesHtml = (item.incluye || []).map(inc => `
        <li class="feature-item">
          <svg class="feature-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span>${inc}</span>
        </li>
      `).join('');

      const waMsg = encodeURIComponent(item.whatsapp_msg || `Hola BilboByte, quisiera información sobre ${item.nombre}.`);

      return `
        <article class="service-card ${cardModifier}" id="${item.id}">
          <div class="service-card-top">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <span class="badge ${badgeClass}">${item.categoria}</span>
              ${item.sublema ? `<span class="badge badge-neutral" style="font-style: italic;">${item.sublema}</span>` : ''}
            </div>
            
            <h3 class="service-title" style="margin-top: 0.75rem;">${item.nombre}</h3>
            <p class="service-lema" style="font-weight: 600; color: var(--color-text); font-size: 0.95rem; margin-bottom: 0.5rem;">
              ${item.lema}
            </p>
            <p class="service-desc">${item.descripcion}</p>
            
            <ul class="service-features">
              ${includesHtml}
            </ul>
          </div>
          
          <div class="service-card-bottom">
            <a href="https://wa.me/${phone}?text=${waMsg}" 
               class="btn ${btnClass} btn-sm" 
               target="_blank" 
               rel="noopener noreferrer"
               aria-label="Consultar sobre ${item.nombre} por WhatsApp">
              <span>Consultar ${item.nombre}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="section-header">
        <span class="section-kicker section-kicker--neutral">${data.kicker || 'Productos BilboByte'}</span>
        <h2 class="section-title">${data.titulo || 'Soluciones ERB'}</h2>
        <p class="section-description">${data.introduccion || ''}</p>
      </div>
      <div class="services-grid">
        ${cardsHtml}
      </div>
    `;
  }

  /**
   * Renderiza el Portafolio
   */
  function renderProyectos(items) {
    const container = document.getElementById('portfolio-grid');
    if (!container || !items) return;

    container.innerHTML = items.map(p => {
      const isMaker = p.categoria === 'maker';
      const badgeClass = isMaker ? 'badge-maker' : 'badge-tech';
      const catLabel = isMaker ? 'Impresión 3D' : 'Informática & TI';

      const tagsHtml = (p.tags || []).map(t => `<span class="project-tag">${t}</span>`).join('');

      return `
        <article class="project-card" data-category="${p.categoria}">
          <div class="project-media">
            <span class="badge ${badgeClass} project-category-badge">${catLabel}</span>
            <div class="project-media-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                ${isMaker ? '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>' : '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'}
              </svg>
              <span style="font-weight: 600; font-size: 0.9rem;">${p.solucion || 'BilboByte'}</span>
            </div>
          </div>
          <div class="project-content">
            <h3 class="project-title">${p.titulo}</h3>
            
            <div class="psr-block">
              <div class="psr-row">
                <span class="psr-label psr-label--problem">● Problema:</span>
                <span class="psr-text">${p.problema}</span>
              </div>
              <div class="psr-row">
                <span class="psr-label psr-label--solution">● Solución:</span>
                <span class="psr-text">${p.solucion_tecnica}</span>
              </div>
              <div class="psr-row">
                <span class="psr-label psr-label--result">● Resultado:</span>
                <span class="psr-text">${p.resultado}</span>
              </div>
            </div>

            <div class="project-tags">
              ${tagsHtml}
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * Renderiza Testimonios
   */
  function renderTestimonios(items) {
    const container = document.getElementById('testimonials-grid');
    if (!container || !items) return;

    container.innerHTML = items.map(t => `
      <article class="testimonial-card">
        <div>
          <div class="testimonial-stars" aria-label="${t.estrellas || 5} de 5 estrellas">
            ${'★'.repeat(t.estrellas || 5)}
          </div>
          <p class="testimonial-quote">"${t.texto}"</p>
        </div>
        <div>
          <div class="testimonial-author">
            <div class="author-avatar" aria-hidden="true">${t.avatar || 'BB'}</div>
            <div class="author-info">
              <span class="author-name">${t.nombre}</span>
              <span class="author-role">${t.rol}</span>
            </div>
          </div>
          ${t.servicio ? `<span class="badge badge-neutral testimonial-service-tag">${t.servicio}</span>` : ''}
        </div>
      </article>
    `).join('');
  }

  /**
   * Renderiza el Proceso (Cómo Trabajamos)
   */
  function renderProceso(items) {
    const container = document.getElementById('process-grid');
    if (!container || !items) return;

    container.innerHTML = items.map(step => `
      <article class="process-step-card">
        <div class="step-number-badge">${step.numero}</div>
        <h3 class="step-title">${step.titulo}</h3>
        <p class="step-desc">${step.descripcion}</p>
      </article>
    `).join('');
  }

  /**
   * Renderiza el Acordeón FAQ
   */
  function renderFaq(items) {
    const container = document.getElementById('faq-accordion');
    if (!container || !items) return;

    container.innerHTML = items.map((f, i) => `
      <details class="faq-item" name="faq" ${i === 0 ? 'open' : ''}>
        <summary class="faq-summary">
          <span>${f.pregunta}</span>
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div class="faq-content">
          ${f.respuesta}
        </div>
      </details>
    `).join('');
  }

  /**
   * Inicialización global de renderizado
   */
  async function init() {
    const [config, sobreMi, servicios, proyectos, testimonios, proceso, faq] = await Promise.all([
      loadJson('config', 'content/config.json'),
      loadJson('sobre_mi', 'content/sobre-mi.json'),
      loadJson('servicios', 'content/servicios.json'),
      loadJson('proyectos', 'content/proyectos.json'),
      loadJson('testimonios', 'content/testimonios.json'),
      loadJson('proceso', 'content/proceso.json'),
      loadJson('faq', 'content/faq.json')
    ]);

    renderPresentacion(sobreMi);
    renderServicios(servicios, config);
    renderProyectos(proyectos);
    renderTestimonios(testimonios);
    renderProceso(proceso);
    renderFaq(faq);

    // Disparar evento para indicar que el renderizado ha terminado
    document.dispatchEvent(new CustomEvent('bilbobyte:rendered'));
  }

  // Ejecutar al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
