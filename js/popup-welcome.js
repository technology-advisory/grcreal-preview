// popup-welcome.js · Una vez por semana (sin cookies, sin IP)

(function() {
    var ahora = new Date().getTime();
    var unaSemana = 7 * 24 * 60 * 60 * 1000; // 7 días
    var ultimaVez = localStorage.getItem('popupLastShown');
    
    // Si no se ha mostrado nunca o pasó más de una semana
    if (!ultimaVez || (ahora - parseInt(ultimaVez)) > unaSemana) {
        
        // Crear popup
        var popup = document.createElement('div');
        popup.id = 'welcomePopup';
        popup.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 1001; align-items: center; justify-content: center;';
        popup.innerHTML = `
            <div style="background: white; max-width: 380px; margin: 20px; padding: 24px; border-radius: 20px; position: relative; box-shadow: 0 20px 35px rgba(0,0,0,0.2); text-align: center;">
                <button onclick="document.getElementById('welcomePopup').style.display='none'" style="position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 22px; cursor: pointer; color: #999;">&times;</button>
                <p style="margin-bottom: 16px; font-size: 28px;">👋</p>
                <p style="margin-bottom: 12px; font-size: 18px; font-weight: 700; color: var(--brand, #0077B5);">Bienvenido a GRCreal</p>
                <p style="margin-bottom: 16px; font-size: 13px; line-height: 1.5; color: #555;">Este sitio no utiliza cookies de seguimiento. Todo el contenido es original y está protegido por derechos de autor.</p>
                <p style="margin-bottom: 20px; font-size: 12px; color: #777;">Para uso personal o formación interna.</p>
                <button onclick="document.getElementById('welcomePopup').style.display='none'" style="background: var(--brand, #0077B5); color: white; border: none; padding: 10px 24px; border-radius: 40px; font-size: 13px; cursor: pointer; font-weight: 600;">Entendido</button>
                <p style="margin-top: 16px; font-size: 10px; color: #aaa;"><a href="/legal/index.html" target="_blank" style="color: var(--brand, #0077B5);">Más información legal</a></p>
            </div>
        `;
        document.body.appendChild(popup);
        
        // Guardar timestamp actual
        localStorage.setItem('popupLastShown', ahora.toString());
        
        // Cerrar al hacer clic fuera
        popup.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
})();