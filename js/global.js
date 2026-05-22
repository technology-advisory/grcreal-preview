// global.js · Funcionalidades comunes para toda la web

(function() {
    // ============================================
    // AÑADIR BOMBILLA A LA DERECHA DEL .tag
    // ============================================
    var tag = document.querySelector('.tag');
    if (tag && !tag.parentElement.querySelector('.copyright-hint-auto')) {
        // Forzar que el tag sea inline
        tag.style.display = 'inline';
        
        var wrapper = document.createElement('div');
        wrapper.style.display = 'inline-block';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.marginBottom = '20px';
        
        // Mover el tag dentro del wrapper
        tag.parentNode.insertBefore(wrapper, tag);
        wrapper.appendChild(tag);
        
        // Crear botón bombilla a la derecha
        var btn = document.createElement('button');
        btn.innerHTML = 'ℹ️';
        btn.className = 'copyright-hint-auto';
        btn.style.cssText = 'background: var(--brand-light, #e8f3fa); border: none; font-size: 0.75rem; cursor: pointer; padding: 2px 6px; border-radius: 40px; color: var(--brand, #0077B5); transition: all 0.2s ease; margin-left: 6px; vertical-align: middle;';
        btn.onclick = function() { document.getElementById('copyrightPopupAuto').style.display = 'flex'; };
        
        btn.onmouseover = function() { this.style.transform = 'scale(1.05)'; };
        btn.onmouseout = function() { this.style.transform = 'scale(1)'; };
        
        wrapper.appendChild(btn);
    }
    
    // ============================================
    // POPUP (crear si no existe)
    // ============================================
    if (!document.getElementById('copyrightPopupAuto')) {
        var popup = document.createElement('div');
        popup.id = 'copyrightPopupAuto';
        popup.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;';
        popup.innerHTML = `
            <div style="background: white; max-width: 320px; margin: 20px; padding: 18px; border-radius: 16px; position: relative; box-shadow: 0 15px 25px rgba(0,0,0,0.15);">
                <button onclick="document.getElementById('copyrightPopupAuto').style.display='none'" style="position: absolute; top: 8px; right: 12px; background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">&times;</button>
                <p style="margin-bottom: 10px; font-size: 13px; font-weight: 600;"><strong>📄 Informacion</strong></p>
                <p style="margin-bottom: 8px; font-size: 11px; line-height: 1.5; color: #555;">Elaborado por <strong>Miguel Angel Carriazo</strong> (vCISO) desde la experiencia real en auditorías y cumplimiento.</p>
                <p style="margin-bottom: 6px; font-size: 10px; color: #777;">© GRCreal · Prohibida la reproducción sin autorización.</p>
                <p style="font-size: 9px; color: #999;">Para uso personal o formación · <a href="/legal/index.html" target="_blank" style="color: var(--brand, #0077B5); text-decoration: none;">Más info legal →</a></p>
            </div>
        `;
        document.body.appendChild(popup);
        
        popup.addEventListener('click', function(e) {
            if (e.target === this) this.style.display = 'none';
        });
    }
})();

