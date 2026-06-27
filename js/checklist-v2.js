/* ============================================================
   GRCreal · checklist-v2.js  (motor adaptado a TU esquema)
   { sections:[ { title, pymeTitle?, items:[
       {code, difficulty, text, pymeText, tooltip} ] } ] }
   Fuente:  window.CHECKLIST_SRC | window.CHECKLIST_DATA
   Meta:    window.CHECKLIST_MARCO | window.CHECKLIST_NORMA
   Sin almacenamiento.
   ============================================================ */
(function(){
"use strict";

var EST={cumple:1, parcial:0.5, nocumple:0, na:null};
var EST_TXT={cumple:"Cumple", parcial:"Parcial", nocumple:"No cumple", na:"N/A"};
var EST_COLOR={cumple:[30,132,73], parcial:[146,64,14], nocumple:[153,27,27], na:[90,102,117]};
var DIFF_TXT={facil:"Fácil", medio:"Medio", complejo:"Complejo"};

var S={data:null, view:"auditor", diff:"todas", estados:{}, evid:{}, resp:{}, open:{}};

function $(id){return document.getElementById(id);}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function safe(s){return String(s==null?"":s).replace(/\u2026/g,"...").replace(/\u2014/g,"-")
  .replace(/[\u2022\u25cf\u25c9\u25c6\u25b2]/g,"-").replace(/\u2192/g,"->")
  .replace(/[\u201c\u201d]/g,'"').replace(/[\u2018\u2019]/g,"'");}

function boot(){
  if(window.CHECKLIST_SOURCES_DATA){return initMulti(window.CHECKLIST_SOURCES_DATA);}
  if(window.CHECKLIST_DATA){return init(window.CHECKLIST_DATA);}
  if(window.CHECKLIST_SOURCES){
    Promise.all(window.CHECKLIST_SOURCES.map(function(s){
      return fetch(s.src,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json();})
        .then(function(d){return {nivel:s.nivel,data:d};});
    })).then(initMulti).catch(function(){var c=$("chkRoot"); if(c)c.innerHTML='<p style="color:#991b1b">No se pudieron cargar los datos.</p>';});
    return;
  }
  var src=window.CHECKLIST_SRC||"checklist.json";
  fetch(src,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json();})
    .then(init).catch(function(){var c=$("chkRoot"); if(c)c.innerHTML='<p style="color:#991b1b">No se pudo cargar '+esc(src)+'.</p>';});
}
function init(data){ S.multi=false; S.data=data; renderControls(); renderAll(); }
function initMulti(sources){
  S.multi=true; S.sources=sources; S.niveles=sources.map(function(s){return s.nivel;});
  S.enivel=S.niveles.indexOf("media")>=0?"media":S.niveles[0];
  S.data=mergeUpTo(S.enivel); renderControls(); renderAll();
}
function mergeUpTo(nivel){
  var idx=S.niveles.indexOf(nivel); var map={}, order=[];
  for(var i=0;i<=idx;i++){
    (S.sources[i].data.sections||[]).forEach(function(sec){
      var k=sec.title||""; if(!map[k]){map[k]={title:sec.title,pymeTitle:sec.pymeTitle,items:[]};order.push(k);}
      map[k].items=map[k].items.concat(sec.items||[]);
    });
  }
  return {sections:order.map(function(k){return map[k];})};
}

function aplica(it){ return S.diff==="todas" || it.difficulty===S.diff; }
function itemsVis(sec){ return (sec.items||[]).filter(aplica); }
function allVis(){var a=[];(S.data.sections||[]).forEach(function(s){itemsVis(s).forEach(function(i){a.push(i);});});return a;}
function pendientes(){return allVis().filter(function(it){return S.estados[it.code]==null;});}

function secRef(sec){var t=sec.title||"";var i=t.indexOf("·");return i>0?t.slice(0,i).trim():"";}
function secTit(sec){
  if(S.view==="pyme"&&sec.pymeTitle) return sec.pymeTitle;
  var t=sec.title||"";var i=t.indexOf("·");return i>0?t.slice(i+1).trim():t;
}

