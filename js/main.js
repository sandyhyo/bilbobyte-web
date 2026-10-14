/**
 * ============================================================================
 * BILBOBYTE — SCRIPT PRINCIPAL DE INTERACCIÓN (js/main.js)
 * Navegación móvil, filtros de portafolio y utilidades de interfaz
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Actualización automática del año en el pie de página
  function setupCurrentYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // 2. Menú móvil accesible
  function setupMobileMenu() {
    const navToggle = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Cerrar menú al hacer clic en cualquier ancla
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Cerrar al pulsar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        navMenu.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // 3. Filtros del portafolio
  function setupPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Inicialización
  function init() {
    setupCurrentYear();
    setupMobileMenu();
    setupPortfolioFilters();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('bilbobyte:rendered', () => {
    setupPortfolioFilters();
  });

})();
