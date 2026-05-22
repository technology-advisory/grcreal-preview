// ── ESTADO GLOBAL ──
let config = null;
let grupos = [];
let frameworkSeleccionado = 'iso22301';
let datosFirma = {
  empresa: '', responsable: '', fecha: '', alcance: '', ubicaciones: ''
};

// ── TOOLTIPS POR PROCESO (info contextual como en checklists) ──
const TOOLTIPS_PROCESO = {
  p01: 'El correo es el canal principal de comunicación interna y externa. Su caída afecta coordinación, atención al cliente y operaciones. Evalúa si tienes canales alternativos (Teams, Slack, teléfono) definidos.',
  p02: 'Los backups son la última línea de defensa ante ransomware, borrados accidentales o fallos de hardware. Define claramente cada cuánto horas se hace backup (RPO) y cuánto tardarías en restaurar (RTO).',
  p03: 'Sin IAM/SSO los usuarios no pueden acceder a ningún sistema. Evalúa si tienes cuentas locales de emergencia, procedimientos de acceso manual y cómo recuperar el servicio de directorio.',
  p04: 'El pipeline de CI/CD afecta a la capacidad de publicar correcciones de seguridad y nuevas versiones. Una parada prolongada bloquea todo el ciclo de desarrollo.',
  p05: 'Tu presencia web pública es la primera imagen ante clientes y prospectos. Define si tienes CDN, DNS alternativo y procedimiento de página de mantenimiento.',
  p06: 'Los parches sin aplicar son vulnerabilidades abiertas. Evalúa si puedes posponer actualizaciones sin riesgo y cuánto tiempo máximo puedes estar sin parchear.',
  p07: 'Sin monitorización estás ciego ante incidentes. El SIEM y alertas son críticos para detectar ataques en curso. Su caída puede significar horas sin visibilidad.',
  p08: 'El EDR es tu primera barrera contra malware. Si cae la consola central, los agentes siguen funcionando en modo autónomo — pero sin visibilidad centralizada.',
  p09: 'La facturación parada significa pérdida directa de ingresos y posibles incumplimientos contractuales. Prioridad máxima en cualquier BCP.',
  p10: 'La atención al cliente afecta directamente a la reputación y retención. Define canales alternativos y protocolo de comunicación de crisis ante clientes.',
  p11: 'El core del negocio: producción, prestación de servicio o fabricación. Su parada es la parada del negocio. RTO debe ser el más restrictivo.',
  p12: 'Una cadena de suministro interrumpida puede paralizar producción aunque tus sistemas internos funcionen. Evalúa proveedores alternativos y stock mínimo.',
  p13: 'La gestión documental afecta a contratos, procedimientos y evidencias de auditoría. Una pérdida puede tener consecuencias legales.',
  p14: 'Sin CRM los equipos comerciales pierden contexto de cliente, histórico y pipeline activo. Evalúa si tienes exportaciones recientes y acceso offline.',
  p15: 'Marketing puede permitirse más tiempo de parada sin impacto inmediato en ingresos. Prioridad baja salvo campañas activas con penalizaciones.',
  p16: 'Contratos sin acceso pueden bloquear renovaciones, facturación y operaciones legales. La firma electrónica es crítica si no tienes backup en papel.',
  p17: 'Los impagos de nómina tienen consecuencias legales inmediatas. Evalúa si tienes proceso manual de emergencia para pago de salarios.',
  p18: 'Incumplir plazos regulatorios (CNMV, AEAT, Banco de España) genera sanciones automáticas. Identifica qué obligaciones son inaplazables.',
  p19: 'La gestión de incidentes de seguridad debe ser siempre operativa. Si el SIEM cae durante un ataque, necesitas procedimientos manuales de escalada.',
  p20: 'La comunicación de crisis mal gestionada amplifica el daño reputacional. Define cadena de mando, portavoz y mensajes predefinidos.',
  p21: 'Los plazos fiscales (IVA, IS, IRPF) son inamovibles. Una parada no exime de sanciones. Identifica si tu asesor fiscal tiene acceso a tus sistemas.',
  p22: 'La seguridad física protege personas y activos físicos. Sin control de acceso, cualquier persona puede entrar a zonas restringidas.',
  p23: 'La gestión de flota y equipos tiene impacto diferido: una compra urgente puede no materializarse en días. Prioridad baja en BCP.',
  p24: 'Los accesos de proveedores no revisados son una superficie de ataque. Evalúa si tienes un proceso de revocación de emergencia.'
};

// ── CARGA INICIAL ──
document.addEventListener('DOMContentLoaded', async () => {
  await cargarConfiguracion();
  inicializarEventos();
  renderFrameworkSelector();
  const fechaInput = document.getElementById('f-fecha');
  if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
});

