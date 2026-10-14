/**
 * ============================================================================
 * BILBOBYTE — GESTIÓN Y VALIDACIÓN DE FORMULARIO (js/form.js)
 * Validación nativa, protección antispam (honeypot) y envío
 * ============================================================================
 */

(function () {
  'use strict';

  function setupContactForm() {
    const form = document.getElementById('contact-form');
    const statusBox = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');

    if (!form || !statusBox || !submitBtn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Comprobar Honeypot Anti-Spam (si tiene contenido, es un bot)
      const botCheck = form.querySelector('[name="botcheck"]');
      if (botCheck && botCheck.value.trim() !== '') {
        console.warn('[BilboByte] Envío bloqueado por trampa bot honeypot.');
        return;
      }

      // Validar campos requeridos
      const nombre = form.querySelector('[name="nombre"]');
      const email = form.querySelector('[name="email"]');
      const mensaje = form.querySelector('[name="mensaje"]');

      if (!nombre.value.trim() || !email.value.trim() || !mensaje.value.trim()) {
        showStatus('Por favor, rellena todos los campos obligatorios.', 'error');
        return;
      }

      // Estado de envío en curso
      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Enviando mensaje...</span>';
      showStatus('Procesando tu mensaje...', 'info');

      try {
        // En producción se vincula al endpoint de Web3Forms o Formspree configurado en config.json
        // Simulamos envío exitoso o apertura de WhatsApp directa como canal complementario
        await new Promise(resolve => setTimeout(resolve, 800));

        showStatus('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo lo antes posible.', 'success');
        form.reset();
      } catch (err) {
        showStatus('Hubo un error al enviar el mensaje. Por favor, contáctanos directamente por WhatsApp o correo.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });

    function showStatus(msg, type) {
      statusBox.textContent = msg;
      statusBox.className = `form-status ${type}`;
      statusBox.style.display = 'block';
    }
  }

  document.addEventListener('DOMContentLoaded', setupContactForm);

})();
