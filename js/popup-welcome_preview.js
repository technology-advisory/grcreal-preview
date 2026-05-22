// popup-preview.js · Mostrar SIEMPRE · Entorno Preview

(function() {

    // Crear popup
    var popup = document.createElement('div');
    popup.id = 'previewPopup';
    popup.style.cssText = `
        display:flex;
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.72);
        z-index:99999;
        align-items:center;
        justify-content:center;
        backdrop-filter:blur(4px);
    `;

    popup.innerHTML = `
        <div style="
            background:white;
            max-width:420px;
            margin:20px;
            padding:28px;
            border-radius:22px;
            position:relative;
            box-shadow:0 25px 45px rgba(0,0,0,0.35);
            text-align:center;
            font-family:Arial,sans-serif;
        ">
            
            <p style="
                margin-bottom:16px;
                font-size:42px;
            ">⚠️</p>

            <p style="
                margin-bottom:14px;
                font-size:22px;
                font-weight:700;
                color:#0077B5;
            ">
                Entorno PREVIEW
            </p>

            <p style="
                margin-bottom:18px;
                font-size:14px;
                line-height:1.6;
                color:#444;
            ">
                Este entorno corresponde a una versión previa de GRCreal.
                El acceso está restringido únicamente a personas autorizadas.
            </p>

            <p style="
                margin-bottom:24px;
                font-size:12px;
                line-height:1.5;
                color:#777;
            ">
                El contenido puede estar incompleto, en revisión o contener cambios no publicados.
            </p>

            <button onclick="document.getElementById('previewPopup').style.display='none'" style="
                background:#0077B5;
                color:white;
                border:none;
                padding:12px 28px;
                border-radius:40px;
                font-size:13px;
                cursor:pointer;
                font-weight:600;
            ">
                Entendido
            </button>

        </div>
    `;

    document.body.appendChild(popup);

})();