/* ---------- controles ---------- */
function renderControls(){
  var c=$("chkControls"); if(!c)return; c.innerHTML="";
  var g1=document.createElement("div"); g1.className="chk-group";
  g1.innerHTML='<span class="chk-group-label">Vista</span>';
  [["auditor","Auditor"],["pyme","Pyme"]].forEach(function(v){
    var b=document.createElement("button"); b.className="chk-chip"+(S.view===v[0]?" on":"");
    b.textContent=v[1]; b.onclick=function(){S.view=v[0];renderControls();renderAll();};
    g1.appendChild(b);
  });
  c.appendChild(g1);
  var g2=document.createElement("div"); g2.className="chk-group";
  g2.innerHTML='<span class="chk-group-label">Dificultad</span>';
  [["todas","Todas"],["facil","Fácil"],["medio","Medio"],["complejo","Complejo"]].forEach(function(v){
    var b=document.createElement("button"); b.className="chk-chip"+(S.diff===v[0]?" on":"");
    b.textContent=v[1]; b.onclick=function(){S.diff=v[0];renderControls();renderAll();};
    g2.appendChild(b);
  });
  c.appendChild(g2);
  if(S.multi){
    var g3=document.createElement("div"); g3.className="chk-group";
    g3.innerHTML='<span class="chk-group-label">Categoría ENS</span>';
    S.niveles.forEach(function(n){
      var b=document.createElement("button"); b.className="chk-chip"+(S.enivel===n?" on":"");
      b.textContent=n.charAt(0).toUpperCase()+n.slice(1);
      b.onclick=function(){window.CHK.enivel(n);};
      g3.appendChild(b);
    });
    c.appendChild(g3);
  }
}

function renderAll(){ renderScore(); renderSections(); renderGaps(); }

function scoreOf(items){
  var sum=0,cnt=0;
  items.forEach(function(it){var v=S.estados[it.code]; if(v==null||v==="na")return; sum+=EST[v]; cnt++;});
  return {pct: cnt?Math.round(sum/cnt*100):0, evaluados:cnt, total:items.length};
}
function madurez(pct,ev){
  if(!ev) return {t:"Sin evaluar",c:"mad-inicial"};
  if(pct>=90) return {t:"Óptimo",c:"mad-optimo"};
  if(pct>=75) return {t:"Sólido",c:"mad-solido"};
  if(pct>=50) return {t:"Gestionado",c:"mad-gestionado"};
  if(pct>=25) return {t:"Básico",c:"mad-basico"};
  return {t:"Inicial",c:"mad-inicial"};
}
function counts(items){var r={cumple:0,parcial:0,nocumple:0,na:0,pend:0};
  items.forEach(function(it){var v=S.estados[it.code]; if(v==null)r.pend++; else r[v]++;});return r;}

function renderScore(){
  var all=allVis(); var sc=scoreOf(all); var mad=madurez(sc.pct,sc.evaluados); var r=counts(all);
  var c=$("chkScore"); if(!c)return;
  c.innerHTML=
   '<div class="chk-score-card main"><div class="chk-score-num">'+sc.pct+'%</div>'+
     '<div class="chk-score-lbl">Cumplimiento</div><div class="chk-score-mad '+mad.c+'">'+mad.t+'</div>'+
     '<div class="chk-prog"><i style="width:'+sc.pct+'%"></i></div></div>'+
   '<div class="chk-score-card"><div class="chk-score-num">'+r.cumple+'</div><div class="chk-score-lbl">Cumple</div></div>'+
   '<div class="chk-score-card"><div class="chk-score-num">'+(r.parcial+r.nocumple)+'</div><div class="chk-score-lbl">Brechas (parcial/no)</div></div>'+
   '<div class="chk-score-card"><div class="chk-score-num">'+r.pend+'</div><div class="chk-score-lbl">Sin evaluar</div></div>';
}

