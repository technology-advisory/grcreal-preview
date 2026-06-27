// checklists-expandible.js · Universal para cualquier checklist
// Layout: Sí/No a la derecha, panel expandible abajo
// Soporta: 📌 🔴 📋 y guiones al inicio de línea como viñetas

let checklistGlobalData = null;
let respuestasGlobal = {};

function cargarChecklistVertical(jsonUrl) {
    window._checklistSrc = jsonUrl;
    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            checklistGlobalData = data;
            renderChecklistVertical(data);
        })
        .catch(error => console.error('Error cargando checklist:', error));
}

function renderChecklistVertical(data) {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    container.innerHTML = '';
    
    data.sections.forEach((section, sIdx) => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'checklist-section';
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'checklist-section-title';
        titleDiv.textContent = section.title;
        sectionDiv.appendChild(titleDiv);
        
        section.items.forEach((item, iIdx) => {
            const itemId = `${sIdx}_${iIdx}`;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item-vertical';
            itemDiv.setAttribute('data-id', itemId);
            itemDiv.setAttribute('data-code', item.code);
            itemDiv.setAttribute('data-status', '');
            
            // Fila: código + badge + pregunta + botones
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.flexWrap = 'wrap';
            row.style.gap = '12px';
            row.style.marginBottom = '12px';
            
            // Parte izquierda
            const leftPart = document.createElement('div');
            leftPart.style.display = 'flex';
            leftPart.style.alignItems = 'center';
            leftPart.style.gap = '12px';
            leftPart.style.flex = '1';
            leftPart.style.flexWrap = 'wrap';
            
            const codeSpan = document.createElement('span');
            codeSpan.className = 'checklist-code';
            codeSpan.textContent = item.code;
            
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `pyme-badge ${item.difficulty}`;
            badgeSpan.textContent = item.difficulty === 'facil' ? 'fácil' : (item.difficulty === 'medio' ? 'medio' : 'complejo');
            
            const textSpan = document.createElement('span');
            textSpan.className = 'checklist-text';
            textSpan.style.fontSize = '14px';
            textSpan.style.lineHeight = '1.4';
            textSpan.textContent = item.text || '';
            
            leftPart.appendChild(codeSpan);
            leftPart.appendChild(badgeSpan);
            leftPart.appendChild(textSpan);
            
            // Parte derecha: botones
            const rightPart = document.createElement('div');
            rightPart.style.display = 'flex';
            rightPart.style.alignItems = 'center';
            rightPart.style.gap = '12px';
            rightPart.style.flexShrink = '0';
            
            const btnSi = document.createElement('button');
            btnSi.className = 'sel-btn sel-si';
            btnSi.innerHTML = '✅ Sí';
            btnSi.style.padding = '6px 16px';
            
            const btnNo = document.createElement('button');
            btnNo.className = 'sel-btn sel-no';
            btnNo.innerHTML = '❌ No';
            btnNo.style.padding = '6px 16px';
            
            const infoBtn = document.createElement('button');
            infoBtn.className = 'nis2-info-btn';
            infoBtn.innerHTML = 'i';
            
            rightPart.appendChild(btnSi);
            rightPart.appendChild(btnNo);
            rightPart.appendChild(infoBtn);
            
            row.appendChild(leftPart);
            row.appendChild(rightPart);
            
            // Panel expandible
            const panel = document.createElement('div');
            panel.className = 'nis2-panel';
            
            let rawText = item.tooltip || 'No hay información adicional.';
            let formattedHtml = formatTooltipText(rawText);
            
            panel.innerHTML = `
                <div class="nis2-panel-header">
                    <strong style="color:#1a5f7a;">📋 Explicación</strong>
                    <button class="nis2-panel-close">×</button>
                </div>
                <div class="nis2-panel-content">${formattedHtml}</div>
            `;
            
            // Eventos
            const closeBtn = panel.querySelector('.nis2-panel-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    panel.style.display = 'none';
                });
            }
            
            infoBtn.addEventListener('click', () => {
                const isVisible = panel.style.display === 'block';
                document.querySelectorAll('.nis2-panel').forEach(p => p.style.display = 'none');
                panel.style.display = isVisible ? 'none' : 'block';
            });
            
            btnSi.addEventListener('click', () => {
                btnSi.classList.add('active');
                btnNo.classList.remove('active');
                itemDiv.setAttribute('data-status', 'si');
                respuestasGlobal[itemId] = 'si';
                updateProgressVertical();
                checkExportButton();
            });
            
            btnNo.addEventListener('click', () => {
                btnNo.classList.add('active');
                btnSi.classList.remove('active');
                itemDiv.setAttribute('data-status', 'no');
                respuestasGlobal[itemId] = 'no';
                updateProgressVertical();
                checkExportButton();
            });
            
            // Restaurar estado
            if (respuestasGlobal[itemId] === 'si') {
                btnSi.classList.add('active');
                itemDiv.setAttribute('data-status', 'si');
            }
            if (respuestasGlobal[itemId] === 'no') {
                btnNo.classList.add('active');
                itemDiv.setAttribute('data-status', 'no');
            }
            
            itemDiv.appendChild(row);
            itemDiv.appendChild(panel);
            sectionDiv.appendChild(itemDiv);
        });
        
        container.appendChild(sectionDiv);
    });
    
    updateProgressVertical();
    checkExportButton();
}

