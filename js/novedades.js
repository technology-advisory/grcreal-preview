// Función para obtener la clase CSS según el tipo de enlace
function getLinkClass(tipo) {
  switch(tipo) {
    case 'primary': return 'btn-primary';
    case 'outline': return 'btn-outline';
    case 'arrow': return 'link-arrow';
    case 'icon': return 'btn-icon';
    default: return 'link-arrow';
  }
}

// Función para generar el HTML de una novedad
function renderNovedad(item, index, isLast) {
  // Si no hay enlace, solo mostramos el contenido sin botón
  if (!item.enlace) {
    return `
      <div class="block">
        <div class="block-label">${item.fecha}</div>
        <div class="block-title">${item.titulo}</div>
        <div class="block-text">${item.descripcion}</div>
      </div>
      ${!isLast ? '<div class="divider"></div>' : ''}
    `;
  }

  const linkClass = getLinkClass(item.tipo_enlace);
  
  // Para el tipo icon, añadimos el SVG
  let linkContent = item.enlace_texto;
  if (item.tipo_enlace === 'icon') {
    linkContent = `
      ${item.enlace_texto}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    `;
  }

  let enlaceHtml = '';
  if (linkClass === 'link-arrow') {
    enlaceHtml = `<a href="${item.enlace}" class="${linkClass}">${linkContent}</a>`;
  } else {
    enlaceHtml = `<div class="block-cta"><a href="${item.enlace}" class="${linkClass}">${linkContent}</a></div>`;
  }

  return `
    <div class="block">
      <div class="block-label">${item.fecha}</div>
      <div class="block-title">${item.titulo}</div>
      <div class="block-text">${item.descripcion}</div>
      ${enlaceHtml}
    </div>
    ${!isLast ? '<div class="divider"></div>' : ''}
  `;
}

// Cargar novedades desde JSON
function cargarNovedades() {
  fetch('/data/notices.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('novedades-container');
      if (container && data.items && data.items.length > 0) {
        const html = data.items.map((item, index) => 
          renderNovedad(item, index, index === data.items.length - 1)
        ).join('');
        container.innerHTML = html;
      } else {
        container.innerHTML = '<div class="block"><div class="block-text">No hay novedades disponibles en este momento.</div></div>';
      }
    })
    .catch(error => {
      console.error('Error cargando novedades:', error);
      const container = document.getElementById('novedades-container');
      if (container) {
        container.innerHTML = '<div class="block"><div class="block-text">Error al cargar novedades. Inténtalo de nuevo más tarde.</div></div>';
      }
    });
}

// Cargar el footer
function cargarFooter() {
  fetch('/includes/footer-no-share.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('footer-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error cargando el footer:', error));
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  cargarNovedades();
  cargarFooter();
});