function renderSections(){
  var root=$("chkRoot"); if(!root)return; root.innerHTML="";
  (S.data.sections||[]).forEach(function(sec){
    var items=itemsVis(sec); if(!items.length)return;
    var sc=scoreOf(items); var ref=secRef(sec);
    var box=document.createElement("div"); box.className="chk-dominio";
    box.innerHTML='<div class="chk-dominio-head"><div class="chk-dominio-tit">'+
       (ref?'<span class="chk-dominio-ref">'+esc(ref)+'</span>':'')+esc(secTit(sec))+'</div>'+
       '<div class="chk-dominio-score">'+sc.pct+'% · '+sc.evaluados+'/'+items.length+'</div></div>';
    items.forEach(function(it){ box.appendChild(itemEl(it)); });
    root.appendChild(box);
  });
}

function itemEl(it){
  var v=S.estados[it.code];
  var desc=(S.view==="pyme"&&it.pymeText)?it.pymeText:(it.text||it.pymeText||"");
  var ev=S.evid[it.code]||"", rs=S.resp[it.code]||"";
  var d=document.createElement("div"); d.className="chk-item"+(v?" st-"+v:"");
  var estBtns=Object.keys(EST_TXT).map(function(k){
    return '<button class="chk-est'+(v===k?" on":"")+'" data-v="'+k+'" onclick="CHK.set(\''+it.code+'\',\''+k+'\')">'+EST_TXT[k]+'</button>';
  }).join("");
  var diffBadge=it.difficulty?'<span class="chk-item-nivel diff-'+it.difficulty+'">'+(DIFF_TXT[it.difficulty]||it.difficulty)+'</span>':'';
  var tip=it.tooltip?
    '<button class="chk-tip-btn" onclick="CHK.tip(\''+it.code+'\')">ⓘ Guía / evidencia</button>'+
    '<div class="chk-tip'+(S.open[it.code]?" show":"")+'">'+esc(it.tooltip)+'</div>':'';
  d.innerHTML=
    '<div class="chk-item-top"><div style="display:flex;gap:10px;flex:1">'+
        '<span class="chk-item-id">'+esc(it.code)+'</span>'+
        '<div class="chk-item-txt"><div class="chk-item-name">'+esc(desc)+'</div>'+tip+'</div>'+
      '</div>'+diffBadge+'</div>'+
    '<div class="chk-estados">'+estBtns+'</div>'+
    '<div class="chk-evid'+(v&&v!=="na"?" show":"")+'">'+
      '<input placeholder="Evidencia / observación" value="'+esc(ev)+'" oninput="CHK.evid(\''+it.code+'\',this.value)">'+
      '<input placeholder="Responsable" value="'+esc(rs)+'" oninput="CHK.resp(\''+it.code+'\',this.value)">'+
    '</div>';
  return d;
}

function renderGaps(){
  var g=$("chkGaps"); if(!g)return;
  var gaps=[];
  allVis().forEach(function(it){var v=S.estados[it.code]; if(v==="nocumple"||v==="parcial")gaps.push({code:it.code,nombre:it.text,v:v});});
  if(!gaps.length){g.innerHTML='<h3>Brechas</h3><ul><li class="ok">Sin brechas en lo evaluado. Completa los pendientes para una foto real.</li></ul>';return;}
  var html='<h3>Brechas a cerrar ('+gaps.length+')</h3><ul>';
  gaps.forEach(function(x){html+='<li><b>'+esc(x.code)+'</b><span>'+esc(x.nombre)+' — <strong>'+EST_TXT[x.v]+'</strong></span></li>';});
  html+='</ul>'; g.innerHTML=html;
}

/* aviso bajo el botón */
function showMsg(html,tipo){
  var m=$("chkMsg"); if(!m)return;
  if(!html){m.style.display="none";m.className="chk-msg";m.innerHTML="";return;}
  m.className="chk-msg "+(tipo||"warn"); m.innerHTML=html; m.style.display="block";
}

