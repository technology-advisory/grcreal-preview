/* ============================================================
   GRCreal · herramientas.js
   Renderiza el índice de /herramientas/ desde tools.json.
   Si el fetch falla (p. ej. abriendo el fichero en local con
   file://), usa el FALLBACK de abajo para que se vea igual.
   ============================================================ */
(function () {
  "use strict";

  // Ajusta la ruta a tu estructura real.
  var TOOLS_JSON = "../data/tools.json";

  // ---- Fallback (mismo esquema que tools.json). Mantenlo sincronizado o bórralo. ----
  var FALLBACK = {
    features: [
      { icono: "⚡", titulo: "Listas para usar", texto: "Sin configuración ni registro. Abres, rellenas, exportas." },
      { icono: "📐", titulo: "Metodología integrada", texto: "Cada herramienta sigue su marco: ISO 27001, 22301, 27005, ENS, NIS2." },
      { icono: "🔗", titulo: "Trazabilidad entre ellas", texto: "El output de una alimenta a la siguiente." },
      { icono: "📤", titulo: "Exportación real", texto: "Documentación válida para auditoría, no plantillas vacías." }
    ],
    nota: {
      texto: "La mayoría de plantillas GRC son formularios vacíos disfrazados de metodología.<br><br><strong>GRCreal Tools busca otra cosa: herramientas que funcionan con los datos reales de tu organización y producen outputs que aguantan una auditoría.</strong><br><br>Porque rellenar plantillas no es gestionar el riesgo."
    },
    tools: [
      { id:"ai-act-clasificador", titulo:"Clasificador de Riesgo · AI Act", tag:"Reglamento (UE) 2024/1689 · IA",
        descripcion:"Responde unas preguntas sobre tu sistema y obtén su categoría de riesgo según el AI Act —prohibido, alto riesgo, transparencia o mínimo—, las obligaciones aplicables, el plazo de cumplimiento y los artículos relevantes.",
        badges:["AI Act","Anexo III","GPAI","Art. 5","Art. 50"], enlace:"ai-act-clasificador/index.html", bloqueado:false },
      { id:"bia", titulo:"BIA · Business Impact Analysis", tag:"ISO 22301 · Continuidad",
        descripcion:"Procesos críticos, dependencias e impacto real de una interrupción. Calcula RTO, RPO y MTD desde datos operacionales.",
        badges:["ISO 22301","RTO/RPO","MTD","Criticidad"], enlace:"bia/index.html", bloqueado:true },
      { id:"analisis-riesgos", titulo:"Análisis de Riesgos", tag:"ISO 27005 · Gestión del Riesgo",
        descripcion:"Identifica, evalúa y prioriza riesgos con matriz 5×5. Asigna propietario y tratamiento y exporta el registro listo para el SGSI.",
        badges:["ISO 27005","ISO 27001","P×I","Risk Register"], enlace:"analisis-riesgos/index.html", bloqueado:true },
      { id:"plan-tratamiento", titulo:"Plan de Tratamiento de Riesgos", tag:"ISO 27001 · Anexo A · SoA",
        descripcion:"Convierte el registro de riesgos en decisiones concretas: controles del Anexo A, responsables, plazos y evidencias. Output al SoA.",
        badges:["ISO 27001","Anexo A","SoA","PTR"], enlace:"plan-tratamiento/index.html", bloqueado:true },
      { id:"matriz-dependencias", titulo:"Matriz de Dependencias", tag:"ISO 22301 · Arquitectura",
        descripcion:"Mapea dependencias entre procesos, sistemas e infraestructura. Detecta puntos únicos de fallo que no salen en el organigrama.",
        badges:["Dependencias","SPOF","Resiliencia"], enlace:"matriz-dependencias/index.html", bloqueado:true },
      { id:"gestion-proveedores", titulo:"Gestión de Proveedores", tag:"ISO 27001 · A.5.19 · NIS2",
        descripcion:"Evalúa el riesgo de tu cadena de suministro. Clasifica por criticidad, controla cláusulas y genera evidencias para auditoría de terceros.",
        badges:["A.5.19","NIS2","Third Party Risk","Due Diligence"], enlace:"gestion-proveedores/index.html", bloqueado:true }
    ]
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderFeatures(features) {
    var wrap = document.getElementById("hrFeatures");
    wrap.innerHTML = "";
    (features || []).forEach(function (f) {
      var c = el("div", "hr-feat");
      c.appendChild(el("div", "hr-feat-ico", f.icono || "•"));
      c.appendChild(el("div", "hr-feat-t", f.titulo || ""));
      c.appendChild(el("p", "hr-feat-x", f.texto || ""));
      wrap.appendChild(c);
    });
  }

  function renderNota(nota) {
    var wrap = document.getElementById("hrNota");
    if (!nota || !nota.texto) { wrap.style.display = "none"; return; }
    wrap.innerHTML = "";
    wrap.appendChild(el("div", "hr-nota-label", "Nota del autor"));
    wrap.appendChild(el("p", "hr-nota-x", nota.texto));
  }

  function renderTools(tools) {
    var wrap = document.getElementById("hrTools");
    wrap.innerHTML = "";
    (tools || []).forEach(function (t, i) {
      var ref = "REF." + String(i + 1).padStart(2, "0");
      var locked = !!t.bloqueado;
      var card = el("article", "hr-card" + (locked ? " locked" : ""));

      if (locked) {
        card.appendChild(el("div", "hr-stamp", t.mensaje_bloqueo || "Próximamente"));
      }

      var top = el("div", "hr-card-top");
      top.appendChild(el("span", "hr-ref", ref));
      top.appendChild(el("span", "hr-tag", t.tag || ""));
      card.appendChild(top);

      card.appendChild(el("h2", null, t.titulo || ""));
      card.appendChild(el("p", "hr-desc", t.descripcion || ""));

      if (t.badges && t.badges.length) {
        var b = el("div", "hr-badges");
        t.badges.forEach(function (x) { b.appendChild(el("span", "hr-badge", x)); });
        card.appendChild(b);
      }

		// Mostrar "Abrir herramienta →" solo si tiene enlace
		if (t.enlace) {
		  var a = el("a", "hr-cta", "Abrir herramienta →");

		  if (locked) {
			a.classList.add("disabled");
			a.setAttribute("aria-disabled", "true");
			a.removeAttribute("href");
		  } else {
			a.href = t.enlace;
		  }

		  card.appendChild(a);
		} else {
		  card.appendChild(el("div", "hr-soon", "En preparación"));
		}

		wrap.appendChild(card);
		});
		}

  function render(data) {
    renderFeatures(data.features);
    renderNota(data.nota);
    renderTools(data.tools);
  }

  fetch(TOOLS_JSON, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () { render(FALLBACK); });
})();