async function cargarConfiguracion() {
  try {
    const response = await fetch('../data/bia-config.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    config = await response.json();
    grupos = JSON.parse(JSON.stringify(config.grupos));
    grupos.forEach(grupo => {
      grupo.procesos.forEach(proceso => {
        proceso._touched = false;
        proceso._noAplica = false; // nuevo flag
      });
    });
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
  const body = document.querySelector('.body');
  if (body) body.prepend(aviso);
}

function inicializarEventos() {
  const btnIniciar = document.getElementById('btnIniciar');
  if (btnIniciar) btnIniciar.addEventListener('click', iniciarBIA);
  const btnReset = document.getElementById('btnReset');
  if (btnReset) btnReset.addEventListener('click', resetAll);
  const stickyBtn = document.getElementById('stickyBtn');
  if (stickyBtn) stickyBtn.addEventListener('click', generarInforme);
  const btnExportarPDF = document.getElementById('btnExportarPDF');
  if (btnExportarPDF) btnExportarPDF.addEventListener('click', exportBiaPDF);
  const stickyBtnMobile = document.getElementById('stickyBtnMobile');
  if (stickyBtnMobile) stickyBtnMobile.addEventListener('click', generarInforme);
  const btnVolver = document.getElementById('btnVolver');
  if (btnVolver) btnVolver.addEventListener('click', volverPreguntas);
  const btnNuevo = document.getElementById('btnNuevo');
  if (btnNuevo) btnNuevo.addEventListener('click', nuevoAnalisis);
}

// ── FRAMEWORK SELECTOR ──
function renderFrameworkSelector() {
  const container = document.getElementById('frameworkGrid');
  if (!container || !config) return;
  container.innerHTML = '';
  Object.entries(config.frameworks).forEach(([key, fw]) => {
    const card = document.createElement('div');
    card.className = `framework-card ${key === frameworkSeleccionado ? 'selected' : ''}`;
    card.setAttribute('data-framework', key);
    card.innerHTML = `
      <div class="framework-icon">${fw.icono}</div>
      <div class="framework-name">${fw.nombre_corto}</div>
      <div class="framework-desc">${fw.nombre}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.framework-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      frameworkSeleccionado = key;
      const headerTag = document.getElementById('headerTag');
      if (headerTag) headerTag.textContent = fw.tag;
    });
    container.appendChild(card);
  });
}

// ── INICIO ──
function iniciarBIA() {
  if (!config) {
    alert('La configuración aún no ha terminado de cargarse. Espera un momento.');
    return;
  }
  const empresaInput = document.getElementById('f-empresa');
  const responsableInput = document.getElementById('f-responsable');
  const empresa = empresaInput ? empresaInput.value.trim() : '';
  const responsable = responsableInput ? responsableInput.value.trim() : '';
  if (!empresa || !responsable) {
    alert('Introduce el nombre de la empresa y el responsable del análisis.');
    return;
  }
  const fechaInput = document.getElementById('f-fecha');
  const alcanceSelect = document.getElementById('f-alcance');
  const ubicacionesInput = document.getElementById('f-ubicaciones');
  let fechaValor = new Date().toLocaleDateString('es-ES');
  if (fechaInput && fechaInput.value) {
    const partes = fechaInput.value.split('-');
    if (partes.length === 3) fechaValor = `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  datosFirma = {
    empresa, responsable, fecha: fechaValor,
    alcance: (alcanceSelect && alcanceSelect.value) || 'Toda la organización',
    ubicaciones: (ubicacionesInput && ubicacionesInput.value.trim()) || 'No especificado'
  };
  window.biaGrupos = grupos;
  window.biaConfig = config;
  window.datosOrganizacion = datosFirma;
  window.frameworkSeleccionado = frameworkSeleccionado;
  window.todosLosProcesos = todosLosProcesos;
  window.procesoCompleto = procesoCompleto;
  mostrarPantalla('preguntas');
  renderTodo();
}

function mostrarPantalla(pantalla) {
  document.getElementById('screenInicio').style.display = pantalla === 'inicio' ? 'block' : 'none';
  document.getElementById('screenPreguntas').style.display = pantalla === 'preguntas' ? 'block' : 'none';
  document.getElementById('screenInforme').style.display = pantalla === 'informe' ? 'block' : 'none';
  const sf = document.getElementById('stickyFooter');
  if (sf) sf.className = `sticky-footer ${pantalla === 'preguntas' ? 'visible' : ''}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── RENDER ──
function renderTodo() {
  renderGrupos();
  actualizarProgreso();
  renderWizardNav();
}

function renderGrupos() {
  const bloqueContainer = document.getElementById('bloqueContainer');
  if (!bloqueContainer) return;

  bloqueContainer.innerHTML = '';

  grupos.forEach((g) => {
    const grupoDiv = document.createElement('div');
    grupoDiv.className = 'grupo-procesos';
    grupoDiv.innerHTML = `
      <div class="grupo-header">
        <span class="grupo-icon">${g.icono}</span>
        <span class="grupo-titulo">${g.titulo}</span>
        <span class="grupo-count">${g.procesos.length} procesos</span>
      </div>
    `;
    const itemsDiv = document.createElement('div');
    itemsDiv.id = `grupo-items-${g.id}`;
    g.procesos.forEach(p => {
      itemsDiv.appendChild(crearProcesoEl(p));
    });
    grupoDiv.appendChild(itemsDiv);
    bloqueContainer.appendChild(grupoDiv);
  });

  // Botón añadir — usando DOM real para evitar el bug de innerHTML + addEventListener
  const addWrap = document.getElementById('addProcesoWrap');
  if (addWrap) {
    addWrap.innerHTML = '';
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'btn-wrapper-anadir';

    const btn = document.createElement('button');
    btn.className = 'btn-anadir-proceso';
    btn.id = 'btnAnadir';
    btn.innerHTML = `<span class="btn-anadir-icon">+</span> Añadir proceso personalizado`;
    btn.addEventListener('click', agregarProceso);

    const popup = document.createElement('span');
    popup.className = 'popup-anadir';
    popup.textContent = '⚠️ Completa el proceso anterior o márcalo como N/A antes de añadir uno nuevo.';

    btnWrapper.appendChild(btn);
    btnWrapper.appendChild(popup);
    addWrap.appendChild(btnWrapper);
  }

  actualizarEstadoBtnAnadir();
}

// FIX PRINCIPAL: crear proceso con DOM real (no innerHTML) → fix del bug de "añadir proceso no funciona"
function crearProcesoEl(p) {
  const completo = procesoCompleto(p);
  const noAplica = p._noAplica === true;
  const rtoRpoError = p.rpo_horas > p.rto_horas;
  const isDefault = /^Nuevo proceso \d+$/.test(p.nombre.trim());
  const tooltipTexto = TOOLTIPS_PROCESO[p.id] || 'Define las características de recuperación de este proceso.';

  const wrapper = document.createElement('div');
  wrapper.className = `proceso-item ${noAplica ? 'no-aplica' : (completo ? 'completo' : 'incompleto')}`;
  wrapper.id = `proc-${p.id}`;

  // ── CABECERA DEL PROCESO ──
  const header = document.createElement('div');
  header.className = 'proceso-header';

  // Nombre + badge + info
  const nombreWrapper = document.createElement('div');
  nombreWrapper.className = 'nombre-wrapper';

  const nombreInput = document.createElement('input');
  nombreInput.type = 'text';
  nombreInput.className = `proceso-nombre-input${isDefault ? ' default-name' : ''}`;
  nombreInput.value = p.nombre;
  nombreInput.placeholder = 'Nombre del proceso...';
  nombreInput.addEventListener('focus', () => nombreInput.classList.remove('default-name'));
  nombreInput.addEventListener('input', () => {
    p.nombre = nombreInput.value;
    p._touched = true;
    actualizarCompletoUI(p.id);
    actualizarProgreso();
    actualizarEstadoBtnAnadir();
    window.biaGrupos = grupos;
  });

  // Botón info tooltip (como en checklists)
  const infoWrap = document.createElement('div');
  infoWrap.className = 'bia-tooltip-wrap';
  const infoIcon = document.createElement('div');
  infoIcon.className = 'info-icon';
  infoIcon.textContent = 'i';
  const tooltipDiv = document.createElement('div');
  tooltipDiv.className = 'bia-tooltip';
  tooltipDiv.textContent = tooltipTexto;
  infoWrap.appendChild(infoIcon);
  infoWrap.appendChild(tooltipDiv);
  infoIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    // Mobile: expandir inline; Desktop: toggle
    if (window.innerWidth < 768) {
      let exp = wrapper.querySelector('.bia-tooltip-expanded');
      if (!exp) {
        exp = document.createElement('div');
        exp.className = 'bia-tooltip-expanded';
        exp.textContent = tooltipTexto;
        wrapper.insertBefore(exp, wrapper.firstChild.nextSibling);
      }
      exp.classList.toggle('visible');
    } else {
      infoWrap.classList.toggle('open');
      document.querySelectorAll('.bia-tooltip-wrap.open').forEach(w => {
        if (w !== infoWrap) w.classList.remove('open');
      });
    }
  });

  const badge = document.createElement('span');
  badge.className = `completitud-badge ${noAplica ? 'na' : (completo ? 'ok' : 'pending')}`;
  badge.id = `badge-${p.id}`;
  badge.textContent = noAplica ? '— N/A' : (completo ? '✓ Completo' : 'Pendiente');

  nombreWrapper.appendChild(nombreInput);
  nombreWrapper.appendChild(infoWrap);
  nombreWrapper.appendChild(badge);

  // Selector criticidad
  const criticoSel = document.createElement('select');
  criticoSel.className = `proceso-critico critico-${p.critico}`;
  [
    ['critico', '◉ CRÍTICO (parada <4h)'],
    ['alto', '▲ ALTO (parada 4-12h)'],
    ['medio', '◆ MEDIO (parada 12-48h)'],
    ['bajo', '● BAJO (parada >48h)']
  ].forEach(([val, lbl]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = lbl;
    if (p.critico === val) opt.selected = true;
    criticoSel.appendChild(opt);
  });
  criticoSel.addEventListener('change', () => {
    p.critico = criticoSel.value;
    p._touched = true;
    criticoSel.className = `proceso-critico critico-${criticoSel.value}`;
    actualizarCompletoUI(p.id);
    actualizarProgreso();
    window.biaGrupos = grupos;
  });

  header.appendChild(nombreWrapper);
  header.appendChild(criticoSel);
  wrapper.appendChild(header);

  // ── CHECKBOX NO APLICA ──
  const noAplicaBar = document.createElement('div');
  noAplicaBar.className = 'no-aplica-bar';
  const noAplicaLabel = document.createElement('label');
  noAplicaLabel.className = 'no-aplica-label';
  const noAplicaCheck = document.createElement('input');
  noAplicaCheck.type = 'checkbox';
  noAplicaCheck.className = 'no-aplica-check';
  noAplicaCheck.checked = noAplica;
  noAplicaLabel.appendChild(noAplicaCheck);
  noAplicaLabel.appendChild(document.createTextNode(' No aplica a esta organización'));
  noAplicaBar.appendChild(noAplicaLabel);
  wrapper.appendChild(noAplicaBar);

  // Contenedor de campos (se oculta si no aplica)
  const camposDiv = document.createElement('div');
  camposDiv.className = 'proceso-campos';
  if (noAplica) camposDiv.style.display = 'none';

  // RTO / RPO grid
  const gridRto = document.createElement('div');
  gridRto.className = 'grid-rto';

  // RTO
  const rtoField = document.createElement('div');
  rtoField.className = 'rto-field';
  rtoField.innerHTML = `<span class="rto-label">RTO · Recovery Time Objective</span>`;
  const rtoVal = document.createElement('div');
  rtoVal.className = 'rto-value';
  const rtoInput = document.createElement('input');
  rtoInput.type = 'number';
  rtoInput.value = p.rto_horas;
  rtoInput.step = '0.5';
  rtoInput.min = '0.5';
  rtoInput.addEventListener('change', () => {
    p.rto_horas = parseFloat(rtoInput.value) || 0.5;
    p._touched = true;
    actualizarCompletoUI(p.id);
    actualizarProgreso();
    window.biaGrupos = grupos;
  });
  const rtoUnit = document.createElement('span');
  rtoUnit.className = 'rto-unit';
  rtoUnit.textContent = 'horas';
  rtoVal.appendChild(rtoInput);
  rtoVal.appendChild(rtoUnit);
  rtoField.appendChild(rtoVal);
  const rtoHint = document.createElement('div');
  rtoHint.className = 'rto-hint';
  rtoHint.textContent = 'Tiempo máximo hasta recuperar el servicio';
  rtoField.appendChild(rtoHint);
  gridRto.appendChild(rtoField);

  // RPO
  const rpoField = document.createElement('div');
  rpoField.className = `rto-field${rtoRpoError ? ' error' : ''}`;
  rpoField.id = `rpo-field-${p.id}`;
  rpoField.innerHTML = `<span class="rto-label">RPO · Recovery Point Objective</span>`;
  const rpoVal = document.createElement('div');
  rpoVal.className = 'rto-value';
  const rpoInput = document.createElement('input');
  rpoInput.type = 'number';
  rpoInput.value = p.rpo_horas;
  rpoInput.step = '0.5';
  rpoInput.min = '0';
  rpoInput.addEventListener('change', () => {
    p.rpo_horas = parseFloat(rpoInput.value) || 0;
    p._touched = true;
    actualizarCompletoUI(p.id);
    actualizarProgreso();
    window.biaGrupos = grupos;
  });
  const rpoUnit = document.createElement('span');
  rpoUnit.className = 'rto-unit';
  rpoUnit.textContent = 'horas';
  rpoVal.appendChild(rpoInput);
  rpoVal.appendChild(rpoUnit);
  rpoField.appendChild(rpoVal);
  const rpoHint = document.createElement('div');
  rpoHint.className = 'rto-hint';
  rpoHint.textContent = 'Pérdida máxima de datos tolerable';
  rpoField.appendChild(rpoHint);
  if (rtoRpoError) {
    const rpoErr = document.createElement('div');
    rpoErr.className = 'rto-error';
    rpoErr.textContent = '⚠ RPO no puede ser mayor que RTO';
    rpoField.appendChild(rpoErr);
  }
  gridRto.appendChild(rpoField);
  camposDiv.appendChild(gridRto);

  // Dependencias
  const depsField = document.createElement('div');
  depsField.className = 'rto-field';
  depsField.style.marginTop = '8px';
  const depsLabel = document.createElement('span');
  depsLabel.className = 'rto-label';
  depsLabel.textContent = 'Dependencias (tecnológicas, proveedores, internas)';
  const depsInput = document.createElement('input');
  depsInput.type = 'text';
  depsInput.className = 'deps-input';
  depsInput.placeholder = 'Ej: Internet, CRM, ERP...';
  depsInput.value = (p.dependencias || []).join(', ');
  depsInput.addEventListener('input', () => {
    p.dependencias = depsInput.value.split(',').map(s => s.trim()).filter(s => s);
    p._touched = true;
    actualizarCompletoUI(p.id);
    actualizarProgreso();
    actualizarEstadoBtnAnadir();
    window.biaGrupos = grupos;
  });
  depsField.appendChild(depsLabel);
  depsField.appendChild(depsInput);
  camposDiv.appendChild(depsField);

  // Observaciones
  const obsDiv = document.createElement('div');
  obsDiv.className = 'proceso-obs';
  const obsArea = document.createElement('textarea');
  obsArea.rows = 2;
  obsArea.className = 'form-textarea';
  obsArea.placeholder = 'Observaciones o estrategia de recuperación específica...';
  obsArea.value = p.observaciones || '';
  obsArea.addEventListener('input', () => {
    p.observaciones = obsArea.value;
    p._touched = true;
    window.biaGrupos = grupos;
  });
  obsDiv.appendChild(obsArea);
  camposDiv.appendChild(obsDiv);

  wrapper.appendChild(camposDiv);

  // Botón eliminar
  const eliminarDiv = document.createElement('div');
  eliminarDiv.className = 'proceso-footer-actions';
  const eliminarBtn = document.createElement('button');
  eliminarBtn.className = 'btn-eliminar';
  eliminarBtn.textContent = '🗑 Eliminar proceso';
  eliminarBtn.addEventListener('click', () => {
    if (!confirm('¿Eliminar este proceso del análisis?')) return;
    grupos.forEach(g => { g.procesos = g.procesos.filter(q => q.id !== p.id); });
    window.biaGrupos = grupos;
    renderTodo();
  });
  eliminarDiv.appendChild(eliminarBtn);
  wrapper.appendChild(eliminarDiv);

  // ── LÓGICA NO APLICA ──
  noAplicaCheck.addEventListener('change', () => {
    p._noAplica = noAplicaCheck.checked;
    p._touched = true;
    camposDiv.style.display = noAplicaCheck.checked ? 'none' : 'block';
    const b = document.getElementById(`badge-${p.id}`);
    if (b) {
      b.className = `completitud-badge ${noAplicaCheck.checked ? 'na' : (procesoCompleto(p) ? 'ok' : 'pending')}`;
      b.textContent = noAplicaCheck.checked ? '— N/A' : (procesoCompleto(p) ? '✓ Completo' : 'Pendiente');
    }
    wrapper.className = `proceso-item ${noAplicaCheck.checked ? 'no-aplica' : (procesoCompleto(p) ? 'completo' : 'incompleto')}`;
    actualizarProgreso();
    actualizarEstadoBtnAnadir();
    window.biaGrupos = grupos;
  });

  // Cerrar tooltips al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.bia-tooltip-wrap')) {
      document.querySelectorAll('.bia-tooltip-wrap.open').forEach(w => w.classList.remove('open'));
    }
  }, { once: false });

  return wrapper;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── ACTUALIZACIÓN ESTADO ──
function procesoCompleto(p) {
  if (p._noAplica) return true; // N/A cuenta como resuelto
  const nombreValido = p.nombre.trim() !== '' && !/^Nuevo proceso \d+$/.test(p.nombre.trim());
  const tieneDeps = p.dependencias && p.dependencias.length > 0;
  const rpoValido = p.rpo_horas <= p.rto_horas;
  const fueTocado = p._touched === true;
  return nombreValido && tieneDeps && rpoValido && fueTocado;
}

function actualizarCompletoUI(id) {
  const p = todosLosProcesos().find(p => p.id === id);
  if (!p) return;
  const item = document.getElementById(`proc-${p.id}`);
  const badge = document.getElementById(`badge-${p.id}`);
  const completo = procesoCompleto(p);
  const noAplica = p._noAplica;
  if (item) item.className = `proceso-item ${noAplica ? 'no-aplica' : (completo ? 'completo' : 'incompleto')}`;
  if (badge) {
    badge.className = `completitud-badge ${noAplica ? 'na' : (completo ? 'ok' : 'pending')}`;
    badge.textContent = noAplica ? '— N/A' : (completo ? '✓ Completo' : 'Pendiente');
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
  if (!grupos) return [];
  return grupos.flatMap(g => g.procesos);
}

function actualizarProgreso() {
  const todos = todosLosProcesos();
  const total = todos.length;
  // N/A cuenta como completo en el progreso
  const completos = todos.filter(procesoCompleto).length;
  const noAplican = todos.filter(p => p._noAplica).length;
  const pct = total ? Math.round(completos / total * 100) : 0;

  const progressBar = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');
  const progressStatus = document.getElementById('progress-status');
  const stickyInfo = document.getElementById('stickyInfo');

  if (progressBar) progressBar.style.width = pct + '%';
  if (progressLabel) {
    const activosCompletos = completos - noAplican;
    progressLabel.innerHTML = `<span>${activosCompletos}</span> de ${total - noAplican} procesos completados${noAplican > 0 ? ` · <span style="color:#6c7a8e">${noAplican} N/A</span>` : ''}`;
  }
  if (progressStatus) {
    if (pct === 100) {
      progressStatus.style.cssText = 'background:#e8f8f5;color:#1e8449';
      progressStatus.textContent = '✓ Todos los procesos completados — listo para generar';
    } else if (pct > 50) {
      progressStatus.style.cssText = 'background:#e8f4f8;color:#2c7da0';
      progressStatus.textContent = `⚙ ${pct}% completado`;
    } else {
      progressStatus.style.cssText = 'background:#fff3cd;color:#92400e';
      progressStatus.textContent = `⚙ ${pct}% completado — Completa cada proceso`;
    }
  }
  if (stickyInfo) {
    const criticos = todos.filter(p => p.critico === 'critico' && !p._noAplica).length;
    stickyInfo.innerHTML = `<strong>${total}</strong> procesos · <strong>${criticos}</strong> críticos · ${completos}/${total} completados`;
  }
}

function actualizarEstadoBtnAnadir() {
  const btn = document.getElementById('btnAnadir');
  if (!btn) return;
  const todos = todosLosProcesos();
  // Puede añadir si no hay procesos o el último está completo/N/A
  const ultimo = todos[todos.length - 1];
  const puedeAnadir = todos.length === 0 || !ultimo || procesoCompleto(ultimo);
  btn.disabled = !puedeAnadir;
  const wrapper = btn.closest('.btn-wrapper-anadir');
  if (wrapper) wrapper.classList.toggle('bloqueado', !puedeAnadir);
}

function renderWizardNav() {
  const container = document.getElementById('wizardNav');
  if (!container) return;
  container.innerHTML = '';
  grupos.forEach((g) => {
    const step = document.createElement('div');
    step.className = 'wizard-step';
    step.dataset.grupo = g.id;
    step.textContent = g.titulo;
    step.addEventListener('click', () => {
      const grupoEl = document.getElementById(`grupo-items-${g.id}`);
      if (grupoEl) grupoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    container.appendChild(step);
  });
  const steps = container.querySelectorAll('.wizard-step');
  if (steps.length > 0) steps[0].classList.add('active');
  const grupoEls = grupos.map(g => document.getElementById(`grupo-items-${g.id}`)).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('grupo-items-', '');
          steps.forEach(s => s.classList.toggle('active', s.dataset.grupo === id));
        }
      });
    }, { threshold: 0.3 });
    grupoEls.forEach(el => obs.observe(el));
  }
}

// ── AÑADIR PROCESO ──
function agregarProceso() {
  const todos = todosLosProcesos();
  const newId = 'p' + Date.now().toString().slice(-6);
  if (!grupos || grupos.length === 0) return;

  // Añadir al último grupo
  const lastGroup = grupos[grupos.length - 1];
  const nuevoProceso = {
    id: newId,
    nombre: `Nuevo proceso ${todos.length + 1}`,
    critico: 'medio',
    rto_horas: config?.defaults?.rto_horas || 12,
    rpo_horas: config?.defaults?.rpo_horas || 6,
    dependencias: [],
    observaciones: '',
    _touched: false,
    _noAplica: false
  };
  lastGroup.procesos.push(nuevoProceso);
  window.biaGrupos = grupos;

  // Renderizar solo el nuevo proceso (sin re-renderizar todo)
  const grupoItemsEl = document.getElementById(`grupo-items-${lastGroup.id}`);
  if (grupoItemsEl) {
    const nuevoEl = crearProcesoEl(nuevoProceso);
    grupoItemsEl.appendChild(nuevoEl);
    // Actualizar contador del grupo
    const grupoCount = grupoItemsEl.closest('.grupo-procesos')?.querySelector('.grupo-count');
    if (grupoCount) grupoCount.textContent = `${lastGroup.procesos.length} procesos`;
  }

  actualizarProgreso();
  actualizarEstadoBtnAnadir();

  setTimeout(() => {
    const el = document.getElementById(`proc-${newId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('.proceso-nombre-input');
      if (input) { input.focus(); input.select(); }
    }
  }, 100);
}

function resetAll() {
  if (!confirm('¿Reiniciar todos los procesos y valores?')) return;
  grupos = JSON.parse(JSON.stringify(config.grupos));
  grupos.forEach(grupo => {
    grupo.procesos.forEach(proceso => {
      proceso._touched = false;
      proceso._noAplica = false;
    });
  });
  window.biaGrupos = grupos;
  renderTodo();
}

// ── GENERAR INFORME HTML ──
function generarInforme() {
  const todos = todosLosProcesos();
  const conErrorRPO = todos.filter(p => !p._noAplica && p.rpo_horas > p.rto_horas);
  if (conErrorRPO.length > 0) {
    alert(`⚠️ ${conErrorRPO.length} proceso(s) tienen RPO mayor que RTO. Corrígelos antes de generar el informe.`);
    return;
  }
  const sinNombre = todos.filter(p => !p._noAplica && /^Nuevo proceso \d+$/.test(p.nombre.trim()));
  const noTocados = todos.filter(p => !p._noAplica && !p._touched);
  if (noTocados.length > 0) {
    if (!confirm(`${noTocados.length} proceso(s) no han sido revisados. ¿Generar igualmente?`)) return;
  }
  if (sinNombre.length > 0) {
    if (!confirm(`${sinNombre.length} proceso(s) aún tienen nombre genérico. ¿Generar igualmente?`)) return;
  }
  mostrarPantalla('informe');
  renderInformeHTML();
}

function renderInformeHTML() {
  const informeContenido = document.getElementById('informeContenido');
  if (!informeContenido) return;
  const todos = todosLosProcesos();
  const activos = todos.filter(p => !p._noAplica);
  const total = todos.length;
  const noAplican = todos.filter(p => p._noAplica).length;
  const completos = todos.filter(procesoCompleto).length;
  const pct = total ? Math.round(completos / total * 100) : 0;
  const criticos = activos.filter(p => p.critico === 'critico').length;
  const altos = activos.filter(p => p.critico === 'alto').length;
  const medios = activos.filter(p => p.critico === 'medio').length;
  const bajos = activos.filter(p => p.critico === 'bajo').length;
  const avgRTO = activos.length > 0 ? (activos.reduce((s, p) => s + p.rto_horas, 0) / activos.length).toFixed(1) : 0;
  const avgRPO = activos.length > 0 ? (activos.reduce((s, p) => s + p.rpo_horas, 0) / activos.length).toFixed(1) : 0;
  const rtoMin = activos.length > 0 ? Math.min(...activos.map(p => p.rto_horas)) : 0;
  const rtoMax = activos.length > 0 ? Math.max(...activos.map(p => p.rto_horas)) : 0;
  const fw = config?.frameworks?.[frameworkSeleccionado] || { nombre: 'ISO 22301:2019', nombre_corto: 'ISO 22301', color: 'fw-iso22301', controles: '' };
  const labelCrit = { critico: 'CRÍTICO', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' };
  const badgeCls = { critico: 'bc-critico', alto: 'bc-alto', medio: 'bc-medio', bajo: 'bc-bajo' };
  const procCriticos = activos.filter(p => p.critico === 'critico' || p.critico === 'alto');
  const depsCriticas = [...new Set(activos.filter(p => p.critico === 'critico').flatMap(p => p.dependencias || []))];

  const filasProcesos = grupos.map(g => {
    const procesosGrupo = g.procesos;
    if (!procesosGrupo.length) return '';
    return `
      <tr><td colspan="6" style="background:#f1f5f9;font-family:var(--mono);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#1a5f7a;padding:10px 10px 6px;">${g.icono} ${g.titulo}</td></tr>
      ${procesosGrupo.map(p => p._noAplica
        ? `<tr style="opacity:0.5"><td><em>${escapeHtml(p.nombre)}</em></td><td colspan="5" style="font-size:11px;color:#6c7a8e;font-style:italic;">— No aplica a esta organización</td></tr>`
        : `<tr>
            <td><strong>${escapeHtml(p.nombre)}</strong></td>
            <td><span class="badge-critico ${badgeCls[p.critico]}">${labelCrit[p.critico]}</span></td>
            <td style="font-family:var(--mono);font-weight:700;color:#1a5f7a;">${p.rto_horas}h</td>
            <td style="font-family:var(--mono);font-weight:700;color:#2c9b6e;">${p.rpo_horas}h</td>
            <td style="font-size:12px;color:#6c7a8e;">${escapeHtml((p.dependencias || []).join(', ')) || '—'}</td>
            <td style="font-size:12px;color:#6c7a8e;">${escapeHtml(p.observaciones || '') || '—'}</td>
          </tr>`
      ).join('')}`;
  }).join('');

  const filasRecuperacion = procCriticos.map(p => {
    const estrategia = p.observaciones?.trim() ? escapeHtml(p.observaciones) : `Recuperar en menos de ${p.rto_horas}h con pérdida máxima de ${p.rpo_horas}h de datos.`;
    return `<tr>
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td><span class="badge-critico ${badgeCls[p.critico]}">${labelCrit[p.critico]}</span></td>
      <td style="font-family:var(--mono);font-size:12px;">${p.rto_horas}h / ${p.rpo_horas}h</td>
      <td style="font-size:12px;color:#555;">${estrategia}</td>
    </tr>`;
  }).join('');

  informeContenido.innerHTML = `
    <div class="informe-section" style="background:linear-gradient(135deg,#0d3d50,#1a5f7a);color:white;padding:32px;border-radius:16px;margin-bottom:28px;">
      <div style="font-family:var(--mono);font-size:10px;letter-spacing:0.15em;opacity:0.7;margin-bottom:8px;">INFORME BIA · BCP · DRP</div>
      <div style="font-size:26px;font-weight:700;margin-bottom:4px;">Análisis de Impacto de Negocio</div>
      <div style="font-size:14px;opacity:0.8;margin-bottom:20px;">${escapeHtml(datosFirma.empresa)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px;">
        ${[['RESPONSABLE',datosFirma.responsable],['FECHA',datosFirma.fecha],['ALCANCE',datosFirma.alcance||'Toda la organización'],['MARCO',fw.nombre_corto]].map(([k,v])=>`
        <div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:12px;">
          <div style="font-size:10px;opacity:0.6;font-family:var(--mono);margin-bottom:4px;">${k}</div>
          <div style="font-size:13px;font-weight:600;">${escapeHtml(v)}</div>
        </div>`).join('')}
      </div>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">Resumen Ejecutivo</div>
      <div class="resumen-grid">
        <div class="resumen-card"><div class="resumen-num" style="color:#1a5f7a;">${total}</div><div class="resumen-label">Procesos analizados</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:#991b1b;">${criticos}</div><div class="resumen-label">Procesos críticos</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:#92400e;">${altos}</div><div class="resumen-label">Alto impacto</div></div>
        <div class="resumen-card"><div class="resumen-num" style="color:#1e8449;">${pct}%</div><div class="resumen-label">Nivel documentación</div></div>
      </div>
      <div style="background:#f1f5f9;border-radius:10px;padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;font-family:var(--mono);font-size:11px;color:#6c7a8e;">
        <div>RTO promedio: <strong style="color:#1a5f7a;">${avgRTO}h</strong></div>
        <div>RPO promedio: <strong style="color:#2c9b6e;">${avgRPO}h</strong></div>
        <div>RTO mínimo: <strong>${rtoMin}h</strong></div><div>RTO máximo: <strong>${rtoMax}h</strong></div>
        <div>Procesos medio: <strong>${medios}</strong></div><div>Procesos bajo: <strong>${bajos}</strong></div>
        ${noAplican > 0 ? `<div>No aplica: <strong>${noAplican}</strong></div>` : ''}
      </div>
      <div style="margin-top:12px;"><span class="framework-badge ${fw.color}">${fw.nombre}</span>${fw.controles?`<div style="font-size:12px;color:#6c7a8e;margin-top:6px;">📋 ${escapeHtml(fw.controles)}</div>`:''}</div>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">Inventario de Procesos y RTO/RPO</div>
      <div style="overflow-x:auto;">
        <table class="proceso-table">
          <thead><tr><th>Proceso</th><th>Criticidad</th><th>RTO</th><th>RPO</th><th>Dependencias</th><th>Observaciones</th></tr></thead>
          <tbody>${filasProcesos}</tbody>
        </table>
      </div>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">Plan de Continuidad de Negocio (BCP)</div>
      <div style="background:#e8f4f8;border-left:3px solid #1a5f7a;border-radius:0 8px 8px 0;padding:12px 16px;font-size:13px;color:#555;margin-bottom:16px;">
        Prioridad de recuperación: procesos con criticidad <strong>Crítico</strong> y <strong>Alto</strong> primero. Dependencias críticas: <strong>${depsCriticas.length > 0 ? escapeHtml(depsCriticas.slice(0,5).join(', ')) : 'Ver tabla'}</strong>.
      </div>
      ${procCriticos.length > 0 ? `<div style="overflow-x:auto;"><table class="proceso-table"><thead><tr><th>Proceso</th><th>Criticidad</th><th>RTO/RPO</th><th>Estrategia de recuperación</th></tr></thead><tbody>${filasRecuperacion}</tbody></table></div>` : '<p style="color:#6c7a8e;font-size:13px;">No se han identificado procesos críticos o de alto impacto.</p>'}
    </div>
    <div class="informe-section">
      <div class="informe-section-title">Plan de Recuperación ante Desastres (DRP)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="background:#f9fbfd;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
          <div style="font-family:var(--mono);font-size:10px;color:#1a5f7a;margin-bottom:8px;">NIVELES DE ACTIVACIÓN</div>
          <div style="font-size:13px;line-height:1.8;color:#555;">1️⃣ <strong>Incidente menor</strong> — Recuperación en horas<br>2️⃣ <strong>Incidente mayor</strong> — Activar BCP<br>3️⃣ <strong>Desastre</strong> — DRP completo</div>
        </div>
        <div style="background:#f9fbfd;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
          <div style="font-family:var(--mono);font-size:10px;color:#1a5f7a;margin-bottom:8px;">CHECKLIST DE ACTIVACIÓN</div>
          <div style="font-size:13px;line-height:1.8;color:#555;">☐ Activar equipo (${escapeHtml(datosFirma.responsable)})<br>☐ Evaluar alcance<br>☐ Restaurar backups<br>☐ Validar recuperación<br>☐ Comunicar<br>☐ Documentar lecciones</div>
        </div>
      </div>
      <div style="margin-top:12px;background:#fff3cd;border-left:3px solid #f39c12;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12px;color:#856404;">⚠️ Documento orientativo. Revisar y adaptar antes de uso en producción.</div>
    </div>
    <div class="informe-section">
      <div class="informe-section-title">Próximos Pasos Recomendados</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
        ${[['📋','Validar con dirección','Revisión y aprobación formal del BIA.'],['🔄','Planificar simulacros','Ejercicios de recuperación para validar RTO/RPO.'],['📅','Revisión anual','Actualizar ante cambios o anualmente.'],['🔐','Integrar con SGSI',`Alinear con controles ${escapeHtml(fw.nombre_corto)}.`]].map(([ic,t,d])=>`
        <div style="background:#f9fbfd;border:1px solid #e2e8f0;border-radius:10px;padding:16px;font-size:13px;"><div style="font-size:20px;margin-bottom:8px;">${ic}</div><strong>${t}</strong><br><span style="color:#6c7a8e;">${d}</span></div>`).join('')}
      </div>
    </div>`;
}

function volverPreguntas() {
  mostrarPantalla('preguntas');
  // No re-renderizar — los event listeners ya existen
}

function nuevoAnalisis() {
  if (!confirm('¿Iniciar un nuevo análisis? Se perderán todos los datos.')) return;
  grupos = JSON.parse(JSON.stringify(config.grupos));
  grupos.forEach(g => g.procesos.forEach(p => { p._touched = false; p._noAplica = false; }));
  frameworkSeleccionado = 'iso22301';
  window.biaGrupos = grupos;
  window.frameworkSeleccionado = frameworkSeleccionado;
  datosFirma = { empresa: '', responsable: '', fecha: '', alcance: '', ubicaciones: '' };
  ['f-empresa','f-responsable','f-ubicaciones'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const fi = document.getElementById('f-fecha'); if (fi) fi.value = new Date().toISOString().split('T')[0];
  const as = document.getElementById('f-alcance'); if (as) as.value = '';
  document.querySelectorAll('.framework-card').forEach(c => c.classList.toggle('selected', c.dataset.framework === 'iso22301'));
  const fwD = config?.frameworks?.['iso22301'];
  const ht = document.getElementById('headerTag');
  if (fwD && ht) ht.textContent = fwD.tag;
  mostrarPantalla('inicio');
}