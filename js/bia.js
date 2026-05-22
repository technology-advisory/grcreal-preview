// ── ESTADO GLOBAL ──
let config = null;
let grupos = [];
let frameworkSeleccionado = 'iso22301';
let datosFirma = {
  empresa: '',
  responsable: '',
  fecha: '',
  alcance: '',
  ubicaciones: ''
};

// ── CARGA INICIAL ──
document.addEventListener('DOMContentLoaded', async () => {
  await cargarConfiguracion();
  inicializarEventos();
  renderFrameworkSelector();
  document.getElementById('f-fecha').value = new Date().toISOString().split('T')[0];
  renderFooter();
});

async function cargarConfiguracion() {
  try {
    const response = await fetch('data/bia-config.json');
    config = await response.json();
    grupos = JSON.parse(JSON.stringify(config.grupos));
  } catch (error) {
    console.error('Error cargando configuración:', error);
    mostrarError('No se pudo cargar la configuración. Recarga la página.');
  }
}

function mostrarError(msg) {
  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.style.background = '#fee2e2';
  aviso.style.borderLeftColor = '#e63946';
  aviso.innerHTML = `❌ ${msg}`;
  document.querySelector('.body').prepend(aviso);
}

function inicializarEventos() {
  document.getElementById('btnIniciar').addEventListener('click', iniciarBIA);
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('stickyBtn').addEventListener('click', generarInforme);
  document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);
  document.getElementById('btnVolver').addEventListener('click', volverPreguntas);
  document.getElementById('btnNuevo').addEventListener('click', nuevoAnalisis);
}

function renderFooter() {
  const footer = document.getElementById('footerGRCreal');
  footer.innerHTML = `
    <div>© GRCreal · Miguel Ángel Carriazo, vCISO</div>
    <div><a href="/herramientas/index.html">← Volver a herramientas</a></div>
  `;
}

