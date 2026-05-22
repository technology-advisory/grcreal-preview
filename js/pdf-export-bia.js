// pdf-export-bia.js · GRCreal · v4 · BIA/BCP/DRP
// Fixes: encoding →, nombres más largos, sin columna GRUPO, observaciones en tabla

function exportBiaPDF() {
  const procesos = window.todosLosProcesos ? window.todosLosProcesos() : [];
  const total = procesos.length;
  const procesoCompletoFn = window.procesoCompleto || (() => false);
  const completos = procesos.filter(p => procesoCompletoFn(p)).length;

  const conErrorRPO = procesos.filter(p => !p._noAplica && p.rpo_horas > p.rto_horas);
  if (conErrorRPO.length > 0) {
    alert(`⚠️ ${conErrorRPO.length} proceso(s) tienen RPO mayor que RTO. Corrígelos antes de exportar.`);
    return;
  }

  if (completos !== total) {
    if (!confirm(`⚠️ ${total - completos} procesos no están completamente documentados. ¿Exportar igualmente?`)) return;
  }

  const btn = document.getElementById('btnExportarPDF');
  if (btn) { btn.textContent = '⏳ Generando PDF...'; btn.disabled = true; }

  const run = () => {
    try {
      generateBiaPDF(window.jspdf.jsPDF);
    } catch (e) {
      console.error('Error generando PDF:', e);
      alert('Error al generar el PDF. Revisa la consola para más detalles.');
    } finally {
      if (btn) { btn.textContent = '⬇ Exportar PDF'; btn.disabled = false; }
    }
  };

  if (window.jspdf && window.jspdf.jsPDF) { run(); return; }
  const iv = setInterval(() => {
    if (window.jspdf && window.jspdf.jsPDF) { clearInterval(iv); run(); }
  }, 100);
  setTimeout(() => {
    clearInterval(iv);
    if (btn && btn.disabled) {
      alert('La librería PDF no está disponible. Recarga la página.');
      btn.textContent = '⬇ Exportar PDF';
      btn.disabled = false;
    }
  }, 5000);
}

function _drawArc(doc, cx, cy, r, startDeg, endDeg, color, lineWidth) {
  const steps = 60;
  const start = (startDeg - 90) * Math.PI / 180;
  const end   = (endDeg   - 90) * Math.PI / 180;
  doc.setDrawColor(...color);
  doc.setLineWidth(lineWidth);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const angle = start + (end - start) * (i / steps);
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
  }
}

function _pctByGroup(grupos, grupoId, procesoCompletoFn) {
  const grupo = grupos.find(g => g.id === grupoId);
  if (!grupo || grupo.procesos.length === 0) return 0;
  const completos = grupo.procesos.filter(p => procesoCompletoFn(p)).length;
  return Math.round((completos / grupo.procesos.length) * 100);
}

function _safeMin(arr) { return arr.length > 0 ? Math.min(...arr) : 0; }
function _safeMax(arr) { return arr.length > 0 ? Math.max(...arr) : 0; }

// FIX: reemplazar caracteres no-latin1 que jsPDF no renderiza bien
function _safePdfText(str) {
  if (!str) return '';
  return str
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[^\x00-\xFF]/g, '?');
}

// Truncar con sufijo, respetando longitud máxima
function _trunc(str, max, suffix = '...') {
  if (!str) return '';
  str = _safePdfText(str);
  return str.length > max ? str.substring(0, max - suffix.length) + suffix : str;
}

