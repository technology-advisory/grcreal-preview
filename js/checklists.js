// checklists.js · Con selector Implantado / No implantado y etiquetas de mapeo con tooltip

let checklistData = null;

function cargarChecklist(jsonUrl) {
    fetch(jsonUrl)
        .then(response => response.json())
        .then(data => {
            checklistData = data;
            renderChecklist(data);
            updateProgress();
            checkExportButton();
        })
        .catch(error => console.error('Error cargando checklist:', error));
}

// Función para crear una etiqueta con tooltip
function crearTagConTooltip(tag) {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.marginRight = '0px';
    
    const tagSpan = document.createElement('span');
    tagSpan.className = `marco-tag ${tag.name}`;
    tagSpan.textContent = tag.text;
    
    container.appendChild(tagSpan);
    
    if (tag.tooltip) {
        const tooltipSpan = document.createElement('span');
        tooltipSpan.className = 'tag-tooltip';
        tooltipSpan.textContent = tag.tooltip;
        container.appendChild(tooltipSpan);
        
        tooltipSpan.style.position = 'absolute';
        tooltipSpan.style.bottom = '125%';
        tooltipSpan.style.left = '50%';
        tooltipSpan.style.transform = 'translateX(-50%)';
        tooltipSpan.style.backgroundColor = '#1a1a1a';
        tooltipSpan.style.color = '#fff';
        tooltipSpan.style.padding = '4px 10px';
        tooltipSpan.style.borderRadius = '6px';
        tooltipSpan.style.fontSize = '10px';
        tooltipSpan.style.fontWeight = 'normal';
        tooltipSpan.style.whiteSpace = 'nowrap';
        tooltipSpan.style.zIndex = '100';
        tooltipSpan.style.fontFamily = 'system-ui, sans-serif';
        tooltipSpan.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        tooltipSpan.style.display = 'none';
        
        container.addEventListener('mouseenter', () => {
            tooltipSpan.style.display = 'block';
        });
        container.addEventListener('mouseleave', () => {
            tooltipSpan.style.display = 'none';
        });
    }
    
    return container;
}

function renderChecklist(data) {
    const container = document.getElementById('checklist-container');
    container.innerHTML = '';
    
    data.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'checklist-section';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'auditor-title';
        titleSpan.textContent = section.title;
        
        const pymeSpan = document.createElement('span');
        pymeSpan.className = 'pyme-title';
        pymeSpan.style.display = 'none';
        pymeSpan.textContent = section.pymeTitle || section.title;
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'checklist-section-title';
        titleDiv.appendChild(titleSpan);
        titleDiv.appendChild(pymeSpan);
        sectionDiv.appendChild(titleDiv);
        
        section.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'checklist-item';
            itemDiv.setAttribute('data-code', item.code);
            itemDiv.setAttribute('data-status', '');
            
            // Fila izquierda: código + badge
            const leftCell = document.createElement('div');
            leftCell.className = 'item-left';
            
            const codeSpan = document.createElement('span');
            codeSpan.className = 'checklist-code';
            codeSpan.textContent = item.code;
            
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `pyme-badge ${item.difficulty}`;
            badgeSpan.textContent = item.difficulty === 'facil' ? 'fácil' : (item.difficulty === 'medio' ? 'medio' : 'complejo');
            
            leftCell.appendChild(codeSpan);
            leftCell.appendChild(badgeSpan);
            
            // Centro: texto y tags
            const textCell = document.createElement('div');
            textCell.className = 'item-text';
            
            // Limpiar texto: asegurar espacio antes de ¿
            let cleanText = item.text || '';
            let cleanPymeText = item.pymeText || '';
            cleanText = cleanText.replace(/([a-zA-Z0-9])¿/g, '$1 ¿');
            cleanPymeText = cleanPymeText.replace(/([a-zA-Z0-9])¿/g, '$1 ¿');
            
            const textSpan = document.createElement('span');
            textSpan.className = 'checklist-text';
            textSpan.textContent = cleanText;
            
            const pymeTextSpan = document.createElement('span');
            pymeTextSpan.className = 'pyme-text';
            pymeTextSpan.textContent = cleanPymeText;
            
            textCell.appendChild(textSpan);
            textCell.appendChild(pymeTextSpan);
            
            // ========== ETIQUETAS DE MAPEO CON TOOLTIP ==========
            if (item.tags && item.tags.length > 0) {
                const tagsContainer = document.createElement('div');
                tagsContainer.className = 'marcos-tags';
                
                item.tags.forEach(tag => {
                    const tagWithTooltip = crearTagConTooltip(tag);
                    tagsContainer.appendChild(tagWithTooltip);
                });
                textCell.appendChild(tagsContainer);
            }
            // ====================================================================
            
            // Derecha: selector Implantado / No implantado
            const selectorCell = document.createElement('div');
            selectorCell.className = 'item-selector';
            
            const btnSi = document.createElement('button');
            btnSi.type = 'button';
            btnSi.className = 'sel-btn sel-si';
            btnSi.innerHTML = '✅ Implantado';
            
            const btnNo = document.createElement('button');
            btnNo.type = 'button';
            btnNo.className = 'sel-btn sel-no';
            btnNo.innerHTML = '❌ No implantado';
            
            selectorCell.appendChild(btnSi);
            selectorCell.appendChild(btnNo);
            
            // Tooltip principal (icono i)
            const tooltipWrap = document.createElement('div');
            tooltipWrap.className = 'tooltip-wrap';
            const infoIcon = document.createElement('div');
            infoIcon.className = 'info-icon';
            infoIcon.textContent = 'i';
            const tooltipDiv = document.createElement('div');
            tooltipDiv.className = 'tooltip';
            tooltipDiv.innerHTML = item.tooltip ? item.tooltip.replace(/\n/g, '<br>') : '';
            tooltipWrap.appendChild(infoIcon);
            tooltipWrap.appendChild(tooltipDiv);
            
            infoIcon.onclick = (e) => {
                e.stopPropagation();
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                    let expanded = itemDiv.querySelector('.tooltip-expanded');
                    if (!expanded) {
                        expanded = document.createElement('div');
                        expanded.className = 'tooltip-expanded';
                        expanded.innerHTML = item.tooltip ? item.tooltip.replace(/\n/g, '<br>') : '';
                        itemDiv.appendChild(expanded);
                    }
                    expanded.classList.toggle('visible');
                } else {
                    tooltipWrap.classList.toggle('open');
                    document.querySelectorAll('.tooltip-wrap.open').forEach(w => {
                        if (w !== tooltipWrap) w.classList.remove('open');
                    });
                }
            };
            
            // Ensamblar
            itemDiv.appendChild(leftCell);
            itemDiv.appendChild(textCell);
            itemDiv.appendChild(selectorCell);
            itemDiv.appendChild(tooltipWrap);
            
            btnSi.addEventListener('click', (e) => {
                e.stopPropagation();
                btnSi.classList.add('active');
                btnNo.classList.remove('active');
                itemDiv.setAttribute('data-status', 'si');
                updateProgress();
                checkExportButton();
            });
            
            btnNo.addEventListener('click', (e) => {
                e.stopPropagation();
                btnNo.classList.add('active');
                btnSi.classList.remove('active');
                itemDiv.setAttribute('data-status', 'no');
                updateProgress();
                checkExportButton();
            });
            
            sectionDiv.appendChild(itemDiv);
        });
        
        container.appendChild(sectionDiv);
    });
}