// ── FRAMEWORK SELECTOR ──
function renderFrameworkSelector() {
  const container = document.getElementById('frameworkGrid');
  const frameworks = config.frameworks;
  container.innerHTML = '';
  
  Object.entries(frameworks).forEach(([key, fw]) => {
    const card = document.createElement('div');
    card.className = `fw-card ${key === frameworkSeleccionado ? 'selected' : ''}`;
    card.setAttribute('data-framework', key);
    card.innerHTML = `
      <div class="fw-icon">${fw.icono}</div>
      <div class="fw-name">${fw.nombre_corto}</div>
      <div class="fw-desc">${fw.nombre}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.fw-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      frameworkSeleccionado = key;
      document.getElementById('headerTag').textContent = fw.tag;
    });
    container.appendChild(card);
  });
}

// ── INICIO ──
function iniciarBIA() {
  const empresa = document.getElementById('f-empresa').value.trim();
  const responsable = document.getElementById('f-responsable').value.trim();
  
  if (!empresa || !responsable) {
    alert('Introduce el nombre de la empresa y el responsable del análisis.');
    return;
  }
  
  datosFirma = {
    empresa,
    responsable,
    fecha: document.getElementById('f-fecha').value || new Date().toLocaleDateString('es-ES'),
    alcance: document.getElementById('f-alcance').value || 'Toda la organización',
    ubicaciones: document.getElementById('f-ubicaciones').value || 'No especificado'
  };
  
  mostrarPantalla('preguntas');
  renderTodo();
}

function mostrarPantalla(pantalla) {
  document.getElementById('screenInicio').style.display = pantalla === 'inicio' ? 'block' : 'none';
  document.getElementById('screenPreguntas').style.display = pantalla === 'preguntas' ? 'block' : 'none';
  document.getElementById('screenInforme').style.display = pantalla === 'informe' ? 'block' : 'none';
  document.getElementById('stickyFooter').className = `sticky-footer ${pantalla === 'preguntas' ? 'visible' : ''}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── RENDER PROCESOS ──
function renderTodo() {
  renderGrupos();
  actualizarProgreso();
  actualizarBtnAnadir();
  renderWizardNav();
}

function renderGrupos() {
  let html = '';
  grupos.forEach((g, gi) => {
    html += `
      <div class="grupo-procesos">
        <div class="grupo-header">
          <span class="grupo-icon">${g.icono}</span>
          <span class="grupo-titulo">${g.titulo}</span>
          <span class="grupo-count">${g.procesos.length} procesos</span>
        </div>
        <div id="grupo-items-${g.id}">
    `;
    g.procesos.forEach((p, pi) => {
      html += renderProceso(p, gi, pi);
    });
    html += `</div></div>`;
  });
  document.getElementById('bloqueContainer').innerHTML = html;
  
  document.getElementById('addProcesoWrap').innerHTML = `
    <button class="btn-secondary" id="btnAnadir" style="width:100%;padding:12px;">+ Añadir proceso</button>
  `;
  document.getElementById('btnAnadir')?.addEventListener('click', agregarProceso);
}

function renderProceso(p, gi, pi) {
  const isDefault = /^Nuevo proceso \d+$/.test(p.nombre.trim());
  const completo = procesoCompleto(p);
  const criticidad = config.criticidades[p.critico];
  const criticoClass = `critico-${p.critico}`;
  const rtoRpoError = p.rpo_horas > p.rto_horas;
  
  return `
    <div class="proceso-item ${completo ? 'completo' : 'incompleto'}" id="proc-${p.id}">
      <div class="proceso-header">
        <div class="nombre-wrapper">
          <input type="text"
            class="proceso-nombre-input${isDefault ? ' default-name' : ''}"
            value="${escapeHtml(p.nombre)}"
            placeholder="Nombre del proceso..."
            data-id="${p.id}"
            data-field="nombre"
            onchange="actualizarCampo('${p.id}', 'nombre', this.value)"
            onfocus="this.classList.remove('default-name')">
          <button class="btn-edit-nombre" data-id="${p.id}" title="Editar nombre">✏️</button>
          <span class="completitud-badge ${completo ? 'ok' : 'pending'}" id="badge-${p.id}">${completo ? '✓ Completo' : 'Pendiente'}</span>
        </div>
        <select class="proceso-critico ${criticoClass}" data-id="${p.id}" data-field="critico" onchange="actualizarCampo('${p.id}', 'critico', this.value)">
          <option value="critico" ${p.critico === 'critico' ? 'selected' : ''}>◉ CRÍTICO (parada &lt;4h)</option>
          <option value="alto" ${p.critico === 'alto' ? 'selected' : ''}>▲ ALTO (parada 4-12h)</option>
          <option value="medio" ${p.critico === 'medio' ? 'selected' : ''}>◆ MEDIO (parada 12-48h)</option>
          <option value="bajo" ${p.critico === 'bajo' ? 'selected' : ''}>● BAJO (parada &gt;48h)</option>
        </select>
      </div>
      <div class="grid-rto">
        <div class="rto-field">
          <span class="rto-label">RTO · Recovery Time Objective</span>
          <div class="rto-value">
            <input type="number" data-id="${p.id}" data-field="rto_horas" value="${p.rto_horas}" step="0.5" min="0.5" onchange="actualizarCampo('${p.id}', 'rto_horas', this.value)">
            <span class="rto-unit">horas</span>
          </div>
          <div class="rto-hint">Tiempo máximo hasta recuperar el servicio</div>
        </div>
        <div class="rto-field ${rtoRpoError ? 'error' : ''}" id="rpo-field-${p.id}">
          <span class="rto-label">RPO · Recovery Point Objective</span>
          <div class="rto-value">
            <input type="number" data-id="${p.id}" data-field="rpo_horas" value="${p.rpo_horas}" step="0.5" min="0" onchange="actualizarCampo('${p.id}', 'rpo_horas', this.value)">
            <span class="rto-unit">horas</span>
          </div>
          <div class="rto-hint">Pérdida máxima de datos tolerable</div>
          ${rtoRpoError ? '<div class="rto-error">⚠ RPO no puede ser mayor que RTO</div>' : ''}
        </div>
      </div>
      <div class="rto-field" style="margin-top:8px;">
        <span class="rto-label">Dependencias (tecnológicas, proveedores, internas)</span>
        <input type="text" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;font-size:13px;"
          placeholder="Ej: Internet, CRM, ERP..." value="${p.dependencias.join(', ')}"
          data-id="${p.id}" data-field="dependencias" onchange="actualizarCampo('${p.id}', 'dependencias', this.value)">
      </div>
      <div class="proceso-obs">
        <textarea rows="2" class="form-textarea" placeholder="Observaciones o estrategia de recuperación específica..."
          data-id="${p.id}" data-field="observaciones" onchange="actualizarCampo('${p.id}', 'observaciones', this.value)">${escapeHtml(p.observaciones)}</textarea>
      </div>
      ${isDefault ? '<div class="aviso-warning">✏️ Dale un nombre descriptivo a este proceso antes de generar el informe.</div>' : ''}
      <div style="margin-top:12px;text-align:right;">
        <button class="reset-btn" style="padding:4px 12px;font-size:10px;" onclick="eliminarProceso('${p.id}')">🗑 Eliminar</button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ── ACTUALIZACIÓN DE CAMPOS ──
window.actualizarCampo = function(id, campo, valor) {
  const p = todosLosProcesos().find(p => p.id === id);
  if (!p) return;
  
  if (campo === 'nombre') {
    p.nombre = valor || p.nombre;
  } else if (campo === 'critico') {
    p.critico = valor;
    const sel = document.querySelector(`#proc-${id} .proceso-critico`);
    if (sel) {
      sel.className = `proceso-critico critico-${valor}`;
    }
  } else if (campo === 'rto_horas') {
    p.rto_horas = parseFloat(valor) || 0;
  } else if (campo === 'rpo_horas') {
    p.rpo_horas = parseFloat(valor) || 0;
  } else if (campo === 'dependencias') {
    p.dependencias = valor.split(',').map(s => s.trim()).filter(s => s);
  } else if (campo === 'observaciones') {
    p.observaciones = valor;
  }
  
  actualizarCompletoUI(id);
  actualizarProgreso();
  actualizarBtnAnadir();
};

window.eliminarProceso = function(id) {
  grupos.forEach(g => {
    g.procesos = g.procesos.filter(p => p.id !== id);
  });
  renderTodo();
};

function agregarProceso() {
  const todos = todosLosProcesos();
  const newId = 'p' + Date.now().toString().slice(-6);
  const lastGroup = grupos[grupos.length - 1];
  
  lastGroup.procesos.push({
    id: newId,
    nombre: `Nuevo proceso ${todos.length + 1}`,
    critico: 'medio',
    rto_horas: config.defaults.rto_horas,
    rpo_horas: config.defaults.rpo_horas,
    dependencias: [],
    observaciones: ''
  });
  
  renderTodo();
  setTimeout(() => {
    const el = document.getElementById(`proc-${newId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.querySelector('.proceso-nombre-input')?.focus();
    }
  }, 100);
}

function resetAll() {
  if (!confirm('¿Reiniciar todos los procesos y valores?')) return;
  grupos = JSON.parse(JSON.stringify(config.grupos));
  renderTodo();
}

// ── COMPLETITUD ──
function procesoCompleto(p) {
  return !/^Nuevo proceso \d+$/.test(p.nombre.trim()) && 
         p.dependencias.length > 0 && 
         p.rpo_horas <= p.rto_horas;
}

function actualizarCompletoUI(id) {
  const p = todosLosProcesos().find(p => p.id === id);
  if (!p) return;
  
  const item = document.getElementById(`proc-${p.id}`);
  const badge = document.getElementById(`badge-${p.id}`);
  const completo = procesoCompleto(p);
  
  if (item) {
    item.className = `proceso-item ${completo ? 'completo' : 'incompleto'}`;
  }
  if (badge) {
    badge.className = `completitud-badge ${completo ? 'ok' : 'pending'}`;
    badge.textContent = completo ? '✓ Completo' : 'Pendiente';
  }
  
  const rpoField = document.getElementById(`rpo-field-${p.id}`);
  if (rpoField) {
    const errDiv = rpoField.querySelector('.rto-error');
    if (p.rpo_horas > p.rto_horas) {
      rpoField.classList.add('error');
      if (!errDiv) {
        const newErr = document.createElement('div');
        newErr.className = 'rto-error';
        newErr.textContent = '⚠ RPO no puede ser mayor que RTO';
        rpoField.appendChild(newErr);
      }
    } else {
      rpoField.classList.remove('error');
      if (errDiv) errDiv.remove();
    }
  }
}

function todosLosProcesos() {
  return grupos.flatMap(g => g.procesos);
}

function actualizarProgreso() {
  const todos = todosLosProcesos();
  const total = todos.length;
  const completos = todos.filter(procesoCompleto).length;
  const pct = total ? Math.round(completos / total * 100) : 0;
  
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').innerHTML = `<span>${completos}</span> de ${total} procesos completados`;
  
  const sts = document.getElementById('progress-status');
  if (pct === 100) {
    sts.style.background = '#e8f8f5';
    sts.style.color = '#1e8449';
    sts.textContent = '✓ Todos los procesos completados';
  } else if (pct > 50) {
    sts.style.background = '#e8f4f8';
    sts.style.color = '#2c7da0';
    sts.textContent = `⚙ ${pct}% completado`;
  } else {
    sts.style.background = '#fff3cd';
    sts.style.color = '#92400e';
    sts.textContent = `⚙ ${pct}% completado`;
  }
  
  const stickyInfo = document.getElementById('stickyInfo');
  const criticos = todos.filter(p => p.critico === 'critico').length;
  stickyInfo.innerHTML = `<strong>${total}</strong> procesos · <strong>${criticos}</strong> críticos · ${completos}/${total} completados`;
}

function actualizarBtnAnadir() {
  const btn = document.getElementById('btnAnadir');
  if (!btn) return;
  const todos = todosLosProcesos();
  const ultimoCompleto = todos.length === 0 || procesoCompleto(todos[todos.length - 1]);
  btn.disabled = !ultimoCompleto;
  btn.title = ultimoCompleto ? '' : 'Completa el proceso anterior antes de añadir otro';
}

function renderWizardNav() {
  const gruposIds = grupos.map(g => g.id);
  const container = document.getElementById('wizardNav');
  container.innerHTML = gruposIds.map((id, idx) => `
    <div class="wizard-step ${idx === 0 ? 'active' : ''}" data-grupo="${id}">
      ${grupos[idx].titulo}
    </div>
  `).join('');
  
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.addEventListener('click', () => {
      const grupoId = step.dataset.grupo;
      document.getElementById(`grupo-items-${grupoId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ── GENERAR INFORME ──
function generarInforme() {
  const todos = todosLosProcesos();
  const sinNombre = todos.filter(p => /^Nuevo proceso \d+$/.test(p.nombre.trim()));
  
  if (sinNombre.length > 0) {
    if (!confirm(`${sinNombre.length} proceso(s) aún tienen nombre genérico. ¿Generar igualmente?`)) {
      return;
    }
  }
  
  const cfg = config.frameworks[frameworkSeleccionado];
  const criticos = todos.filter(p => p.critico === 'critico').length;
  const altos = todos.filter(p => p.critico === 'alto').length;
  const medios = todos.filter(p => p.critico === 'medio').length;
  const bajos = todos.filter(p => p.critico === 'bajo').length;
  const avgRTO = Math.round(todos.reduce((s, p) => s + p.rto_horas, 0) / todos.length);
  const avgRPO = Math.round(todos.reduce((s, p) => s + p.rpo_horas, 0) / todos.length);
  const rtoMin = Math.min(...todos.map(p => p.rto_horas));
  const rtoMax = Math.max(...todos.map(p => p.rto_horas));
  const procCriticos = todos.filter(p => p.critico === 'critico').map(p => p.nombre);
  const criticosRapidos = todos.filter(p => p.critico === 'critico' && p.rto_horas <= 4);
  const depsCriticas = [...new Set(todos.filter(p => p.critico === 'critico').flatMap(p => p.dependencias))];
  
  const estrategias = criticosRapidos.length > 0
    ? `Los procesos críticos (${criticosRapidos.map(p => p.nombre).join(', ')}) requieren estrategias de alta disponibilidad: clúster activo-activo, failover automático o hot standby.`
    : `Implementar estrategias de recuperación priorizando los procesos con menor RTO (${rtoMin}h).`;
  
  const filas = todos.map(p => {
    const lbl = { critico: 'CRÍTICO', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' }[p.critico];
    const cls = { critico: 'bc-critico', alto: 'bc-alto', medio: 'bc-medio', bajo: 'bc-bajo' }[p.critico];
    return `<tr>
      <td style="font-weight:600;">${escapeHtml(p.nombre)}</td>
      <td><span class="badge-critico ${cls}">${lbl}</span></td>
      <td style="font-family:monospace;font-weight:700;">${p.rto_horas}h</td>
      <td style="font-family:monospace;font-weight:700;">${p.rpo_horas}h</td>
      <td style="font-size:12px;">${p.dependencias.join(', ') || '—'}</td>
      <td style="font-size:11px;color:#666;">${escapeHtml(p.observaciones) || '—'}</td>
    </tr>`;
  }).join('');
  
  const d = { avgRTO, avgRPO, rtoMin, rtoMax, procCriticos, estrategias, depsCriticas, criticosRapidos };
  
  document.getElementById('informeContenido').innerHTML = `
    <span class="framework-badge ${cfg.color}">${cfg.nombre} · ${cfg.controles}</span>
    <div class="informe-section">
      <div class="informe-section-title">🏢 Identificación del documento</div>
      <table style="width:100%;font-size:13px;">
        <tr><td style="padding:6px 0;width:180px;color:var(--muted);font-family:monospace;">ORGANIZACIÓN</td><td style="font-weight:600;">${escapeHtml(datosFirma.empresa)}</td></tr>
        <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">RESPONSABLE</td><td>${escapeHtml(datosFirma.responsable)}</td></tr>
        <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">MARCO NORMATIVO</td><td>${cfg.nombre}</td></tr>
        <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">FECHA BIA</td><td>${datosFirma.fecha}</td></tr>
        <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">ALCANCE</td><td>${escapeHtml(datosFirma.alcance)}</td></tr>
        <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">UBICACIONES</td><td>${escapeHtml(datosFirma.ubicaciones)}</td></tr>
      </table>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">📊 Resumen BIA</div>
      <div class="resumen-grid">
        <div class="resumen-card critico-card"><div class="resumen-num" style="color:#991b1b;">${criticos}</div><div class="resumen-label">Críticos</div></div>
        <div class="resumen-card" style="background:#fff3cd;"><div class="resumen-num" style="color:#92400e;">${altos}</div><div class="resumen-label">Altos</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:#d35400;">${medios}</div><div class="resumen-label">Medios</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:#1e8449;">${bajos}</div><div class="resumen-label">Bajos</div></div>
      </div>
      <div class="resumen-grid">
        <div class="resumen-card rto-avg"><div class="resumen-num" style="color:var(--success);">${avgRTO}h</div><div class="resumen-label">RTO Promedio</div></div>
        <div class="resumen-card rpo-avg"><div class="resumen-num" style="color:#d35400;">${avgRPO}h</div><div class="resumen-label">RPO Promedio</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:var(--brand);">${rtoMin}h</div><div class="resumen-label">RTO Mínimo</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:var(--muted);">${rtoMax}h</div><div class="resumen-label">RTO Máximo</div></div>
      </div>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">📋 Inventario de procesos con RTO/RPO</div>
      <table class="proceso-table">
        <thead><tr><th>Proceso</th><th>Criticidad</th><th>RTO</th><th>RPO</th><th>Dependencias</th><th>Observaciones</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">📋 Estrategia de Continuidad (BCP)</div>
      <div class="aviso" style="background:#e8f4f8;">
        <strong>RTO mínimo:</strong> ${rtoMin}h · <strong>RTO máximo:</strong> ${rtoMax}h · <strong>RPO promedio:</strong> ${avgRPO}h
      </div>
      <ul style="margin-left:20px;line-height:1.9;font-size:13px;">
        <li><strong>Prioridad de recuperación:</strong> ${procCriticos.join(', ') || 'Sin procesos críticos definidos'}</li>
        <li><strong>Estrategia recomendada:</strong> ${estrategias}</li>
        <li><strong>Dependencias críticas a proteger:</strong> ${depsCriticas.join(', ') || 'Identificar dependencias principales'}</li>
        <li><strong>Backup y restauración:</strong> Verificar que las copias de seguridad cumplen el RPO de ${avgRPO}h. Configurar retención y frecuencia de backup acorde.</li>
        <li><strong>Plan de comunicación:</strong> Establecer cadena de mando y protocolos de comunicación a clientes y stakeholders ante incidente.</li>
        <li><strong>Pruebas del plan:</strong> Realizar simulacros al menos cada 6 meses. Documentar resultados y lecciones aprendidas.</li>
        ${configResumenExtra(cfg, d)}
      </ul>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">🖥 Plan de Recuperación ante Desastres (DRP)</div>
      <ul style="margin-left:20px;line-height:1.9;font-size:13px;">
        <li><strong>Responsable de coordinación:</strong> ${escapeHtml(datosFirma.responsable)}</li>
        <li><strong>Infraestructura alternativa:</strong> Definir centro de respaldo (cloud secundario, oficina alternativa o teletrabajo).</li>
        <li><strong>Niveles de activación:</strong>
          <ul style="margin-left:20px;margin-top:4px;">
            <li>Nivel 1 — Incidencia menor: resolución interna sin activar el DRP completo</li>
            <li>Nivel 2 — Incidencia mayor: activación parcial, procesos críticos</li>
            <li>Nivel 3 — Desastre: activación total del plan, traslado a sede alternativa</li>
          </ul>
        </li>
        <li><strong>Checklist de restauración:</strong>
          <ul style="margin-left:20px;margin-top:4px;">
            <li>✓ Activar equipo de respuesta y comunicar a dirección</li>
            <li>✓ Restaurar desde backups (RPO objetivo: ${avgRPO}h)</li>
            <li>✓ Validar integridad de datos restaurados</li>
            <li>✓ Desviar tráfico/usuarios a sistemas alternativos</li>
            <li>✓ Comunicar a clientes/usuarios afectados</li>
            <li>✓ Documentar el incidente y lecciones aprendidas</li>
          </ul>
        </li>
        <li><strong>Retorno a operación normal (fallback):</strong> Plan de reversión documentado con criterios de vuelta a producción.</li>
      </ul>
    </div>
    ${configInformeExtra(cfg, d)}
    <div class="informe-section">
      <div class="informe-section-title">✅ Próximos pasos</div>
      <ul style="margin-left:20px;line-height:1.9;font-size:13px;">
        <li>📌 <strong>Aprobación formal</strong> de este BIA/BCP por la dirección</li>
        <li>🔄 <strong>Revisión periódica:</strong> actualizar al menos anualmente o tras cambios significativos</li>
        <li>🧪 <strong>Simulacro de recuperación:</strong> programar en los próximos <strong>${Math.min(3, Math.floor(avgRTO / 24) || 1)} meses</strong></li>
        <li>📚 <strong>Formación:</strong> comunicar el plan a todos los equipos involucrados</li>
        <li>🔗 <strong>Integración normativa:</strong> vincular este BIA con tu SGSI / sistema de gestión bajo ${cfg.nombre}</li>
      </ul>
    </div>
    <div style="font-family:monospace;font-size:10px;color:var(--muted);text-align:center;padding-top:24px;border-top:1px solid var(--border-soft);">
      Documento generado con <strong>GRCreal.com</strong> · Miguel Ángel Carriazo, vCISO ·
      BIA / BCP / DRP · ${cfg.nombre} · Sin almacenamiento de datos.
    </div>
  `;
  
  mostrarPantalla('informe');
}

function configResumenExtra(cfg, d) {
  if (cfg.id === 'iso22301') {
    return `<li><strong>Pruebas y ejercicios (8.5):</strong> Programar ejercicio de validación del BCP en los próximos ${Math.min(3, Math.floor(d.avgRTO / 24) || 1)} meses.</li>`;
  }
  if (cfg.id === 'iso27001') {
    return `<li><strong>A.5.30 Preparación TIC:</strong> Verificar redundancia de sistemas críticos identificados en este BIA.</li>`;
  }
  if (cfg.id === 'ens') {
    return `<li><strong>Categorización ENS:</strong> Revisar que la dimensión de disponibilidad (D) en la categorización del sistema es coherente con los RTO/RPO definidos. RTO mínimo = ${d.rtoMin}h → categoría ${d.rtoMin <= 4 ? 'ALTA' : d.rtoMin <= 24 ? 'MEDIA' : 'BÁSICA'}.</li>`;
  }
  if (cfg.id === 'nis2') {
    return `<li><strong>Art. 21.2(c) NIS2:</strong> Este BIA forma parte de las medidas técnicas y organizativas de gestión de continuidad exigidas a entidades esenciales e importantes.</li>`;
  }
  if (cfg.id === 'dora') {
    return `<li><strong>Art. 12 BIA:</strong> Identificar funciones críticas y dependencias ICT externas.</li><li><strong>Art. 13 Registro:</strong> Mantener actualizado el registro de ICT RPS.</li>`;
  }
  if (cfg.id === 'iso42001') {
    return `<li><strong>Cláusula 6.1.2:</strong> Este BIA identifica impactos de los sistemas de IA en la organización.</li><li><strong>A.7 Supervisión humana:</strong> Validar que existe supervisión humana en decisiones críticas.</li>`;
  }
  return '';
}

function configInformeExtra(cfg, d) {
  if (cfg.id === 'iso22301') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">📐 Alineación ISO 22301:2019</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">Cláusula 8.2</td><td>BIA documentado — este documento</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Cláusula 8.3</td><td>Estrategias de continuidad definidas por proceso</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Cláusula 8.4</td><td>Plan de continuidad (BCP) — sección anterior</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Cláusula 8.5</td><td>Ejercicios: programar simulacro en ${Math.min(3, Math.floor(d.avgRTO / 24) || 1)} meses</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Cláusula 9.1</td><td>Seguimiento: revisión anual de RTO/RPO</td></tr>
        </table>
      </div>`;
  }
  if (cfg.id === 'iso27001') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">🔐 Alineación ISO 27001:2022 — Anexo A</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">A.5.29</td><td>Continuidad de la seguridad de la información — este BIA cubre los procesos y activos críticos</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">A.5.30</td><td>Preparación TIC para continuidad — validar redundancia en: ${d.procCriticos.join(', ') || 'procesos críticos identificados'}</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">A.8.6</td><td>Gestión de la capacidad — revisar que los RTO definidos son alcanzables con la infraestructura actual</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">A.8.13</td><td>Backup de información — RPO promedio definido: ${d.avgRPO}h → configurar frecuencia de copias acorde</td></tr>
        </table>
      </div>`;
  }
  if (cfg.id === 'ens') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">🏛 Alineación ENS — RD 311/2022</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">op.cont.1</td><td>Análisis de impacto — este documento cumple el requisito de BIA formal</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">op.cont.2</td><td>Plan de continuidad — sección BCP de este informe</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">op.cont.3</td><td>Pruebas periódicas del plan — obligatorio en categoría MEDIA y ALTA</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">mp.com.3</td><td>Continuidad del servicio — los RTO/RPO deben reflejarse en los SLA con la Administración</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Dimensión D</td><td>Disponibilidad: RTO mínimo definido = ${d.rtoMin}h → categorizar como ${d.rtoMin <= 4 ? 'ALTA' : d.rtoMin <= 24 ? 'MEDIA' : 'BÁSICA'}</td></tr>
        </table>
      </div>`;
  }
  if (cfg.id === 'nis2') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">🇪🇺 Alineación NIS2 — Directiva (UE) 2022/2555</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">Art. 21.2(c) </td><td>Continuidad de negocio — gestión de copias de seguridad, recuperación ante desastres y gestión de crisis</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 21.2(a) </td><td>Políticas de seguridad — este BIA debe integrarse en la política de continuidad aprobada por dirección</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 23 </td><td>Notificación de incidentes — los procesos con RTO &lt;4h deben tener procedimiento de notificación a INCIBE/CNPIC</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 21.4 </td><td>Responsabilidad de dirección — aprobación formal de este BIA por órgano de dirección</td></tr>
        </table>
        <div class="aviso" style="margin-top:12px;background:#f3e8ff;border-color:#a855f7;">
          <strong>Recordatorio NIS2:</strong> Las entidades esenciales están sujetas a supervisión ex-ante. Las entidades importantes, ex-post. Verificar la clasificación de tu organización según el Anexo I y II de la Directiva.
        </div>
      </div>`;
  }
  if (cfg.id === 'dora') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">🏦 Alineación DORA — Reglamento (UE) 2022/2554</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">Art. 11 </td><td>ICT RPS — Identificar proveedores externos de servicios ICT críticos</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 12 </td><td>BIA para funciones críticas — este documento cumple el requisito</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 13 </td><td>Registro de información — mantener actualizado el registro de ICT RPS</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Art. 14 </td><td>Pruebas de resiliencia operativa — programar pruebas periódicas de los planes de continuidad</td></tr>
        </table>
        <div class="aviso" style="margin-top:12px;background:#e8f4e8;border-color:#2d6a4f;">
          <strong>Recordatorio DORA:</strong> Aplicable a entidades financieras. Las funciones críticas identificadas en este BIA deben tener contratos con ICT RPS que incluyan cláusulas de notificación de brechas (máx 24h).
        </div>
      </div>`;
  }
  if (cfg.id === 'iso42001') {
    return `
      <div class="informe-section">
        <div class="informe-section-title">🤖 Alineación ISO 42001:2023 — Sistemas de Gestión de IA</div>
        <table style="width:100%;font-size:13px;">
          <tr><td style="padding:6px 0;width:200px;color:var(--muted);font-family:monospace;">Cláusula 6.1.2 </td><td>Análisis de impacto de IA — este BIA identifica impactos de los sistemas de IA</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Anexo A.6.2 </td><td>Transparencia — documentar los sistemas de IA y sus decisiones</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Anexo A.7 </td><td>Supervisión humana — garantizar que existe supervisión humana en decisiones críticas</td></tr>
          <tr><td style="padding:6px 0;color:var(--muted);font-family:monospace;">Anexo A.9 </td><td>Resiliencia y continuidad — planes específicos para sistemas de IA</td></tr>
        </table>
        <div class="aviso" style="margin-top:12px;background:#f3e8ff;border-color:#6b21a8;">
          <strong>Recordatorio ISO 42001:</strong> Si tu organización desarrolla o utiliza sistemas de IA, este BIA debe incluir impactos específicos de esos sistemas (sesgos, opacidad, fallos autónomos).
        </div>
      </div>`;
  }
  return '';
}

function volverPreguntas() {
  mostrarPantalla('preguntas');
  renderTodo();
}

function nuevoAnalisis() {
  if (!confirm('¿Iniciar un nuevo análisis? Se perderán todos los datos.')) return;
  grupos = JSON.parse(JSON.stringify(config.grupos));
  frameworkSeleccionado = 'iso22301';
  datosFirma = {
    empresa: '',
    responsable: '',
    fecha: '',
    alcance: '',
    ubicaciones: ''
  };
  document.getElementById('f-empresa').value = '';
  document.getElementById('f-responsable').value = '';
  document.getElementById('f-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('f-alcance').value = '';
  document.getElementById('f-ubicaciones').value = '';
  
  const firstFwCard = document.querySelector('.fw-card');
  if (firstFwCard) {
    document.querySelectorAll('.fw-card').forEach(c => c.classList.remove('selected'));
    firstFwCard.classList.add('selected');
    frameworkSeleccionado = firstFwCard.dataset.framework || 'iso22301';
    const fwConfig = config.frameworks[frameworkSeleccionado];
    if (fwConfig) document.getElementById('headerTag').textContent = fwConfig.tag;
  }
  
  mostrarPantalla('inicio');
}

// ── EXPORTAR PDF ──
async function exportarPDF() {
  const btn = document.getElementById('btnExportarPDF');
  const originalText = btn.textContent;
  btn.textContent = '⏳ Generando PDF...';
  btn.disabled = true;
  
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) throw new Error('jsPDF no cargado');
    
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const M = 16;
    const brand = [44, 125, 160];
    
    const todos = todosLosProcesos();
    const cfg = config.frameworks[frameworkSeleccionado];
    const avgRTO = Math.round(todos.reduce((s, p) => s + p.rto_horas, 0) / todos.length);
    const avgRPO = Math.round(todos.reduce((s, p) => s + p.rpo_horas, 0) / todos.length);
    const rtoMin = Math.min(...todos.map(p => p.rto_horas));
    
    // Portada
    doc.setFillColor(...brand);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('GRCreal.com', M, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Herramienta de Continuidad de Negocio', M, 28);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`BIA / BCP / DRP · ${datosFirma.empresa || 'Organización'}`, M, 40);
    
    doc.setFillColor(232, 244, 248);
    doc.roundedRect(M, 55, 80, 10, 2, 2, 'F');
    doc.setTextColor(...brand);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(cfg.nombre, M + 4, 62);
    
    let y = 74;
    
    const addSection = (titulo) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...brand);
      doc.text(titulo.toUpperCase(), M, y);
      doc.setDrawColor(...brand);
      doc.line(M, y + 2, 210 - M, y + 2);
      doc.setTextColor(0, 0, 0);
      y += 8;
    };
    
    addSection('Identificación del documento');
    const datos = [
      ['Organización', datosFirma.empresa || '—'],
      ['Responsable', datosFirma.responsable || '—'],
      ['Marco normativo', cfg.nombre],
      ['Fecha BIA', datosFirma.fecha || '—'],
      ['Alcance', datosFirma.alcance || 'Toda la organización'],
      ['Ubicaciones', datosFirma.ubicaciones || '—']
    ];
    doc.setFontSize(9);
    datos.forEach(([k, v]) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(k.toUpperCase(), M, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(String(v), M + 55, y);
      y += 6;
    });
    
    y += 6;
    addSection('Resumen BIA');
    doc.setFontSize(9);
    const criticos = todos.filter(p => p.critico === 'critico').length;
    const altos = todos.filter(p => p.critico === 'alto').length;
    const medios = todos.filter(p => p.critico === 'medio').length;
    const bajos = todos.filter(p => p.critico === 'bajo').length;
    doc.text(`Procesos críticos: ${criticos}   Altos: ${altos}   Medios: ${medios}   Bajos: ${bajos}`, M, y);
    y += 5;
    doc.text(`RTO promedio: ${avgRTO}h   RPO promedio: ${avgRPO}h   RTO mínimo: ${rtoMin}h`, M, y);
    y += 10;
    
    addSection('Inventario de procesos — RTO / RPO');
    todos.forEach(p => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(p.nombre.substring(0, 70), M, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`RTO: ${p.rto_horas}h  /  RPO: ${p.rpo_horas}h  ·  Criticidad: ${p.critico.toUpperCase()}`, M, y + 4);
      if (p.dependencias.length) {
        const depText = `Dependencias: ${p.dependencias.join(', ')}`;
        const lines = doc.splitTextToSize(depText, 180);
        lines.forEach((l, i) => { doc.text(l, M, y + 8 + (i * 4)); });
        y += 8 + (lines.length * 4);
      } else {
        y += 8;
      }
      if (p.observaciones) {
        const obsLines = doc.splitTextToSize(`Obs: ${p.observaciones}`, 180);
        obsLines.forEach((l, i) => { doc.text(l, M, y + (i * 4)); });
        y += obsLines.length * 4;
      }
      doc.setDrawColor(230, 230, 230);
      doc.line(M, y + 1, 210 - M, y + 1);
      y += 5;
    });
    
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`GRCreal.com · BIA/BCP/DRP · ${cfg.nombre} · ${datosFirma.empresa || ''} · Pág. ${i}/${pages}`, M, 290);
    }
    
    doc.save(`BIA_BCP_DRP_${datosFirma.empresa || 'empresa'}_${frameworkSeleccionado}_${datosFirma.fecha || 'fecha'}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Intenta de nuevo.');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}