function generateBiaPDF(jsPDF) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const procesos = window.todosLosProcesos ? window.todosLosProcesos() : [];
  const grupos   = window.biaGrupos || [];
  const datosOrg = window.datosOrganizacion || {};
  const frameworkKey = window.frameworkSeleccionado || 'iso22301';
  const frameworks   = window.biaConfig?.frameworks || {};
  const framework    = frameworks[frameworkKey] || { nombre: 'ISO 22301:2019', nombre_corto: 'ISO 22301' };
  const procesoCompletoFn = window.procesoCompleto || (() => false);

  // Separar activos y N/A
  const activos  = procesos.filter(p => !p._noAplica);
  const noAplica = procesos.filter(p => p._noAplica);

  const total      = procesos.length;
  const completados = procesos.filter(p => procesoCompletoFn(p)).length;
  const pendientes  = total - completados;
  const pct         = total > 0 ? Math.round((completados / total) * 100) : 0;

  const criticos = activos.filter(p => p.critico === 'critico').length;
  const altos    = activos.filter(p => p.critico === 'alto').length;
  const medios   = activos.filter(p => p.critico === 'medio').length;
  const bajos    = activos.filter(p => p.critico === 'bajo').length;

  const avgRTO = activos.length > 0 ? Math.round(activos.reduce((s, p) => s + p.rto_horas, 0) / activos.length) : 0;
  const avgRPO = activos.length > 0 ? Math.round(activos.reduce((s, p) => s + p.rpo_horas, 0) / activos.length) : 0;
  const rtoMin = _safeMin(activos.map(p => p.rto_horas));
  const rtoMax = _safeMax(activos.map(p => p.rto_horas));
  const rpoMin = _safeMin(activos.map(p => p.rpo_horas));
  const rpoMax = _safeMax(activos.map(p => p.rpo_horas));

  const hoy      = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fileName = `GRCreal_BIA_${_safePdfText(datosOrg.empresa || 'empresa').replace(/\s+/g, '_')}_${hoy.replace(/\//g, '-')}.pdf`;

  const C = {
    azulDark:  [13,  61,  80],
    azul:      [26,  95, 122],
    azulMid:   [45, 122, 154],
    azulLight: [232, 244, 248],
    verde:     [15, 110,  86],
    verdeLight:[225, 245, 238],
    rojo:      [153,  60,  29],
    rojoLight: [250, 236, 231],
    naranja:   [180, 100,  40],
    grisLight: [248, 250, 252],
    grisBorde: [226, 232, 240],
    gris:      [100, 116, 139],
    grisNa:    [180, 190, 200],
    texto:     [30,  41,  59],
    blanco:    [255, 255, 255],
  };

  const M  = 16;
  const CW = 210 - M * 2;
  let y    = 0;

  // ══════════════════════════════════════════════
  // CABECERA
  // ══════════════════════════════════════════════
  doc.setFillColor(...C.azulDark);
  doc.rect(0, 0, 210, 52, 'F');

  doc.setTextColor(...C.blanco);
  doc.setFontSize(26); doc.setFont('helvetica', 'bold');
  doc.text('GRCreal', M, 20);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 225);
  doc.text('grcreal.com', M, 27);

  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.roundedRect(148, 8, 46, 18, 3, 3, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));
  doc.setTextColor(180, 210, 225); doc.setFontSize(6.5);
  doc.text('Herramienta GRC', 171, 14, { align: 'center' });
  doc.setTextColor(...C.blanco); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('BIA · BCP · DRP', 171, 21.5, { align: 'center' });

  doc.setTextColor(...C.blanco); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text('Análisis de Impacto de Negocio — Continuidad', M, 37);
  doc.setFontSize(7.5); doc.setTextColor(140, 185, 205);
  doc.text(`Organización: ${_safePdfText(datosOrg.empresa) || 'No especificada'}`, M, 43.5);
  doc.setLineWidth(0.3); doc.setDrawColor(45, 122, 154);
  doc.line(M, 47, 210 - M, 47);
  doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 160, 180);
  doc.text('Documento orientativo — sin valor legal ni regulatorio — Datos no almacenados', M, 50.5);

  y = 62;

  // ══════════════════════════════════════════════
  // KPI CARDS
  // ══════════════════════════════════════════════
  const kpis = [
    { val: String(total),       label: 'TOTAL PROCESOS', color: C.gris  },
    { val: String(completados), label: 'COMPLETADOS',    color: C.verde },
    { val: String(pendientes),  label: 'PENDIENTES',     color: C.rojo  },
    { val: pct + '%',           label: 'CUMPLIMIENTO',   color: C.azul  },
  ];
  const cardW = (CW - 9) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (cardW + 3);
    doc.setFillColor(...C.grisLight);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F');
    doc.setDrawColor(...C.grisBorde); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'S');
    doc.setTextColor(...k.color); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(k.val, x + cardW / 2, y + 12, { align: 'center' });
    doc.setTextColor(...C.gris); doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(k.label, x + cardW / 2, y + 18.5, { align: 'center' });
  });
  y += 30;

  // ══════════════════════════════════════════════
  // BARRA PROGRESO
  // ══════════════════════════════════════════════
  doc.setTextColor(...C.gris); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
  doc.text('NIVEL DE CUMPLIMIENTO DEL BIA', M, y);
  doc.setTextColor(...C.azul); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text(pct + '%', 210 - M, y, { align: 'right' });
  y += 4;
  doc.setFillColor(...C.grisBorde); doc.roundedRect(M, y, CW, 5, 2.5, 2.5, 'F');
  if (pct > 0) { doc.setFillColor(...C.azul); doc.roundedRect(M, y, (CW * pct) / 100, 5, 2.5, 2.5, 'F'); }
  y += 10;

  let nivelLabel, nivelBg, nivelTx;
  if (pct >= 80)      { nivelLabel = 'BIA completo — Documentación robusta. Listo para auditoría.';  nivelBg = C.azulLight;     nivelTx = C.azul;  }
  else if (pct >= 60) { nivelLabel = 'BIA avanzado — Buen nivel. Procesos mayormente definidos.';     nivelBg = C.verdeLight;    nivelTx = C.verde; }
  else if (pct >= 40) { nivelLabel = 'BIA en progreso — Mas de la mitad documentado.';                nivelBg = [255, 251, 235]; nivelTx = [146, 64, 14]; }
  else                { nivelLabel = 'BIA inicial — Requiere completar los procesos pendientes.';      nivelBg = C.rojoLight;     nivelTx = C.rojo;  }

  doc.setFillColor(...nivelBg); doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
  doc.setTextColor(...nivelTx); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(nivelLabel, M + CW / 2, y + 5.5, { align: 'center' });
  y += 14;

  // ══════════════════════════════════════════════
  // DATOS ORG + MÉTRICAS + DONUT + BARRAS GRUPO
  // ══════════════════════════════════════════════
  const sectionY = y;
  const colW     = (CW - 6) / 2;

  // — Datos organización —
  doc.setTextColor(...C.azul); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA ORGANIZACIÓN', M + colW / 2, sectionY + 4, { align: 'center' });

  const orgData = [
    ['Responsable',    _safePdfText(datosOrg.responsable) || '—'],
    ['Fecha análisis', datosOrg.fecha || hoy],
    ['Alcance',        _safePdfText(datosOrg.alcance) || 'Toda la organización'],
    ['Sedes',          _safePdfText(datosOrg.ubicaciones) || '—'],
    ['Marco',          framework.nombre_corto],
  ];
  let orgY = sectionY + 10;
  orgData.forEach(([label, val]) => {
    doc.setTextColor(...C.gris); doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(label + ':', M + 4, orgY);
    doc.setTextColor(...C.texto); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text(_trunc(val, 32), M + 4, orgY + 4);
    orgY += 10;
  });

  // — Métricas RTO/RPO —
  const metricsY = orgY + 2;
  doc.setTextColor(...C.azul); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('MÉTRICAS RTO / RPO', M + colW / 2, metricsY, { align: 'center' });
  doc.setFillColor(...C.grisLight); doc.roundedRect(M, metricsY + 3, colW, 26, 2, 2, 'F');
  doc.setTextColor(...C.texto); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
  doc.text(`RTO promedio: ${avgRTO}h`, M + 4, metricsY + 9);
  doc.text(`RTO minimo: ${rtoMin}h`,   M + 4, metricsY + 14);
  doc.text(`RTO maximo: ${rtoMax}h`,   M + 4, metricsY + 19);
  doc.text(`RPO promedio: ${avgRPO}h`, M + colW / 2 + 4, metricsY + 9);
  doc.text(`RPO minimo: ${rpoMin}h`,   M + colW / 2 + 4, metricsY + 14);
  doc.text(`RPO maximo: ${rpoMax}h`,   M + colW / 2 + 4, metricsY + 19);

  // — Donut criticidad —
  const donutCX = M + colW + 6 + colW / 4;
  const donutCY = sectionY + 30;
  const donutR  = 18;
  const donutW  = 7;

  const donutData = [
    { count: criticos, color: C.rojo,    label: 'Critico' },
    { count: altos,    color: C.naranja, label: 'Alto'    },
    { count: medios,   color: [211,84,0],label: 'Medio'   },
    { count: bajos,    color: C.verde,   label: 'Bajo'    },
  ];

  doc.setTextColor(...C.azul); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUCIÓN POR CRITICIDAD', M + colW + 6 + colW / 2, sectionY + 4, { align: 'center' });

  // Fondo donut (siempre visible)
  doc.setDrawColor(...C.grisBorde); doc.setLineWidth(donutW);
  _drawArc(doc, donutCX, donutCY, donutR, 0, 360, C.grisBorde, donutW);

  let startAngle = 0;
  donutData.forEach(d => {
    if (d.count === 0 || activos.length === 0) return;
    const sweep = (d.count / activos.length) * 360;
    _drawArc(doc, donutCX, donutCY, donutR, startAngle, startAngle + sweep, d.color, donutW);
    startAngle += sweep;
  });

  // Centro donut
  doc.setFillColor(...C.blanco);
  doc.circle(donutCX, donutCY, donutR - donutW / 2 - 0.5, 'F');
  doc.setTextColor(...C.azulDark); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text(String(activos.length), donutCX, donutCY + 1, { align: 'center' });
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.gris);
  doc.text('procesos', donutCX, donutCY + 5.5, { align: 'center' });

  // Leyenda donut
  const legX = M + colW + 6 + colW / 2 + donutR + 4;
  let legY   = donutCY - 14;
  donutData.forEach(d => {
    doc.setFillColor(...d.color); doc.rect(legX, legY, 3, 3, 'F');
    doc.setTextColor(...C.texto); doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(`${d.label}: ${d.count}`, legX + 5, legY + 2.5);
    legY += 7;
  });
  if (noAplica.length > 0) {
    doc.setFillColor(...C.grisNa); doc.rect(legX, legY, 3, 3, 'F');
    doc.setTextColor(...C.gris);
    doc.text(`N/A: ${noAplica.length}`, legX + 5, legY + 2.5);
  }

  // — Barras cumplimiento por grupo —
  const colRX    = M + colW + 6;
  const grupoBarY = donutCY + donutR + 8;
  doc.setTextColor(...C.azul); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('CUMPLIMIENTO POR GRUPO', colRX + colW / 2, grupoBarY, { align: 'center' });

  const gruposList = [
    { id: 'ti',      name: 'Tecnología & Infraestructura' },
    { id: 'negocio', name: 'Negocio & Operaciones'        },
    { id: 'soporte', name: 'Soporte & Cumplimiento'       },
  ];

  const barAreaW = colW - 4;
  const labelBarW = 42;
  const barFillW  = barAreaW - labelBarW - 14;
  const barH2     = 4;
  let   barY      = grupoBarY + 6;

  gruposList.forEach(gr => {
    const cpct      = _pctByGroup(grupos, gr.id, procesoCompletoFn);
    const fillColor = cpct >= 80 ? C.verde : cpct >= 50 ? C.azul : C.rojo;
    doc.setTextColor(...C.texto); doc.setFontSize(6); doc.setFont('helvetica', 'normal');
    doc.text(_trunc(gr.name, 22, '.'), colRX, barY + barH2 - 0.5);
    const bx = colRX + labelBarW;
    doc.setFillColor(...C.grisBorde); doc.roundedRect(bx, barY, barFillW, barH2, 2, 2, 'F');
    if (cpct > 0) { doc.setFillColor(...fillColor); doc.roundedRect(bx, barY, (barFillW * cpct) / 100, barH2, 2, 2, 'F'); }
    doc.setTextColor(...C.gris); doc.setFontSize(6.5);
    doc.text(cpct + '%', bx + barFillW + 3, barY + barH2 - 0.5);
    barY += 11;
  });

  y = Math.max(metricsY + 32, barY) + 14;

  // ══════════════════════════════════════════════
  // TABLA DE PROCESOS
  // Columnas: PROCESO | CRITICIDAD | RTO | RPO | DEPENDENCIAS | OBSERVACIONES
  // FIX: sin columna GRUPO (espacio recuperado para nombres y observaciones)
  // FIX: nombre truncado a 35 chars, observaciones incluidas
  // ══════════════════════════════════════════════
  doc.setFillColor(...C.azulLight); doc.rect(M, y, CW, 0.5, 'F');
  y += 5;
  doc.setTextColor(...C.azul); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE PROCESOS EVALUADOS', M, y);
  y += 6;

  // Anchos de columna (sin GRUPO, total CW = 178mm)
  // PROCESO=68 | CRITIC=18 | RTO=14 | RPO=14 | DEPS=36 | OBS=28
  const COL = { proceso: 68, critico: 18, rto: 14, rpo: 14, deps: 36, obs: 28 };
  const xC  = {
    proceso: M + 4,
    critico: M + COL.proceso + 4,
    rto:     M + COL.proceso + COL.critico + 4,
    rpo:     M + COL.proceso + COL.critico + COL.rto + 4,
    deps:    M + COL.proceso + COL.critico + COL.rto + COL.rpo + 4,
    obs:     M + COL.proceso + COL.critico + COL.rto + COL.rpo + COL.deps + 4,
  };

  const drawTableHeader = () => {
    doc.setFillColor(...C.azulDark); doc.rect(M, y, CW, 8, 'F');
    doc.setTextColor(...C.blanco); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text('PROCESO',      xC.proceso,  y + 5.5);
    doc.text('CRITIC.',      xC.critico,  y + 5.5);
    doc.text('RTO',          xC.rto,      y + 5.5);
    doc.text('RPO',          xC.rpo,      y + 5.5);
    doc.text('DEPENDENCIAS', xC.deps,     y + 5.5);
    doc.text('OBSERV.',      xC.obs,      y + 5.5);
    y += 10;
  };

  drawTableHeader();

  const criticidadLabel = { critico: 'CRIT', alto: 'ALTO', medio: 'MEDIO', bajo: 'BAJO' };
  const criticidadColor = { critico: C.rojo, alto: C.naranja, medio: [180, 110, 30], bajo: C.verde };

  let rowAlt = false;

  for (const grupo of grupos) {
    // Cabecera de grupo en tabla
    if (y + 6 > 278) { doc.addPage(); y = 16; drawTableHeader(); rowAlt = false; }
    doc.setFillColor(232, 240, 248); doc.rect(M, y, CW, 6, 'F');
    doc.setTextColor(...C.azul); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text(_safePdfText(`${grupo.icono ? '' : ''}${grupo.titulo}`), M + 4, y + 4.5);
    y += 6;

    for (const p of grupo.procesos) {
      // Filas con observaciones pueden ser más altas
      const tieneObs = p.observaciones && p.observaciones.trim().length > 0;
      const rowH = tieneObs ? 10 : 7;

      if (y + rowH > 278) { doc.addPage(); y = 16; drawTableHeader(); rowAlt = false; }

      if (rowAlt) { doc.setFillColor(...C.grisLight); doc.rect(M, y, CW, rowH, 'F'); }

      if (p._noAplica) {
        // Fila N/A
        doc.setFontSize(6); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.grisNa);
        doc.text(_trunc(p.nombre, 35), xC.proceso, y + (rowH / 2) + 1);
        doc.text('N/A', xC.critico, y + (rowH / 2) + 1);
      } else {
        // Nombre — FIX: 35 chars en lugar de 24
        doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.texto);
        doc.text(_trunc(p.nombre, 35), xC.proceso, y + 5);

        // Criticidad
        doc.setFontSize(6); doc.setFont('helvetica', 'bold');
        doc.setTextColor(...(criticidadColor[p.critico] || C.gris));
        doc.text(criticidadLabel[p.critico] || p.critico, xC.critico, y + 5);

        // RTO / RPO
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.texto);
        doc.text(`${p.rto_horas}h`, xC.rto, y + 5);
        doc.text(`${p.rpo_horas}h`, xC.rpo, y + 5);

        // Dependencias
        let deps = (p.dependencias || []).slice(0, 2).join(', ');
        if ((p.dependencias || []).length > 2) deps += '...';
        doc.setTextColor(...C.gris);
        doc.text(_trunc(deps || '-', 22), xC.deps, y + 5);

        // Observaciones — FIX: columna nueva
        if (tieneObs) {
          doc.setFontSize(5.5); doc.setTextColor(...C.gris);
          doc.text(_trunc(p.observaciones, 28), xC.obs, y + 4);
        } else {
          doc.setFontSize(5.5); doc.setTextColor(...C.grisBorde);
          doc.text('-', xC.obs, y + 5);
        }
      }

      doc.setDrawColor(...C.grisBorde); doc.setLineWidth(0.2);
      doc.line(M, y + rowH, M + CW, y + rowH);
      y += rowH;
      rowAlt = !rowAlt;
    }
  }

  // ══════════════════════════════════════════════
  // BCP
  // ══════════════════════════════════════════════
  if (y > 250) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFillColor(...C.azulLight); doc.rect(M, y, CW, 0.5, 'F');
  y += 5;
  doc.setTextColor(...C.azul); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('ESTRATEGIA DE CONTINUIDAD (BCP)', M, y);
  y += 6;

  const procCriticos  = activos.filter(p => p.critico === 'critico').map(p => p.nombre);
  const depsCriticas  = [...new Set(activos.filter(p => p.critico === 'critico').flatMap(p => p.dependencias || []))];
  const simulacroMeses = Math.max(1, Math.min(3, Math.floor(avgRTO / 24) || 1));

  doc.setFillColor(...C.grisLight); doc.roundedRect(M, y, CW, 38, 3, 3, 'F');
  doc.setTextColor(...C.texto); doc.setFontSize(7); doc.setFont('helvetica', 'normal');

  let textY = y + 6;
  const bcpL1 = `Prioridad de recuperación: ${procCriticos.length > 0 ? procCriticos.slice(0, 3).join(', ') : 'Sin procesos críticos definidos'}`;
  const bcpL2 = `Dependencias críticas: ${depsCriticas.length > 0 ? depsCriticas.slice(0, 4).join(', ') : 'Ver detalle de procesos'}`;
  doc.text(_trunc(bcpL1, 100, '...'), M + 6, textY); textY += 5;
  doc.text(_trunc(bcpL2, 100, '...'), M + 6, textY); textY += 5;
  doc.text(`Backup: verificar que las copias cumplen RPO de ${avgRPO}h como maximo`, M + 6, textY); textY += 5;
  doc.text(`Simulacros: programar en los proximos ${simulacroMeses} meses para validar RTO/RPO`, M + 6, textY); textY += 5;
  doc.text(`Marco normativo de referencia: ${_safePdfText(framework.nombre)}`, M + 6, textY);

  y += 48;

  // ══════════════════════════════════════════════
  // DRP
  // FIX: separadores → sustituidos por -> en texto fijo
  // ══════════════════════════════════════════════
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(...C.azulLight); doc.rect(M, y, CW, 0.5, 'F');
  y += 5;
  doc.setTextColor(...C.azul); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('PLAN DE RECUPERACIÓN ANTE DESASTRES (DRP)', M, y);
  y += 6;

  doc.setFillColor(...C.grisLight); doc.roundedRect(M, y, CW, 34, 3, 3, 'F');
  doc.setTextColor(...C.texto); doc.setFontSize(7); doc.setFont('helvetica', 'normal');

  textY = y + 6;
  doc.text(`Responsable: ${_safePdfText(datosOrg.responsable) || 'No asignado'}  |  Alcance: ${_safePdfText(datosOrg.alcance) || 'Toda la organización'}`, M + 6, textY); textY += 5;
  doc.text('Nivel 1 — Incidente menor: impacto localizado, recuperación en horas.', M + 6, textY); textY += 5;
  doc.text('Nivel 2 — Incidente mayor: afecta procesos críticos, activar BCP inmediatamente.', M + 6, textY); textY += 5;
  doc.text('Nivel 3 — Desastre: perdida de instalaciones o sistemas core, DRP completo.', M + 6, textY); textY += 5;
  // FIX: → reemplazado por -> directamente en el string
  doc.text('Checklist: Activar equipo -> Evaluar alcance -> Restaurar backup -> Validar -> Comunicar -> Documentar', M + 6, textY);

  y += 44;

  _drawBiaFooter(doc, C, hoy, datosOrg.empresa, framework.nombre_corto);
  doc.save(fileName);
}

function _drawBiaFooter(doc, C, fecha, empresa, framework) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.azulDark); doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(140, 185, 205); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text('GRCreal · grcreal.com · BIA/BCP/DRP · Documento orientativo · Datos no almacenados', 16, 293);
    doc.setTextColor(120, 160, 180);
    doc.text(
      `${fecha}  |  ${_safePdfText(framework) || 'ISO 22301'}  |  ${_safePdfText(empresa) || 'Organización'}  |  Pag. ${i} de ${pages}`,
      210 - 16, 293, { align: 'right' }
    );
  }
}