function updateProgress() {
    const items = document.querySelectorAll('.checklist-item');
    const total = items.length;
    const answered = document.querySelectorAll('.checklist-item[data-status="si"], .checklist-item[data-status="no"]');
    const done = answered.length;
    const implementados = document.querySelectorAll('.checklist-item[data-status="si"]').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const bar = document.getElementById('progress-bar');
    const label = document.getElementById('progress-label');
    const statusSpan = document.getElementById('progress-status');
    
    if (!bar) return;
    
    bar.style.width = pct + '%';
    label.innerHTML = `<span>${done} de ${total}</span> evaluados · ${implementados} implantados`;
    
    bar.className = 'progress-bar';
    if (pct >= 80) bar.classList.add('green');
    else if (pct >= 60) bar.classList.add('yellow');
    else if (pct >= 30) bar.classList.add('orange');
    
    if (pct >= 80) {
        statusSpan.className = 'progress-status green';
        statusSpan.textContent = '🏆 ' + pct + '% evaluado — ¡Excelente!';
    } else if (pct >= 60) {
        statusSpan.className = 'progress-status yellow';
        statusSpan.textContent = '🎉 ' + pct + '% evaluado — ¡Buen progreso!';
    } else if (pct >= 30) {
        statusSpan.className = 'progress-status orange';
        statusSpan.textContent = '✅ ' + pct + '% evaluado — Vas por buen camino';
    } else if (pct > 0) {
        statusSpan.className = 'progress-status orange';
        statusSpan.textContent = '📋 ' + pct + '% evaluado — Continúa';
    } else {
        statusSpan.className = 'progress-status red';
        statusSpan.textContent = '🚀 0% evaluado — Marca cada control';
    }
}

function checkExportButton() {
    const total = document.querySelectorAll('.checklist-item').length;
    const answered = document.querySelectorAll('.checklist-item[data-status="si"], .checklist-item[data-status="no"]').length;
    const exportBtn = document.querySelector('.pdf-btn');
    
    if (exportBtn) {
        if (total === answered && total > 0) {
            exportBtn.disabled = false;
            exportBtn.style.opacity = '1';
            exportBtn.style.cursor = 'pointer';
        } else {
            exportBtn.disabled = true;
            exportBtn.style.opacity = '0.5';
            exportBtn.style.cursor = 'not-allowed';
        }
    }
}

function resetAll() {
    document.querySelectorAll('.checklist-item').forEach(item => {
        const btns = item.querySelectorAll('.sel-btn');
        btns.forEach(btn => btn.classList.remove('active'));
        item.setAttribute('data-status', '');
    });
    updateProgress();
    checkExportButton();
}

function setModo(modo) {
    const body = document.body;
    const btnAuditor = document.getElementById('btn-auditor');
    const btnPyme = document.getElementById('btn-pyme');
    
    if (modo === 'pyme') {
        body.classList.add('modo-pyme');
        if (btnPyme) btnPyme.classList.add('active');
        if (btnAuditor) btnAuditor.classList.remove('active');
        document.querySelectorAll('.auditor-title').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.pyme-title').forEach(el => el.style.display = 'inline');
    } else {
        body.classList.remove('modo-pyme');
        if (btnAuditor) btnAuditor.classList.add('active');
        if (btnPyme) btnPyme.classList.remove('active');
        document.querySelectorAll('.auditor-title').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('.pyme-title').forEach(el => el.style.display = 'none');
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.tooltip-wrap')) {
        document.querySelectorAll('.tooltip-wrap.open').forEach(w => w.classList.remove('open'));
    }
});