// modulo-check-22301.js · Control de progreso para ISO 22301 Lead Auditor (BCMS)
// Clave única para este curso (no interfiere con ISO 27001, ISO 42001)

// ============================================================
// CONFIGURACIÓN DEL CURSO
// ============================================================

const STORAGE_KEY = 'lead_auditor_22301_completados';
const MODULOS_OBLIGATORIOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log(`🔑 Curso ISO 22301 detectado. Clave de progreso: ${STORAGE_KEY}`);

// ============================================================
// FUNCIONES PRINCIPALES
// ============================================================

function marcarModuloCompletado(modulo) {
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (!completados.includes(modulo)) {
        completados.push(modulo);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(completados));
        console.log(`✅ [${STORAGE_KEY}] Módulo ${modulo} completado`);
        return true;
    }
    return false;
}

function getFirstPendingModulo() {
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    for (let m of MODULOS_OBLIGATORIOS) {
        if (!completados.includes(m)) {
            return m;
        }
    }
    return null;
}

function actualizarCheckBadge() {
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    const badge = document.querySelector('.module-badge');
    if (badge) {
        const match = badge.innerText.match(/Módulo (\d+)/i);
        if (match) {
            const moduloActual = parseInt(match[1]);
            const checkExistente = badge.querySelector('.check-verde');
            if (checkExistente) checkExistente.remove();
            
            if (completados.includes(moduloActual)) {
                const checkSpan = document.createElement('span');
                checkSpan.innerHTML = ' ✅';
                checkSpan.style.color = '#28a745';
                checkSpan.style.fontWeight = 'bold';
                badge.appendChild(checkSpan);
            }
        }
    }
}

function mostrarChecksModulos() {
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    actualizarCheckBadge();
    
    const moduleCards = document.querySelectorAll('.module-card');
    moduleCards.forEach(card => {
        const numberSpan = card.querySelector('.module-number');
        if (numberSpan) {
            const num = parseInt(numberSpan.innerText);
            const checkExistente = numberSpan.querySelector('.check-modulo');
            if (checkExistente) checkExistente.remove();
            
            if (completados.includes(num)) {
                const checkSpan = document.createElement('span');
                checkSpan.innerHTML = ' ✅';
                checkSpan.style.fontSize = '10px';
                checkSpan.style.color = '#28a745';
                numberSpan.appendChild(checkSpan);
            }
        }
    });
}

function bloquearModulosIndex() {
    const moduleCards = document.querySelectorAll('.module-card');
    if (moduleCards.length === 0) return;
    
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    
    moduleCards.forEach(card => {
        const numberSpan = card.querySelector('.module-number');
        if (numberSpan) {
            const num = parseInt(numberSpan.innerText);
            
            // Módulos 2 al 10: requieren el anterior completado
            if (num >= 2 && num <= 10) {
                if (!completados.includes(num - 1)) {
                    if (!card.classList.contains('locked')) {
                        card.classList.add('locked');
                        if (!card.hasAttribute('data-href')) {
                            card.setAttribute('data-href', card.getAttribute('href') || '');
                        }
                        card.removeAttribute('href');
                        if (!card.querySelector('.locked-message')) {
                            const lockMsg = document.createElement('div');
                            lockMsg.className = 'locked-message';
                            lockMsg.innerHTML = '🔒 Completa el módulo anterior';
                            lockMsg.style.fontSize = '11px';
                            lockMsg.style.marginTop = '8px';
                            card.querySelector('.module-content')?.appendChild(lockMsg);
                        }
                    }
                } else {
                    card.classList.remove('locked');
                    const lockMsg = card.querySelector('.locked-message');
                    if (lockMsg) lockMsg.remove();
                    const originalHref = card.getAttribute('data-href');
                    if (originalHref && !card.getAttribute('href')) {
                        card.setAttribute('href', originalHref);
                    }
                }
            }
            
            // Módulo 11 (resumen): requiere los 10 módulos completados
            if (num === 11) {
                if (completados.length < 10) {
                    if (!card.classList.contains('locked')) card.classList.add('locked');
                } else {
                    card.classList.remove('locked');
                    const lockMsg = card.querySelector('.locked-message');
                    if (lockMsg) lockMsg.remove();
                    const originalHref = card.getAttribute('data-href');
                    if (originalHref && !card.getAttribute('href')) {
                        card.setAttribute('href', originalHref);
                    }
                }
            }
            
            // Módulo 12 (consejos examen): requiere los 10 módulos completados
            if (num === 12) {
                if (completados.length < 10) {
                    if (!card.classList.contains('locked')) card.classList.add('locked');
                } else {
                    card.classList.remove('locked');
                    const lockMsg = card.querySelector('.locked-message');
                    if (lockMsg) lockMsg.remove();
                    const originalHref = card.getAttribute('data-href');
                    if (originalHref && !card.getAttribute('href')) {
                        card.setAttribute('href', originalHref);
                    }
                }
            }
        }
    });
}

