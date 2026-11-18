(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const cv = () => window.CVBuilder;
  const HISTORY_KEY = "cvbuilder-history-v1";
  const THEME_KEY = "cvbuilder-color-mode";
  const sectionIds = ["cvSummarySection","cvExperienceSection","cvEducationSection","cvSoftSkillsSection","cvCertificationsSection","cvProjectsSection"];
  const sectionNames = {
    cvSummarySection:"Perfil profissional",
    cvExperienceSection:"Experiência profissional",
    cvEducationSection:"Formação académica",
    cvSoftSkillsSection:"Competências pessoais",
    cvCertificationsSection:"Certificações",
    cvProjectsSection:"Projectos"
  };

  function notify(message){ if(cv()) cv().toast(message); }
  function readHistory(){
    try { const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]"); return Array.isArray(value)?value:[]; }
    catch(error){ return []; }
  }
  function writeHistory(items){ localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,20))); }
  function snapshot(){
    const app=cv();
    return {version:1,data:app.getData(),theme:app.state.theme,photo:app.state.photo,
      experience:app.state.experience,education:app.state.education,languages:app.state.languages,
      savedAt:new Date().toISOString()};
  }
  function renderHistory(){
    const list=$("#versionHistory");
    if(!list)return;
    const items=readHistory();
    list.innerHTML="";
    if(!items.length){list.textContent="Ainda não existem versões guardadas.";return;}
    items.forEach((item,index)=>{
      const row=document.createElement("div"); row.className="feature-list-item";
      const date=new Date(item.savedAt);
      const label=document.createElement("span");
      label.textContent=(item.data?.fullName||"Currículo")+" — "+(Number.isNaN(date.getTime())?"Data desconhecida":date.toLocaleString("pt-PT"));
      const actions=document.createElement("div");
      const restore=document.createElement("button");restore.type="button";restore.textContent="Restaurar";
      restore.addEventListener("click",()=>{
        if(!confirm("Restaurar esta versão? Os dados actuais serão substituídos."))return;
        cv().applyImportedData(item); notify("Versão restaurada com sucesso."); renderHistory();
      });
      const remove=document.createElement("button");remove.type="button";remove.textContent="Eliminar";
      remove.addEventListener("click",()=>{const next=readHistory();next.splice(index,1);writeHistory(next);renderHistory();});
      actions.append(restore,remove);row.append(label,actions);list.appendChild(row);
    });
  }
  $("#saveVersionBtn")?.addEventListener("click",()=>{
    try{
      const items=readHistory();items.unshift(snapshot());writeHistory(items);
      renderHistory();notify("Nova versão guardada no histórico.");
    }catch(error){notify("Não foi possível guardar a versão. Verifique o espaço do navegador.");}
  });
  renderHistory();

  function setColorMode(mode){
    const dark=mode==="dark";
    document.body.classList.toggle("dark-mode",dark);
    const button=$("#themeToggle");
    if(button){button.textContent=dark?"Modo claro ☀":"Modo escuro ☾";button.setAttribute("aria-pressed",String(dark));}
    try{localStorage.setItem(THEME_KEY,dark?"dark":"light");}catch(error){}
  }
  let initialMode="light";
  try{initialMode=localStorage.getItem(THEME_KEY)||"light";}catch(error){}
  setColorMode(initialMode);
  $("#themeToggle")?.addEventListener("click",()=>setColorMode(document.body.classList.contains("dark-mode")?"light":"dark"));

  $("#tailorFromFeatures")?.addEventListener("click",()=>{
    const description=$("#featureJobDescription").value.trim();
    if(description.length<80){notify("Cole uma descrição de vaga com pelo menos 80 caracteres.");return;}
    $("#aiJobDescription").value=description;
    $("#aiTailorJob").click();
    $("#aiSection").scrollIntoView({behavior:"smooth",block:"start"});
  });

  function generateLetter(){
    const data=cv().getData();
    const role=$("#letterRole").value.trim()||data.jobTitle||"a oportunidade anunciada";
    const company=$("#letterCompany").value.trim()||"a vossa organização";
    const contact=data.fullName||"Candidato(a)";
    const experience=cv().state.experience.filter(x=>x.title||x.company).slice(0,2)
      .map(x=>[x.title,x.company].filter(Boolean).join(" na ")).join(" e ");
    const skills=(data.skills||"").split(/[\n,;]/).map(x=>x.trim()).filter(Boolean).slice(0,5).join(", ");
    const intro=data.summary||"Tenho interesse em contribuir com dedicação, capacidade de aprendizagem e sentido de responsabilidade.";
    const paragraphs=[
      "Exmos. Senhores,",
      "Venho por este meio apresentar a minha candidatura à função de "+role+" na "+company+".",
      intro,
      experience?"Ao longo do meu percurso, desenvolvi experiência em "+experience+".":"",
      skills?"Entre as competências que posso colocar ao serviço da equipa destacam-se "+skills+".":"",
      "Acredito que o meu perfil poderá contribuir positivamente para os objectivos da equipa. Terei todo o gosto em aprofundar a minha experiência e motivação numa entrevista.",
      "Agradeço desde já a atenção dispensada e fico disponível para prestar informações adicionais.",
      "Com os melhores cumprimentos,",
      contact,
      [data.email,data.phone].filter(Boolean).join(" | ")
    ].filter(Boolean);
    $("#coverLetterOutput").value=paragraphs.join("\n\n");
    notify("Carta de apresentação gerada. Reveja e personalize antes de enviar.");
  }
  $("#generateLetterBtn")?.addEventListener("click",generateLetter);
  $("#copyLetterBtn")?.addEventListener("click",async()=>{
    const text=$("#coverLetterOutput").value;
    if(!text.trim()){notify("Gere primeiro a carta de apresentação.");return;}
    try{await navigator.clipboard.writeText(text);notify("Carta copiada.");}
    catch(error){$("#coverLetterOutput").select();notify("Seleccione o texto e copie manualmente.");}
  });
  $("#downloadLetterBtn")?.addEventListener("click",()=>{
    const text=$("#coverLetterOutput").value;
    if(!text.trim()){notify("Gere primeiro a carta de apresentação.");return;}
    const blob=new Blob([text],{type:"text/plain;charset=utf-8"});
    const url=URL.createObjectURL(blob);const link=document.createElement("a");
    link.href=url;link.download="carta-de-apresentacao.txt";link.click();URL.revokeObjectURL(url);
  });

  function applySectionOrder(order){
    const main=$("#cvPreview .cv-main");
    if(!main)return;
    order.filter(id=>sectionIds.includes(id)).forEach(id=>{
      const element=$("#"+id);if(element&&element.parentElement===main)main.appendChild(element);
    });
    sectionIds.filter(id=>!order.includes(id)).forEach(id=>{const element=$("#"+id);if(element&&element.parentElement===main)main.appendChild(element);});
  }
  function currentOrder(){
    const main=$("#cvPreview .cv-main");
    return [...main.children].map(el=>el.id).filter(id=>sectionIds.includes(id));
  }
  function renderOrder(){
    const list=$("#sectionOrderList");if(!list)return;
    list.innerHTML="";
    currentOrder().forEach((id,index,all)=>{
      const row=document.createElement("div");row.className="feature-list-item";
      const name=document.createElement("span");name.textContent=sectionNames[id]||id;
      const controls=document.createElement("div");
      [["↑",-1],["↓",1]].forEach(([label,delta])=>{
        const button=document.createElement("button");button.type="button";button.textContent=label;
        button.disabled=index+delta<0||index+delta>=all.length;
        button.addEventListener("click",()=>{
          const next=currentOrder();const target=index+delta;
          [next[index],next[target]]=[next[target],next[index]];
          applySectionOrder(next);renderOrder();
          try{localStorage.setItem("cvbuilder-section-order",JSON.stringify(next));}catch(error){}
        });
        controls.appendChild(button);
      });
      row.append(name,controls);list.appendChild(row);
    });
  }
  let savedOrder=[];
  try{savedOrder=JSON.parse(localStorage.getItem("cvbuilder-section-order")||"[]");}catch(error){}
  if(Array.isArray(savedOrder)&&savedOrder.length)applySectionOrder(savedOrder);
  renderOrder();
  const preview=$("#cvPreview");
  if(preview&&"MutationObserver"in window){
    new MutationObserver(()=>renderOrder()).observe(preview,{childList:true,subtree:true});
  }
})();