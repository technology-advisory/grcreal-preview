// pdf-export.js · GRCreal · Diseño corporativo v3
// CORREGIDO: Soporta texto multilínea en las preguntas (no se cortan)

function exportPDF() {
  let items = document.querySelectorAll('.checklist-item');
  if (items.length === 0) {
    items = document.querySelectorAll('.checklist-item-vertical');
  }
  
  let completedCount = 0;
  items.forEach(item => {
    if (item.querySelector('.sel-si.active') || item.querySelector('.sel-no.active')) completedCount++;
  });
  const total = items.length;
  if (completedCount !== total) {
    alert(`⚠️ No puedes exportar. Faltan ${total - completedCount} controles por completar.`);
    return;
  }
  const btn = document.querySelector('.pdf-btn');
  if (btn) { btn.textContent = '⏳ Generando...'; btn.disabled = true; }

  const run = () => {
    generatePDF(window.jspdf.jsPDF);
    if (btn) { btn.textContent = '⬇ Exportar PDF'; btn.disabled = false; }
  };

  if (window.jspdf && window.jspdf.jsPDF) { run(); return; }
  const iv = setInterval(() => {
    if (window.jspdf && window.jspdf.jsPDF) { clearInterval(iv); run(); }
  }, 100);
  setTimeout(() => {
    clearInterval(iv);
    if (btn && btn.disabled) {
      alert('La librería PDF no está disponible.');
      btn.textContent = '⬇ Exportar PDF'; btn.disabled = false;
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

function _clauseNum(code) {
  const m = code.trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}

function _pctByClause(items, clauseNums) {
  let impl = 0, total = 0;
  items.forEach(item => {
    const code = (item.querySelector('.checklist-code')?.textContent || '').trim();
    if (!clauseNums.includes(_clauseNum(code))) return;
    total++;
    if (item.querySelector('.sel-si.active')) impl++;
  });
  return total > 0 ? Math.round((impl / total) * 100) : 0;
}

function detectarNorma() {
  const src      = (typeof window._checklistSrc === 'string') ? window._checklistSrc : '';
  const dataNorma= (document.body && document.body.getAttribute('data-norma')) ? document.body.getAttribute('data-norma') : '';
  const url      = window.location.pathname || '';
  const ref = [src, dataNorma, url].join(' ').toLowerCase();
  console.log('🔍 detectarNorma ref:', ref);

  if (ref.includes('mapeo'))    return 'Mapeo NIS2/ISO27001/ENS/DORA';
  if (ref.includes('iso42001')) return 'ISO 42001:2023';
  if (ref.includes('iso27001')) return 'ISO 27001:2022';
  if (ref.includes('iso22301')) return 'ISO 22301:2019';
  if (ref.includes('nis2'))     return 'NIS2 Directive';
  if (ref.includes('dora'))     return 'DORA (UE 2022/2554)';
  if (ref.includes('ens')) {
    const activeTab = document.querySelector('.tab-btn.active');
    const tab = activeTab ? activeTab.getAttribute('data-tab') : '';
    if (tab === 'media') return 'ENS - Nivel Medio';
    if (tab === 'alta')  return 'ENS - Nivel Alto';
    return 'ENS - Nivel Básico';
  }
  return 'GRCreal Checklist';
}

function getFileNameBase(norma) {
  if (norma.includes('Mapeo'))     return 'GRCreal_Mapeo';
  if (norma.includes('ISO 27001')) return 'GRCreal_ISO27001';
  if (norma.includes('ISO 42001')) return 'GRCreal_ISO42001';
  if (norma.includes('ISO 22301')) return 'GRCreal_ISO22301';
  if (norma.includes('NIS2'))      return 'GRCreal_NIS2';
  if (norma.includes('DORA'))      return 'GRCreal_DORA';
  if (norma.includes('ENS')) {
    if (norma.includes('Básico')) return 'GRCreal_ENS_Basica';
    if (norma.includes('Medio'))  return 'GRCreal_ENS_Media';
    if (norma.includes('Alto'))   return 'GRCreal_ENS_Alta';
    return 'GRCreal_ENS';
  }
  return 'GRCreal_Checklist';
}

function generatePDF(jsPDF) {
  let items = document.querySelectorAll('.checklist-item');
  let isVerticalFormat = false;
  if (items.length === 0) {
    items = document.querySelectorAll('.checklist-item-vertical');
    isVerticalFormat = true;
  }
  
  const NORMA = detectarNorma();
  const FILE_BASE = getFileNameBase(NORMA);
  
  console.log('📄 Norma detectada:', NORMA);
  console.log('📁 Formato vertical:', isVerticalFormat);
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  let implementados = 0, noImplementados = 0;
  items.forEach(item => {
    if (item.querySelector('.sel-si.active')) implementados++;
    if (item.querySelector('.sel-no.active')) noImplementados++;
  });
  const total = items.length;
  const pct = total > 0 ? Math.round((implementados / total) * 100) : 0;
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fileName = `${FILE_BASE}_${today.replace(/\//g, '-')}.pdf`;

  const C = {
    azulDark:  [13,  61,  80],
    azul:      [26,  95, 122],
    azulMid:   [45, 122, 154],
    azulLight: [232, 244, 248],
    verde:     [15, 110,  86],
    verdeLight:[225, 245, 238],
    rojo:      [153,  60,  29],
    rojoLight: [250, 236, 231],
    grisLight: [248, 250, 252],
    grisBorde: [226, 232, 240],
    gris:      [100, 116, 139],
    texto:     [30,  41,  59],
    blanco:    [255, 255, 255],
  };

  const M = 16;
  const CW = 210 - M * 2;
  let y = 0;

  // CABECERA
  doc.setFillColor(...C.azulDark);
  doc.rect(0, 0, 210, 52, 'F');

  doc.setTextColor(...C.blanco);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('GRCreal', M, 20);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 210, 225);
  doc.text('grcreal.com', M, 27);

  doc.setFillColor(255, 255, 255);
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.roundedRect(148, 8, 46, 18, 3, 3, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));
  doc.setTextColor(180, 210, 225);
  doc.setFontSize(6.5);
  doc.text('Norma de referencia', 171, 14, { align: 'center' });
  doc.setTextColor(...C.blanco);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(NORMA, 171, 21.5, { align: 'center' });

  doc.setTextColor(...C.blanco);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let descripcion = 'Informe de autoevaluación';
  if (NORMA.includes('ISO 27001')) descripcion += ' — Sistema de Gestión de Seguridad de la Información';
  else if (NORMA.includes('NIS2')) descripcion += ' — Directiva NIS2 Article 21';
  else if (NORMA.includes('DORA')) descripcion += ' — Resiliencia Operativa Digital';
  else if (NORMA.includes('ENS')) descripcion += ' — Esquema Nacional de Seguridad';
  else if (NORMA.includes('ISO 22301')) descripcion += ' — Continuidad de Negocio';
  else if (NORMA.includes('ISO 42001')) descripcion += ' — Gobernanza de Inteligencia Artificial';
  else if (NORMA.includes('Mapeo')) descripcion += ' — Mapeo multi-marco';
  
  doc.text(descripcion, M, 37);
  doc.setFontSize(7.5);
  doc.setTextColor(140, 185, 205);
  doc.text('Evaluación realizada: ' + today, M, 43.5);
  doc.setLineWidth(0.3);
  doc.setDrawColor(45, 122, 154);
  doc.line(M, 47, 210 - M, 47);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 160, 180);
  doc.text('Documento orientativo — sin valor legal ni regulatorio — Datos no almacenados', M, 50.5);

  y = 62;

  // KPI CARDS
  const kpis = [
    { val: String(total),           label: 'TOTAL CONTROLES',  color: C.gris  },
    { val: String(implementados),   label: isVerticalFormat ? 'RESPUESTAS SÍ' : 'IMPLEMENTADOS',    color: C.verde },
    { val: String(noImplementados), label: isVerticalFormat ? 'RESPUESTAS NO' : 'NO IMPLEMENTADOS', color: C.rojo  },
    { val: pct + '%',               label: 'CUMPLIMIENTO',     color: C.azul  },
  ];
  const cardW = (CW - 9) / 4;
  kpis.forEach((k, i) => {
    const x = M + i * (cardW + 3);
    doc.setFillColor(...C.grisLight);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'F');
    doc.setDrawColor(...C.grisBorde);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, 22, 3, 3, 'S');
    doc.setTextColor(...k.color);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(k.val, x + cardW / 2, y + 12, { align: 'center' });
    doc.setTextColor(...C.gris);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(k.label, x + cardW / 2, y + 18.5, { align: 'center' });
  });

  y += 30;

  // BARRA DE PROGRESO
  doc.setTextColor(...C.gris);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('NIVEL DE CUMPLIMIENTO GLOBAL', M, y);
  doc.setTextColor(...C.azul);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(pct + '%', 210 - M, y, { align: 'right' });
  y += 4;
  doc.setFillColor(...C.grisBorde);
  doc.roundedRect(M, y, CW, 5, 2.5, 2.5, 'F');
  if (pct > 0) {
    doc.setFillColor(...C.azul);
    doc.roundedRect(M, y, (CW * pct) / 100, 5, 2.5, 2.5, 'F');
  }
  y += 10;

  let nivelLabel, nivelBg, nivelTx;
  if (pct >= 80)      { nivelLabel = 'Cumplimiento avanzado — Sistema sólido. Alineado con la norma.';    nivelBg = C.azulLight;  nivelTx = C.azul; }
  else if (pct >= 60) { nivelLabel = 'Cumplimiento destacado — Buen nivel. Mejoras puntuales.';             nivelBg = C.verdeLight; nivelTx = C.verde; }
  else if (pct >= 30) { nivelLabel = 'Cumplimiento parcial — Base establecida. Oportunidades de mejora.';  nivelBg = [254,243,199]; nivelTx = [146,64,14]; }
  else                { nivelLabel = 'Cumplimiento inicial — En progreso. Implementación en marcha.';       nivelBg = C.rojoLight;  nivelTx = C.rojo; }

  doc.setFillColor(...nivelBg);
  doc.roundedRect(M, y - 4, CW, 8, 2, 2, 'F');
  doc.setTextColor(...nivelTx);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(nivelLabel, M + 4, y + 0.5);

  y += 14;

  // DOS COLUMNAS
  const colW = (CW - 6) / 2;

  doc.setFillColor(...C.azulLight);
  doc.rect(M, y, CW, 0.5, 'F');
  y += 5;
  const sectionY = y;

  const donutCX = M + colW / 2;
  const donutCY = sectionY + 34;
  const donutR  = 16;
  const trackW  = 4.5;

  doc.setTextColor(...C.azul);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUCIÓN DE ESTADO', M + colW / 2, sectionY + 4, { align: 'center' });

  _drawArc(doc, donutCX, donutCY, donutR, 0, 360, C.grisBorde, trackW);

  if (implementados > 0) {
    _drawArc(doc, donutCX, donutCY, donutR, 0, (implementados / total) * 360, C.azul, trackW);
  }
  if (noImplementados > 0) {
    _drawArc(doc, donutCX, donutCY, donutR,
      (implementados / total) * 360,
      360,
      [200, 120, 90], trackW);
  }

  doc.setTextColor(...C.azul);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(pct + '%', donutCX, donutCY + 2.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gris);
  doc.text('global', donutCX, donutCY + 7, { align: 'center' });

  const legY = sectionY + 56;
  doc.setFillColor(...C.azul);
  doc.roundedRect(M + 8, legY - 2.5, 5, 3, 0.5, 0.5, 'F');
  doc.setTextColor(...C.gris);
  doc.setFontSize(6.5);
  
  if (isVerticalFormat) {
    doc.text('Sí (' + implementados + ')', M + 15, legY);
    doc.setFillColor(200, 120, 90);
    doc.roundedRect(M + 8, legY + 3.5, 5, 3, 0.5, 0.5, 'F');
    doc.text('No (' + noImplementados + ')', M + 15, legY + 6);
  } else {
    doc.text('Implementado (' + implementados + ')', M + 15, legY);
    doc.setFillColor(200, 120, 90);
    doc.roundedRect(M + 8, legY + 3.5, 5, 3, 0.5, 0.5, 'F');
    doc.text('No implementado (' + noImplementados + ')', M + 15, legY + 6);
  }

  // RESUMEN COLUMNA DERECHA
  const colRX = M + colW + 6;
  doc.setTextColor(...C.azul);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN', colRX + colW / 2, sectionY + 4, { align: 'center' });
  
  doc.setTextColor(...C.texto);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Total controles: ' + total, colRX, sectionY + 18);
  if (isVerticalFormat) {
    doc.text('Respuestas "Sí": ' + implementados, colRX, sectionY + 26);
    doc.text('Respuestas "No": ' + noImplementados, colRX, sectionY + 34);
  } else {
    doc.text('Implementados: ' + implementados, colRX, sectionY + 26);
    doc.text('No implementados: ' + noImplementados, colRX, sectionY + 34);
  }
  doc.text('Tasa cumplimiento: ' + pct + '%', colRX, sectionY + 42);

  y = Math.max(donutCY + 30, sectionY + 56) + 8;

  // TABLA DE CONTROLES (MULTILÍNEA)
  doc.setFillColor(...C.azulLight);
  doc.rect(M, y, CW, 0.5, 'F');
  y += 5;
  doc.setTextColor(...C.azul);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE CONTROLES EVALUADOS', M, y);
  y += 6;

  doc.setFillColor(...C.azulDark);
  doc.rect(M, y, CW, 8, 'F');
  doc.setTextColor(...C.blanco);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CÓDIGO', M + 4, y + 5.5);
  doc.text('CONTROL', M + 24, y + 5.5);
  doc.text('ESTADO', M + CW - 22, y + 5.5);
  y += 10;
  doc.setFont('helvetica', 'normal');
  let rowAlt = false;
  
  const textoSi = isVerticalFormat ? 'Sí' : 'Implementado';
  const textoNo = isVerticalFormat ? 'No' : 'No implementado';
  const colorSi = isVerticalFormat ? C.azul : C.verde;
  const colorSiLight = isVerticalFormat ? C.azulLight : C.verdeLight;

  const codeWidth = 18;
  const statusWidth = 26;
  const textWidth = CW - codeWidth - statusWidth - 12;
  
  for (const item of items) {
    const code = item.querySelector('.checklist-code')?.textContent?.trim() || '';
    let text = item.querySelector('.checklist-text')?.textContent?.trim() || '';
    const isSi   = !!item.querySelector('.sel-si.active');
    const isNo = !!item.querySelector('.sel-no.active');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(text, textWidth);
    const rowH = Math.max(7, textLines.length * 4.5);

    if (y + rowH > 278) {
      doc.addPage();
      y = 16;
      doc.setFillColor(...C.azulDark);
      doc.rect(M, y, CW, 8, 'F');
      doc.setTextColor(...C.blanco);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', M + 4, y + 5.5);
      doc.text('CONTROL', M + 24, y + 5.5);
      doc.text('ESTADO', M + CW - 22, y + 5.5);
      y += 10;
      doc.setFont('helvetica', 'normal');
      rowAlt = false;
    }

    if (rowAlt) {
      doc.setFillColor(...C.grisLight);
      doc.rect(M, y, CW, rowH, 'F');
    }

    // Código
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.azul);
    doc.text(code, M + 4, y + 4.5);

    // Texto multilínea
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.texto);
    let currentY = y + 4.5;
    for (let i = 0; i < textLines.length; i++) {
      doc.text(textLines[i], M + 24, currentY);
      currentY += 4.5;
    }

    // Estado
    if (isSi) {
      doc.setFillColor(...colorSiLight);
      doc.roundedRect(M + CW - statusWidth + 2, y + 1, statusWidth - 4, rowH - 2, 1.5, 1.5, 'F');
      doc.setTextColor(...colorSi);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(textoSi, M + CW - statusWidth/2 - 2, y + (rowH/2) + 1.5, { align: 'center' });
    } else if (isNo) {
      doc.setFillColor(...C.rojoLight);
      doc.roundedRect(M + CW - statusWidth + 2, y + 1, statusWidth - 4, rowH - 2, 1.5, 1.5, 'F');
      doc.setTextColor(...C.rojo);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(textoNo, M + CW - statusWidth/2 - 2, y + (rowH/2) + 1.5, { align: 'center' });
    }

    doc.setDrawColor(...C.grisBorde);
    doc.setLineWidth(0.2);
    doc.line(M, y + rowH, M + CW, y + rowH);

    y += rowH;
    rowAlt = !rowAlt;
  }

  _drawFooter(doc, C, today, NORMA);
  doc.save(fileName);
}

function _drawFooter(doc, C, today, norma) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...C.azulDark);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(140, 185, 205);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('GRCreal · grcreal.com · Autoevaluación sin valor legal · Datos no almacenados', 16, 293);
    doc.setTextColor(120, 160, 180);
    doc.text(today + '  ·  ' + norma + '  ·  Página ' + i + ' de ' + pages, 210 - 16, 293, { align: 'right' });
  }
}