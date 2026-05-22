// pdf-export.js · GRCreal · Diseño corporativo v3
// Donut real + barras de cláusula dinámicas desde el DOM

function exportPDF() {
  const items = document.querySelectorAll('.checklist-item');
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

// Dibuja un arco en jsPDF (para el donut)
// cx,cy = centro, r = radio, startDeg, endDeg en grados, color RGB array
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

// Extrae el número de cláusula principal de un código (ej: "8.2.3" → 8, "10.1" → 10)
function _clauseNum(code) {
  const m = code.trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}

// Calcula % de implementados para controles cuya cláusula principal esté en el array de números
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

function generatePDF(jsPDF) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const items = document.querySelectorAll('.checklist-item');

  let implementados = 0, noImplementados = 0;
  items.forEach(item => {
    if (item.querySelector('.sel-si.active')) implementados++;
    if (item.querySelector('.sel-no.active')) noImplementados++;
  });
  const total = items.length;
  const pct = total > 0 ? Math.round((implementados / total) * 100) : 0;
  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fileName = `GRCreal_ISO22301_${today.replace(/\//g, '-')}.pdf`;

  // ── PALETA ──
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

  // ════════════════════════════════════════════
  // CABECERA
  // ════════════════════════════════════════════
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

  // Badge norma
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
  doc.text('ISO 22301:2019', 171, 21.5, { align: 'center' });

  doc.setTextColor(...C.blanco);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe de autoevaluacion — Continuidad de Negocio', M, 37);
  doc.setFontSize(7.5);
  doc.setTextColor(140, 185, 205);
  doc.text('Evaluacion realizada: ' + today, M, 43.5);
  doc.setLineWidth(0.3);
  doc.setDrawColor(45, 122, 154);
  doc.line(M, 47, 210 - M, 47);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 160, 180);
  doc.text('Documento orientativo — sin valor legal ni regulatorio — Datos no almacenados', M, 50.5);

  y = 62;

  // ════════════════════════════════════════════
  // KPI CARDS
  // ════════════════════════════════════════════
  const kpis = [
    { val: String(total),           label: 'TOTAL CONTROLES',  color: C.gris  },
    { val: String(implementados),   label: 'IMPLEMENTADOS',    color: C.verde },
    { val: String(noImplementados), label: 'NO IMPLEMENTADOS', color: C.rojo  },
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

  // ════════════════════════════════════════════
  // BARRA DE PROGRESO
  // ════════════════════════════════════════════
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
  if (pct >= 80)      { nivelLabel = 'Cumplimiento avanzado — Sistema solido. Alineado con ISO 22301.';    nivelBg = C.azulLight;  nivelTx = C.azul; }
  else if (pct >= 60) { nivelLabel = 'Cumplimiento destacado — Buen nivel. Mejoras puntuales.';             nivelBg = C.verdeLight; nivelTx = C.verde; }
  else if (pct >= 30) { nivelLabel = 'Cumplimiento parcial — Base establecida. Oportunidades de mejora.';  nivelBg = [254,243,199]; nivelTx = [146,64,14]; }
  else                { nivelLabel = 'Cumplimiento inicial — En progreso. Implementacion en marcha.';       nivelBg = C.rojoLight;  nivelTx = C.rojo; }

  doc.setFillColor(...nivelBg);
  doc.roundedRect(M, y - 4, CW, 8, 2, 2, 'F');
  doc.setTextColor(...nivelTx);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(nivelLabel, M + 4, y + 0.5);

  y += 14;

  // ════════════════════════════════════════════
  // DOS COLUMNAS: DONUT  |  BARRAS POR CLÁUSULA
  // ════════════════════════════════════════════
  const colW = (CW - 6) / 2;

  // ── Sección título ──
  doc.setFillColor(...C.azulLight);
  doc.rect(M, y, CW, 0.5, 'F');
  y += 5;

  const sectionY = y;  // guardar Y inicio de sección gráficos

  // ── DONUT (columna izquierda) ──
  const donutCX = M + colW / 2;
  const donutCY = sectionY + 34;
  const donutR  = 16;
  const trackW  = 4.5;

  // Título col izq
  doc.setTextColor(...C.azul);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUCIÓN DE ESTADO', M + colW / 2, sectionY + 4, { align: 'center' });

  // Track gris (círculo completo)
  _drawArc(doc, donutCX, donutCY, donutR, 0, 360, C.grisBorde, trackW);

  // Arco implementados (azul) — de 0 a pct*3.6 grados
  if (implementados > 0) {
    _drawArc(doc, donutCX, donutCY, donutR, 0, (implementados / total) * 360, C.azul, trackW);
  }
  // Arco no implementados (rojo) — continúa donde termina el azul
  if (noImplementados > 0) {
    _drawArc(doc, donutCX, donutCY, donutR,
      (implementados / total) * 360,
      360,
      [200, 120, 90], trackW);
  }

  // Texto central
  doc.setTextColor(...C.azul);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(pct + '%', donutCX, donutCY + 2.5, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.gris);
  doc.text('global', donutCX, donutCY + 7, { align: 'center' });

  // Leyenda donut
  const legY = sectionY + 56;
  // Punto azul + texto
  doc.setFillColor(...C.azul);
  doc.roundedRect(M + 8, legY - 2.5, 5, 3, 0.5, 0.5, 'F');
  doc.setTextColor(...C.gris);
  doc.setFontSize(6.5);
  doc.text('Implementado (' + implementados + ')', M + 15, legY);
  // Punto rojo + texto
  doc.setFillColor(200, 120, 90);
  doc.roundedRect(M + 8, legY + 3.5, 5, 3, 0.5, 0.5, 'F');
  doc.text('No implementado (' + noImplementados + ')', M + 15, legY + 6);

  // ── BARRAS POR CLÁUSULA (columna derecha) ──
  const colRX = M + colW + 6;
  doc.setTextColor(...C.azul);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CUMPLIMIENTO POR CLÁUSULA', colRX + colW / 2, sectionY + 4, { align: 'center' });

  // Calcular % reales desde el DOM (por número de cláusula, sin ambigüedad de prefijos)
  const clausulas = [
    { name: 'Cl. 4 — Contexto',   nums: [4] },
    { name: 'Cl. 5 — Liderazgo',  nums: [5] },
    { name: 'Cl. 7 — Soporte',    nums: [7] },
    { name: 'Cl. 8 — Operación',  nums: [8] },
    { name: 'Cl. 9 — Evaluación', nums: [9] },
    { name: 'Cl. 10 — Mejora',    nums: [10] },
  ];

  const barAreaW = colW - 4;
  const labelBarW = 30;
  const pctLbW = 10;
  const barFillW = barAreaW - labelBarW - pctLbW - 4;
  const barH2 = 4;
  const barGap2 = 9;
  let barY = sectionY + 12;

  clausulas.forEach(cl => {
    const cpct = _pctByClause(items, cl.nums);
    doc.setTextColor(...C.texto);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(cl.name, colRX, barY + barH2 - 0.5);
    const bx = colRX + labelBarW + 2;
    doc.setFillColor(...C.grisBorde);
    doc.roundedRect(bx, barY, barFillW, barH2, 2, 2, 'F');
    if (cpct > 0) {
      doc.setFillColor(...C.azul);
      doc.roundedRect(bx, barY, (barFillW * cpct) / 100, barH2, 2, 2, 'F');
    }
    doc.setTextColor(...C.gris);
    doc.setFontSize(6.5);
    doc.text(cpct + '%', bx + barFillW + 3, barY + barH2 - 0.5);
    barY += barGap2;
  });

  y = Math.max(donutCY + 30, barY) + 8;

  // ════════════════════════════════════════════
  // TABLA DE CONTROLES
  // ════════════════════════════════════════════
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

  for (const item of items) {
    const code = item.querySelector('.checklist-code')?.textContent?.trim() || '';
    let text = item.querySelector('.checklist-text')?.textContent?.trim() || '';
    const isImpl   = !!item.querySelector('.sel-si.active');
    const isNoImpl = !!item.querySelector('.sel-no.active');
    const rowH = 7;

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

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.azul);
    doc.text(code, M + 4, y + 5);

    if (text.length > 62) text = text.substring(0, 59) + '...';
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.texto);
    doc.text(text, M + 24, y + 5);

    if (isImpl) {
      doc.setFillColor(...C.verdeLight);
      doc.roundedRect(M + CW - 28, y + 1, 26, 5.5, 1.5, 1.5, 'F');
      doc.setTextColor(...C.verde);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Implantado', M + CW - 26.5, y + 5);
    } else if (isNoImpl) {
      doc.setFillColor(...C.rojoLight);
      doc.roundedRect(M + CW - 28, y + 1, 26, 5.5, 1.5, 1.5, 'F');
      doc.setTextColor(...C.rojo);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('No impl.', M + CW - 26.5, y + 5);
    }

    doc.setDrawColor(...C.grisBorde);
    doc.setLineWidth(0.2);
    doc.line(M, y + rowH, M + CW, y + rowH);

    y += rowH;
    rowAlt = !rowAlt;
  }

  _drawFooter(doc, C, today);
  doc.save(fileName);
}

function _drawFooter(doc, C, today) {
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
    doc.text(today + '  ·  Página ' + i + ' de ' + pages, 210 - 16, 293, { align: 'right' });
  }
}