function checkAccess() {
    const path = window.location.pathname;
    
    const moduloMatch = path.match(/modulo-(\d+)\.html/);
    if (moduloMatch) {
        const modulo = parseInt(moduloMatch[1]);
        if (modulo >= 1 && modulo <= 10) {
            let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
            
            console.log(`🔍 Verificando acceso al módulo ${modulo}. Completados:`, completados);
            
            if (completados.includes(modulo)) {
                console.log(`✅ Módulo ${modulo} ya completado. Acceso permitido.`);
                return true;
            }
            
            if (modulo > 1 && !completados.includes(modulo - 1)) {
                console.log(`❌ Acceso denegado al módulo ${modulo}. Falta el módulo ${modulo - 1}`);
                alert(`❌ No puedes acceder al módulo ${modulo} sin haber completado antes el módulo ${modulo - 1}.`);
                window.location.href = `modulo-${modulo - 1}.html`;
                return false;
            }
        }
        return true;
    }
    
    if (path.includes('resumen.html') || path.includes('modulo-11.html')) {
        const firstPending = getFirstPendingModulo();
        if (firstPending !== null) {
            alert(`❌ No puedes acceder al resumen sin completar todos los módulos.\n\nTe falta completar el módulo ${firstPending}.`);
            window.location.href = `modulo-${firstPending}.html`;
            return false;
        }
    }
    
    if (path.includes('consejos.html') || path.includes('modulo-12.html')) {
        const completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
        if (completados.length < 10) {
            const firstPending = getFirstPendingModulo();
            alert(`❌ Para acceder a los consejos del examen, primero debes completar los 10 módulos.\n\nTe falta completar el módulo ${firstPending}.`);
            window.location.href = `modulo-${firstPending}.html`;
            return false;
        }
    }
    
    return true;
}

function inyectarTimerLectura() {
    const moduloMatch = window.location.pathname.match(/modulo-(\d+)\.html/);
    if (!moduloMatch) return;
    
    const modulo = parseInt(moduloMatch[1]);
    if (modulo < 1 || modulo > 10) return;
    
    // Verificar si ya está completado
    let completados = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (completados.includes(modulo)) {
        console.log(`ℹ️ Módulo ${modulo} ya completado. No se muestra timer.`);
        return;
    }
    
    const ctaBlock = document.querySelector('.cta-block');
    if (!ctaBlock) return;
    
    if (document.querySelector('.lectura-timer')) return;
    
    const timerHTML = document.createElement('div');
    timerHTML.className = 'lectura-timer';
    timerHTML.style.cssText = 'text-align: center; margin: 20px 0; padding: 12px; background: var(--brand-light); border-radius: 12px;';
    timerHTML.innerHTML = `
        <span style="font-family: var(--mono); font-size: 14px;">📖 Tiempo de lectura recomendado: </span>
        <span id="timer-countdown" style="font-weight: bold; font-size: 18px; color: var(--brand);">02:00</span>
        <div id="timer-message" style="display: none; color: #28a745; font-weight: bold; margin-top: 8px;">✅ Módulo completado. Ya puedes continuar.</div>
    `;
    
    ctaBlock.parentNode.insertBefore(timerHTML, ctaBlock);
    
    // Buscar el botón que permite avanzar (el que NO sea "Anterior")
    const botones = document.querySelectorAll('.cta-buttons a.cta-button');
    let botonAvanzar = null;
    
    for (let btn of botones) {
        if (!btn.textContent.includes('Anterior')) {
            botonAvanzar = btn;
            break;
        }
    }
    
    if (botonAvanzar) {
        botonAvanzar.style.pointerEvents = 'none';
        botonAvanzar.style.opacity = '0.5';
        
        let tiempoRestante = 5; // 2 minutos REALES
        
        const timerElement = document.getElementById('timer-countdown');
        const timerMessage = document.getElementById('timer-message');
        
        const intervalo = setInterval(() => {
            if (tiempoRestante <= 0) {
                clearInterval(intervalo);
                
                // Marcar como completado
                let completadosNow = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
                if (!completadosNow.includes(modulo)) {
                    completadosNow.push(modulo);
                    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(completadosNow));
                    console.log(`✅ [${STORAGE_KEY}] Módulo ${modulo} completado. sessionStorage:`, completadosNow);
                    actualizarCheckBadge();
                }
                
                botonAvanzar.style.pointerEvents = 'auto';
                botonAvanzar.style.opacity = '1';
                if (timerMessage) timerMessage.style.display = 'block';
                if (timerElement) timerElement.style.display = 'none';
            } else {
                tiempoRestante--;
                const minutos = Math.floor(tiempoRestante / 60);
                const segundos = tiempoRestante % 60;
                if (timerElement) {
                    timerElement.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAccess();
    inyectarTimerLectura();
    mostrarChecksModulos();
    bloquearModulosIndex();
});