function formatTooltipText(rawText) {
    if (!rawText) return 'No hay información disponible.';

    let text = rawText;

    // PASO 1: Normalizar saltos de línea
    text = text.replace(/\r\n/g, '\n');

    // PASO 2: Convertir guiones al inicio de línea en viñetas
    // Hacerlo ANTES de procesar emojis para no interferir con el texto de los títulos
    text = text.replace(/^[ \t]*-[ \t]+/gm, '• ');

    // PASO 3: Reemplazar emojis de sección por bloques con saltos claros
    // Lazy match (.+?) + lookahead para parar en el siguiente emoji de sección,
    // salto de línea o fin de cadena — cubre tooltips en una sola línea sin \n
    text = text.replace(/📌[ \t]*(.+?)(?=\n|📌|🔴|📋|🔗|$)/gs, '\n\n<strong>📌 $1</strong>\n');
    text = text.replace(/🔴[ \t]*(.+?)(?=\n|📌|🔴|📋|🔗|$)/gs, '\n\n<strong>🔴 $1</strong>\n');
    text = text.replace(/📋[ \t]*(.+?)(?=\n|📌|🔴|📋|🔗|$)/gs, '\n\n<strong>📋 $1</strong>\n');
    // Emoji de eslabón/link (evidencia)
    text = text.replace(/🔗[ \t]*(.+?)(?=\n|📌|🔴|📋|🔗|$)/gs, '\n<em>🔗 $1</em>\n');

    // PASO 4: Convertir saltos de línea en <br>
    text = text.replace(/\n/g, '<br>');

    // PASO 5: Reducir 3+ <br> consecutivos a exactamente 2
    text = text.replace(/(<br>\s*){3,}/g, '<br><br>');

    // PASO 6: Eliminar <br> al inicio del resultado
    text = text.replace(/^(<br>\s*)+/, '');

    return text;
}

function updateProgressVertical() {
    const items = document.querySelectorAll('.checklist-item-vertical');
    const total = items.length;
    const answered = document.querySelectorAll('.checklist-item-vertical[data-status="si"], .checklist-item-vertical[data-status="no"]').length;
    const sies = document.querySelectorAll('.checklist-item-vertical[data-status="si"]').length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    const statusSpan = document.getElementById('progress-status');
    
    if (!bar) return;
    
    bar.style.width = pct + '%';
    if (label) label.innerHTML = `<span>${answered} de ${total}</span> evaluados · ${sies} respuestas "Sí" · ${pct}%`;
    
    bar.className = 'progress-bar';
    if (pct >= 80) bar.classList.add('green');
    else if (pct >= 60) bar.classList.add('yellow');
    else if (pct >= 30) bar.classList.add('orange');
    
    if (statusSpan) {
        if (pct >= 80) statusSpan.textContent = '🏆 ' + pct + '% — Excelente';
        else if (pct >= 60) statusSpan.textContent = '🎉 ' + pct + '% — Buen progreso';
        else if (pct >= 30) statusSpan.textContent = '✅ ' + pct + '% — Buen camino';
        else if (pct > 0) statusSpan.textContent = '📋 ' + pct + '% — Continúa';
        else statusSpan.textContent = '🚀 0% — Marque cada control';
    }
}

function checkExportButton() {
    const total = document.querySelectorAll('.checklist-item-vertical').length;
    const answered = document.querySelectorAll('.checklist-item-vertical[data-status="si"], .checklist-item-vertical[data-status="no"]').length;
    const exportBtn = document.getElementById('pdf-btn');
    
    if (exportBtn) {
        exportBtn.disabled = !(total === answered && total > 0);
        exportBtn.style.opacity = exportBtn.disabled ? '0.5' : '1';
        exportBtn.style.cursor = exportBtn.disabled ? 'not-allowed' : 'pointer';
    }
}

function resetChecklistVertical() {
    if (confirm('⚠️ Borrar todos los datos?')) {
        respuestasGlobal = {};
        document.querySelectorAll('.checklist-item-vertical').forEach(item => {
            const btns = item.querySelectorAll('.sel-btn');
            btns.forEach(btn => btn.classList.remove('active'));
            item.setAttribute('data-status', '');
            const panel = item.querySelector('.nis2-panel');
            if (panel) panel.style.display = 'none';
        });
        updateProgressVertical();
        checkExportButton();
    }
}

// Exponer funciones globalmente
window.cargarChecklistVertical = cargarChecklistVertical;
window.resetChecklistVertical = resetChecklistVertical;