window.CHK={
  set:function(c,v){S.estados[c]=(S.estados[c]===v?null:v);renderAll();
    if(pendientes().length===0)showMsg("");},
  evid:function(c,v){S.evid[c]=v;},
  resp:function(c,v){S.resp[c]=v;},
  tip:function(c){S.open[c]=!S.open[c];renderSections();},
  enivel:function(n){S.enivel=n;S.data=mergeUpTo(n);renderControls();renderAll();showMsg("");},
  reset:function(){
    if(confirm("¿Borrar todas las respuestas?")){
      S.estados={};S.evid={};S.resp={};S.open={};S.diff="todas";S.view="auditor";
      renderControls();renderAll();showMsg("");
      window.scrollTo({top:0,behavior:"smooth"});
    }
  },
  pdf:exportPDF
};

/* ---------- PDF (con gráfico) ---------- */
function exportPDF(){
  // 1) bloquear si falta algo por evaluar
  var pend=pendientes();
  if(pend.length){
    var ej=pend.slice(0,8).map(function(it){return it.code;}).join(", ");
    showMsg('<strong>Aún no puedes exportar.</strong> Faltan <b>'+pend.length+'</b> controles por evaluar'+
      (pend.length>8?' (p. ej. '+ej+'…)':': '+ej)+'.<br>Marca su estado — usa <b>N/A</b> si no aplica — antes de generar el PDF.','warn');
    return;
  }
  showMsg("");
  if(!window.jspdf){alert("No se encontró jsPDF.");return;}
  var jsPDF=window.jspdf.jsPDF; var doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  var W=doc.internal.pageSize.getWidth(), x0=14, innerW=W-2*x0;
  var all=allVis(); var sc=scoreOf(all); var mad=madurez(sc.pct,sc.evaluados); var r=counts(all);
  var marco=window.CHECKLIST_MARCO||S.data.marco||"Checklist";
  var norma=window.CHECKLIST_NORMA||S.data.norma||"";

  // --- cabecera ---
  doc.setFillColor(0,57,85); doc.rect(0,0,W,28,"F");
  doc.setTextColor(255); doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Informe de cumplimiento · "+safe(marco),x0,13);
  doc.setFont("helvetica","normal"); doc.setFontSize(9);
  doc.text((norma?safe(norma)+"  ·  ":"")+"Vista: "+S.view+"  ·  Dificultad: "+S.diff+"  ·  GRCreal  ·  "+new Date().toLocaleDateString("es-ES"),x0,20);

  // --- panel resumen (gauge % + madurez + distribución) ---
  var y=38;
  // gran número %
  doc.setTextColor(0,57,85); doc.setFont("helvetica","bold"); doc.setFontSize(40);
  doc.text(sc.pct+"%",x0,y+6);
  doc.setFontSize(11); doc.setTextColor(90);
  doc.setFont("helvetica","normal"); doc.text("Cumplimiento global",x0,y+13);
  doc.setFont("helvetica","bold"); doc.setTextColor(0,57,85);
  doc.text("Madurez: "+mad.t,x0,y+19);

  // barra de distribución de estados (gráfico)
  var bx=x0+70, bw=innerW-70, by=y-2, bh=9;
  var seg=[["cumple",r.cumple],["parcial",r.parcial],["nocumple",r.nocumple],["na",r.na]];
  var tot=all.length||1, cx=bx;
  doc.setDrawColor(220); doc.rect(bx,by,bw,bh);
  seg.forEach(function(s){
    var w=bw*(s[1]/tot); if(w<=0)return;
    var c=EST_COLOR[s[0]]; doc.setFillColor(c[0],c[1],c[2]); doc.rect(cx,by,w,bh,"F"); cx+=w;
  });
  // leyenda
  doc.setFontSize(8); var lx=bx, ly=by+bh+6;
  seg.forEach(function(s){
    var c=EST_COLOR[s[0]]; doc.setFillColor(c[0],c[1],c[2]); doc.rect(lx,ly-3,3,3,"F");
    doc.setTextColor(70); doc.text(EST_TXT[s[0]]+" "+s[1],lx+5,ly); lx+=34;
  });
  doc.setTextColor(70); doc.text("Sin evaluar "+r.pend,lx,ly);

  // --- gráfico: cumplimiento por sección ---
  y=y+30;
  doc.setFont("helvetica","bold"); doc.setTextColor(0,57,85); doc.setFontSize(11);
  doc.text("Cumplimiento por sección",x0,y); y+=6;
  doc.setFontSize(8); doc.setFont("helvetica","normal");
  var labelW=58, barX=x0+labelW, barW=innerW-labelW-12;
  (S.data.sections||[]).forEach(function(sec){
    var items=itemsVis(sec); if(!items.length)return;
    var ss=scoreOf(items);
    if(y>275){doc.addPage();y=18;}
    doc.setTextColor(40);
    var lab=safe(secRef(sec)||sec.title||""); if(lab.length>26)lab=lab.slice(0,25)+"…".replace("…","...");
    doc.text(lab,x0,y+3.2);
    doc.setDrawColor(225); doc.setFillColor(238,243,245); doc.rect(barX,y,barW,5,"F");
    var col = ss.pct>=75?[30,132,73] : ss.pct>=50?[146,64,14] : [153,27,27];
    doc.setFillColor(col[0],col[1],col[2]); doc.rect(barX,y,barW*(ss.pct/100),5,"F");
    doc.setTextColor(40); doc.text(ss.pct+"%",barX+barW+2,y+4);
    y+=8;
  });

  // --- tabla por sección ---
  y+=4;
  (S.data.sections||[]).forEach(function(sec){
    var items=itemsVis(sec); if(!items.length)return;
    if(y>272){doc.addPage();y=18;}
    doc.setFillColor(0,57,85); doc.rect(x0,y-4,innerW,6.5,"F");
    doc.setTextColor(255); doc.setFont("helvetica","bold"); doc.setFontSize(8.5);
    doc.text(safe(sec.title||secTit(sec)),x0+1.5,y); y+=6;
    doc.setFontSize(8); doc.setFont("helvetica","normal");
    items.forEach(function(it){
      if(y>284){doc.addPage();y=18;}
      var v=S.estados[it.code]; var c=v?EST_COLOR[v]:[150,150,150];
      doc.setTextColor(40); doc.setFont("helvetica","normal");
      var nm=safe(it.code+"  "+it.text); if(nm.length>82)nm=nm.slice(0,80)+"...";
      doc.text(nm,x0+1,y);
      doc.setTextColor(c[0],c[1],c[2]); doc.setFont("helvetica","bold");
      doc.text(v?EST_TXT[v]:"—", W-x0-20, y);
      y+=4.6;
      var e=S.evid[it.code];
      if(e){doc.setTextColor(115);doc.setFont("helvetica","italic");var t=safe("ev: "+e);if(t.length>95)t=t.slice(0,93)+"...";doc.text(t,x0+4,y);y+=4.6;}
      doc.setDrawColor(228); doc.line(x0,y-1.8,W-x0,y-1.8);
    });
    y+=3;
  });

  // --- brechas ---
  var gaps=[]; all.forEach(function(it){var v=S.estados[it.code]; if(v==="nocumple"||v==="parcial")gaps.push(it.code+" "+it.text);});
  if(y>255){doc.addPage();y=18;}
  y+=4; doc.setFont("helvetica","bold"); doc.setTextColor(178,58,46); doc.setFontSize(10);
  doc.text("Brechas a cerrar: "+gaps.length,x0,y); y+=6;
  doc.setFont("helvetica","normal"); doc.setTextColor(60); doc.setFontSize(8);
  gaps.forEach(function(g){if(y>286){doc.addPage();y=18;}var t=safe("- "+g);if(t.length>98)t=t.slice(0,96)+"...";doc.text(t,x0,y);y+=4.8;});

  doc.save("informe-checklist-"+safe(marco).toLowerCase().replace(/[^a-z0-9]+/g,"-")+".pdf");
}

if(document.readyState!=="loading") boot(); else document.addEventListener("DOMContentLoaded",boot);
})();
