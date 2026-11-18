const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  theme: "modern",
  photo: "",
  experience: [],
  education: [],
  languages: [],
  zoom: window.matchMedia("(max-width: 650px)").matches ? 0.55 : 1
};
let zoomAdjusted = false;

const defaults = {
  fullName:"", jobTitle:"", email:"", phone:"", location:"", linkedin:"",
  summary:"", skills:"", softSkills:"", certifications:"", projects:""
};

function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function lines(v=""){return v.split(/\n|,/).map(x=>x.trim()).filter(Boolean)}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}

function repeatForm(type, item, i){
  if(type==="experience") return `<div class="repeat-card">
    <div class="repeat-head"><strong>Experiência ${i+1}</strong><button class="remove-btn" data-remove="${type}" data-index="${i}">×</button></div>
    <div class="grid two">
      <label>Cargo<input data-type="${type}" data-index="${i}" data-field="title" value="${esc(item.title)}" placeholder="Ex.: Técnico de Informática"></label>
      <label>Empresa<input data-type="${type}" data-index="${i}" data-field="company" value="${esc(item.company)}" placeholder="Nome da empresa"></label>
    </div>
    <div class="grid two">
      <label>Período<input data-type="${type}" data-index="${i}" data-field="date" value="${esc(item.date)}" placeholder="2024 — Atual"></label>
      <label>Local<input data-type="${type}" data-index="${i}" data-field="location" value="${esc(item.location)}" placeholder="Luanda, Angola"></label>
    </div>
    <label>Descrição<textarea data-type="${type}" data-index="${i}" data-field="description" rows="3" placeholder="Principais responsabilidades e resultados...">${esc(item.description)}</textarea></label>
  </div>`;
  if(type==="education") return `<div class="repeat-card">
    <div class="repeat-head"><strong>Formação ${i+1}</strong><button class="remove-btn" data-remove="${type}" data-index="${i}">×</button></div>
    <div class="grid two">
      <label>Curso / grau<input data-type="${type}" data-index="${i}" data-field="title" value="${esc(item.title)}" placeholder="Ex.: Engenharia Informática"></label>
      <label>Instituição<input data-type="${type}" data-index="${i}" data-field="school" value="${esc(item.school)}" placeholder="Nome da instituição"></label>
    </div>
    <label>Período<input data-type="${type}" data-index="${i}" data-field="date" value="${esc(item.date)}" placeholder="2021 — 2025"></label>
  </div>`;
  return `<div class="repeat-card">
    <div class="repeat-head"><strong>Idioma ${i+1}</strong><button class="remove-btn" data-remove="${type}" data-index="${i}">×</button></div>
    <div class="grid two">
      <label>Idioma<input data-type="${type}" data-index="${i}" data-field="name" value="${esc(item.name)}" placeholder="Português"></label>
      <label>Nível<input data-type="${type}" data-index="${i}" data-field="level" value="${esc(item.level)}" placeholder="Nativo / C1 / B2"></label>
    </div>
  </div>`;
}

function renderForms(){
  $("#experienceForm").innerHTML = state.experience.map((x,i)=>repeatForm("experience",x,i)).join("");
  $("#educationForm").innerHTML = state.education.map((x,i)=>repeatForm("education",x,i)).join("");
  $("#languagesForm").innerHTML = state.languages.map((x,i)=>repeatForm("languages",x,i)).join("");
  $$("[data-remove]").forEach(b=>b.onclick=()=>{
    state[b.dataset.remove].splice(+b.dataset.index,1); renderForms(); update();
  });
  $$("[data-type]").forEach(el=>el.addEventListener("input",()=>{
    state[el.dataset.type][+el.dataset.index][el.dataset.field]=el.value; update();
  }));
}

function getData(){
  const d={...defaults};
  Object.keys(d).forEach(k=>{const el=$("#"+k); if(el)d[k]=el.value});
  return d;
}

function renderCV(){
  const d=getData();
  $("#cvName").textContent=d.fullName||"O seu nome";
  $("#cvJob").textContent=d.jobTitle||"Cargo profissional";
  $("#cvSummary").textContent=d.summary||"Adicione um resumo profissional no formulário.";
  $("#cvContact").innerHTML=[
    d.email,d.phone,d.location,d.linkedin
  ].filter(Boolean).map(x=>`<div class="contact-item">${esc(x)}</div>`).join("") || `<div class="contact-item">Adicione os seus dados de contacto.</div>`;

  const skills=lines(d.skills);
  $("#cvSkillsBlock").style.display=skills.length?"":"none";
  $("#cvSkills").innerHTML=skills.map(x=>`<div class="skill"><div class="skill-name">${esc(x)}</div><div class="skill-bar"><i></i></div></div>`).join("");

  $("#cvLanguagesBlock").style.display=state.languages.length?"":"none";
  $("#cvLanguages").innerHTML=state.languages.map(x=>`<div class="lang"><span>${esc(x.name)}</span><span>${esc(x.level)}</span></div>`).join("");

  $("#cvExperience").innerHTML=state.experience.filter(x=>x.title||x.company||x.description).map(x=>`
    <div class="entry"><div class="entry-head"><div><div class="entry-title">${esc(x.title)}</div><div class="entry-company">${esc(x.company)}</div></div><div class="entry-date">${esc(x.date)}</div></div>
    <div class="entry-desc">${esc(x.description)}</div></div>`).join("");
  $("#cvExperienceSection").style.display=state.experience.some(x=>x.title||x.company||x.description)?"":"none";

  $("#cvEducation").innerHTML=state.education.filter(x=>x.title||x.school).map(x=>`
    <div class="entry"><div class="entry-head"><div><div class="entry-title">${esc(x.title)}</div><div class="entry-company">${esc(x.school)}</div></div><div class="entry-date">${esc(x.date)}</div></div></div>`).join("");
  $("#cvEducationSection").style.display=state.education.some(x=>x.title||x.school)?"":"none";

  const soft=lines(d.softSkills);
  $("#cvSoftSkillsSection").style.display=soft.length?"":"none";
  $("#cvSoftSkills").innerHTML=`<div class="tag-list">${soft.map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>`;

  const cert=lines(d.certifications);
  $("#cvCertificationsSection").style.display=cert.length?"":"none";
  $("#cvCertifications").innerHTML=cert.map(x=>`<div class="entry-desc">• ${esc(x)}</div>`).join("");

  const proj=lines(d.projects);
  $("#cvProjectsSection").style.display=proj.length?"":"none";
  $("#cvProjects").innerHTML=proj.map(x=>`<div class="entry-desc">• ${esc(x)}</div>`).join("");

  const img=$("#photoPreview");
  const cvImg=$("#cvPhoto");
  if(state.photo){img.src=state.photo;img.style.display="block";$("#photoPlaceholder").style.display="none";cvImg.src=state.photo;cvImg.style.display="block"}
  else{img.style.display="none";$("#photoPlaceholder").style.display="";cvImg.style.display="none"}

  $("#cvPreview").className=`cv ${state.theme}`;
  updateProgress();
}

function updateProgress(){
  const d=getData();
  let total=Object.keys(defaults).length+3, filled=Object.values(d).filter(Boolean).length;
  filled += state.experience.some(x=>x.title||x.company||x.description)?1:0;
  filled += state.education.some(x=>x.title||x.school)?1:0;
  filled += state.languages.some(x=>x.name)?1:0;
  const p=Math.min(100,Math.round(filled/total*100));
  $("#progressBar").style.width=p+"%";$("#progressText").textContent=p+"%";
}
let autosaveTimer = null;
function persistDraft(){
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(()=>{
    try {
      const backup={version:1,data:getData(),...state,savedAt:new Date().toISOString()};
      localStorage.setItem("cvbuilder-data",JSON.stringify(backup));
    } catch(error) {
      console.warn("Não foi possível guardar o rascunho automaticamente.",error);
    }
  },450);
}
function update(){renderCV();persistDraft();}

function saveData(){
  const backup={version:1,data:getData(),...state,exportedAt:new Date().toISOString()};
  let localSaved=false;
  try{localStorage.setItem("cvbuilder-data",JSON.stringify(backup));localSaved=true;}
  catch(error){console.warn("Armazenamento local indisponível; será criada apenas a cópia de segurança.",error);}
  try{
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const base=(getData().fullName||"curriculo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();
    a.href=url;a.download=(base||"curriculo")+"-cvbuilder.json";
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast(localSaved?"Currículo guardado e cópia de segurança descarregada.":"Cópia de segurança descarregada; o navegador não permitiu guardar localmente.");
  }catch(error){console.error(error);toast(localSaved?"Currículo guardado no navegador, mas não foi possível descarregar a cópia.":"Não foi possível guardar nem exportar o currículo.");}
}

function applyImportedData(s){
  if(!s||typeof s!=="object"||Array.isArray(s)||!s.data||typeof s.data!=="object"||Array.isArray(s.data))throw new Error("Ficheiro de currículo inválido.");
  const limitText=(value,max)=>typeof value==="string"?value.slice(0,max):"";
  Object.keys(defaults).forEach(k=>{if($("#"+k))$("#"+k).value=limitText(s.data[k],k==="summary"?5000:3000)});
  state.theme=["modern","classic","minimal","executive","corporate","elegant","tech","creative","academic","ats","green","bold","international"].includes(s.theme)?s.theme:"modern";
  state.photo=typeof s.photo==="string"&&s.photo.length<=4200000&&/^data:image\/(?:png|jpeg|webp);base64,/i.test(s.photo)?s.photo:"";
  const cleanItems=(items,fields,maxItems=30)=>Array.isArray(items)?items.slice(0,maxItems).filter(item=>item&&typeof item==="object"&&!Array.isArray(item)).map(item=>Object.fromEntries(fields.map(([key,max])=>[key,limitText(item[key],max)]))):[];
  state.experience=cleanItems(s.experience,[["title",200],["company",200],["date",100],["location",150],["description",4000]]);
  state.education=cleanItems(s.education,[["title",200],["school",200],["date",100]]);
  state.languages=cleanItems(s.languages,[["name",100],["level",100]],20);
  renderForms();setTheme(state.theme);update();
}

function extractSection(text, names){
  const rows=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const wanted=names.map(x=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase());
  const stop=["experiencia","formacao","educacao","competencias","habilidades","idiomas","linguas","certificacoes","projetos","contactos","contato","referencias"];
  for(let i=0;i<rows.length;i++){
    const heading=rows[i].replace(/[:：]$/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(!wanted.includes(heading))continue;
    const result=[];
    for(let j=i+1;j<rows.length;j++){
      const next=rows[j].replace(/[:：]$/,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      if(stop.some(name=>next===name||next.startsWith(name+" ")))break;
      result.push(rows[j]);
    }
    return result.join("\n").trim();
  }
  return "";
}

function parseResumeText(raw){
  const text=String(raw||"").replace(/\u00a0/g," ").replace(/\r/g,"\n");
  const rows=text.split(/\n/).map(x=>x.trim()).filter(Boolean);
  const data={...defaults};
  const email=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone=text.match(/(?:\+?\d[\d\s()./-]{7,}\d)/);
  const linkedin=text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,)]+/i);
  if(email)data.email=email[0];
  if(phone)data.phone=phone[0].trim();
  if(linkedin)data.linkedin=linkedin[0].replace(/[.,;]+$/,"");
  const headings=/^(curr[ií]culo|curriculum vitae|resume|cv|perfil|resumo|experi[eê]ncia|forma[cç][aã]o|educa[cç][aã]o|compet[eê]ncias|habilidades|idiomas|l[ií]nguas|contactos|contato|certifica[cç][oõ]es|projetos)$/i;
  const candidates=rows.filter(x=>!headings.test(x)&&!/@/.test(x)&&!/linkedin\.com/i.test(x)&&!/(?:\+?\d[\d\s()./-]{7,}\d)/.test(x));
  if(candidates[0])data.fullName=candidates[0].slice(0,100);
  if(candidates[1]&&candidates[1].length<90)data.jobTitle=candidates[1];
  data.summary=extractSection(text,["perfil profissional","resumo profissional","sobre mim","perfil","resumo","objetivo profissional","objectivo profissional"]);
  data.skills=extractSection(text,["competências técnicas","competencias tecnicas","competências","competencias","habilidades","skills"]);
  data.softSkills=extractSection(text,["competências pessoais","competencias pessoais","soft skills"]);
  data.certifications=extractSection(text,["certificações","certificacoes"]);
  data.projects=extractSection(text,["projetos","projectos","portfólio","portfolio"]);
  const loc=rows.find(x=>/\b(luanda|angola|lisboa|porto|benguela|huambo|lobito|namibe|cabinda)\b/i.test(x)&&x.length<100);
  if(loc)data.location=loc;
  const exp=extractSection(text,["experiência profissional","experiencia profissional","experiência","experiencia","histórico profissional"]);
  if(exp){
    const e=exp.split("\n").map(x=>x.trim()).filter(Boolean);
    const date=e.find(x=>/\b(19|20)\d{2}\b/.test(x))||"";
    state.experience=[{title:e[0]||"",company:e[1]||"",date:date,location:"",description:e.slice(2).filter(x=>x!==date).join("\n")}];
  }else state.experience=[];
  const edu=extractSection(text,["formação académica","formacao academica","formação","formacao","educação","educacao","education"]);
  if(edu){
    const e=edu.split("\n").map(x=>x.trim()).filter(Boolean);
    state.education=[{title:e[0]||"",school:e[1]||"",date:e.find(x=>/\b(19|20)\d{2}\b/.test(x))||""}];
  }else state.education=[];
  const langs=extractSection(text,["idiomas","línguas","linguas","languages"]);
  state.languages=langs?langs.split("\n").filter(Boolean).slice(0,10).map(x=>{const p=x.split(/[:|–—-]/);return{name:(p[0]||"").trim(),level:(p[1]||"").trim()}}):[];
  if(!Object.values(data).some(Boolean)&&!state.experience.length&&!state.education.length&&!state.languages.length)throw new Error("Não foi possível reconhecer dados neste documento.");
  return {data:data,theme:"modern",photo:"",experience:state.experience,education:state.education,languages:state.languages};
}

async function importCVFile(file){
  if(!file)return;
  if(file.size>15*1024*1024){toast("O ficheiro não pode exceder 15 MB.");return;}
  const ext=file.name.toLowerCase().split(".").pop();
  try{
    if(ext==="json"){
      const saved=JSON.parse(await file.text());
      applyImportedData(saved);
    }else if(ext==="docx"){
      if(!window.mammoth)throw new Error("A biblioteca Word não carregou. Verifique a ligação à Internet e actualize a página.");
      const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
      applyImportedData(parseResumeText(result.value));
    }else if(ext==="pdf"){
      if(!window.pdfjsLib)throw new Error("A biblioteca PDF não carregou. Verifique a ligação à Internet e actualize a página.");
      pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      if(pdf.numPages>30)throw new Error("O PDF tem mais de 30 páginas. Utilize um currículo mais curto.");
      let extracted="";
      for(let i=1;i<=pdf.numPages;i++){
        const page=await pdf.getPage(i);
        const content=await page.getTextContent();
        const ordered=content.items.filter(item=>item.str&&item.str.trim()).sort((a,b)=>{
          const ay=a.transform&&a.transform[5]||0,by=b.transform&&b.transform[5]||0;
          if(Math.abs(by-ay)>2)return by-ay;
          return (a.transform&&a.transform[4]||0)-(b.transform&&b.transform[4]||0);
        });
        const textLines=[];
        let currentY=null,currentLine=[];
        ordered.forEach(item=>{
          const y=item.transform&&item.transform[5]||0;
          if(currentY!==null&&Math.abs(y-currentY)>2){textLines.push(currentLine.join(" "));currentLine=[];}
          currentY=y;currentLine.push(item.str.trim());
        });
        if(currentLine.length)textLines.push(currentLine.join(" "));
        extracted+=textLines.join("\n")+"\n";
      }
      if(extracted.replace(/\s/g,"").length<30)throw new Error("Este PDF parece digitalizado como imagem. É necessário OCR; importe um PDF com texto seleccionável.");
      applyImportedData(parseResumeText(extracted));
    }else throw new Error("Formato não suportado. Seleccione PDF, Word (.docx) ou cópia CVBuilder (.json).");
    localStorage.setItem("cvbuilder-data",JSON.stringify({data:getData(),...state}));
    toast("Currículo importado. Reveja os campos preenchidos.");
  }catch(error){console.error(error);toast(error.message||"Não foi possível importar o documento.");}
}


async function exportWord(){
  const lib=window.docx;
  if(!lib||!lib.Document||!lib.Packer){
    toast("A biblioteca Word não carregou. Verifique a ligação à Internet e actualize a página.");
    return;
  }
  const button=$("#wordBtn");
  button.disabled=true;
  const originalLabel=button.textContent;
  button.textContent="A gerar Word...";
  try{
    const d=getData();
    const children=[];
    const addParagraph=(text,options={})=>{
      const value=String(text||"").trim();
      if(!value)return;
      children.push(new lib.Paragraph({
        children:[new lib.TextRun({text:value,bold:!!options.bold,color:options.color||"263445",size:options.size||21})],
        spacing:{after:options.after??90,before:options.before??0},
        ...(options.heading?{heading:options.heading}:{})
      }));
    };
    const addSection=(title)=>{
      children.push(new lib.Paragraph({
        text:title,
        heading:lib.HeadingLevel.HEADING_1,
        spacing:{before:260,after:100},
        border:{bottom:{color:"D7DEE8",space:5,style:lib.BorderStyle.SINGLE,size:5}}
      }));
    };
    const addLines=(value)=>{
      lines(value||"").forEach(item=>addParagraph(item,{after:55}));
    };

    addParagraph(d.fullName||"Currículo", {bold:true,size:36,after:70,color:"17233B"});
    if(d.jobTitle)addParagraph(d.jobTitle,{bold:true,size:24,color:"315B91",after:130});
    const contacts=[d.email,d.phone,d.location,d.linkedin].filter(Boolean);
    if(contacts.length)addParagraph(contacts.join("  |  "),{size:18,color:"536174",after:180});
    if(d.summary){addSection("Perfil profissional");addParagraph(d.summary,{size:21,after:120});}

    if(state.experience.some(x=>x.title||x.company||x.description)){
      addSection("Experiência profissional");
      state.experience.filter(x=>x.title||x.company||x.description).forEach(x=>{
        addParagraph([x.title,x.company].filter(Boolean).join(" — "),{bold:true,size:22,after:35});
        const meta=[x.date,x.location].filter(Boolean).join(" | ");
        if(meta)addParagraph(meta,{size:18,color:"667085",after:55});
        addLines(x.description);
      });
    }
    if(state.education.some(x=>x.title||x.school)){
      addSection("Formação académica");
      state.education.filter(x=>x.title||x.school).forEach(x=>{
        addParagraph([x.title,x.school].filter(Boolean).join(" — "),{bold:true,size:21,after:35});
        if(x.date)addParagraph(x.date,{size:18,color:"667085",after:65});
      });
    }
    if(d.skills){addSection("Competências técnicas");addLines(d.skills);}
    if(d.softSkills){addSection("Competências pessoais");addLines(d.softSkills);}
    if(state.languages.some(x=>x.name||x.level)){
      addSection("Idiomas");
      state.languages.filter(x=>x.name||x.level).forEach(x=>addParagraph([x.name,x.level].filter(Boolean).join(" — "),{after:55}));
    }
    if(d.certifications){addSection("Certificações");addLines(d.certifications);}
    if(d.projects){addSection("Projetos e portfólio");addLines(d.projects);}

    const documentFile=new lib.Document({
      creator:"CVBuilder",
      title:"Currículo - "+(d.fullName||"Utilizador"),
      description:"Currículo criado com CVBuilder",
      styles:{default:{document:{run:{font:"Arial",size:21,color:"263445"}}}},
      sections:[{
        properties:{page:{
          size:{width:11906,height:16838},
          margin:{top:850,right:950,bottom:850,left:950}
        }},
        children
      }]
    });
    const blob=await lib.Packer.toBlob(documentFile);
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    const base=(d.fullName||"curriculo").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/gi,"-").toLowerCase();
    link.href=url;link.download=(base||"curriculo")+"-cvbuilder.docx";
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast("Documento Word (.docx) exportado com sucesso.");
  }catch(error){
    console.error(error);
    toast("Não foi possível gerar o documento Word.");
  }finally{
    button.disabled=false;
    button.textContent=originalLabel;
  }
}

function loadData(){
  const picker=$("#cvFileInput");
  if(picker){picker.click();return;}
  const raw=localStorage.getItem("cvbuilder-data");
  if(!raw){toast("Não existe um currículo guardado.");return}
  try{applyImportedData(JSON.parse(raw));toast("Currículo carregado.");}
  catch(e){toast("Não foi possível carregar os dados.");}
}

function setTheme(theme){
  state.theme=theme;
  $$(".style-option").forEach(b=>b.classList.toggle("active",b.dataset.theme===theme));
  $("#cvPreview").className=`cv ${theme}`;
}

$("#addExperience").onclick=()=>{state.experience.push({title:"",company:"",date:"",location:"",description:""});renderForms();update()}
$("#addEducation").onclick=()=>{state.education.push({title:"",school:"",date:""});renderForms();update()}
$("#addLanguage").onclick=()=>{state.languages.push({name:"",level:""});renderForms();update()}
$$(".style-option").forEach(b=>b.onclick=()=>{setTheme(b.dataset.theme);update()});
$("#saveBtn").onclick=saveData;$("#loadBtn").onclick=loadData;
const cvFileInput=$("#cvFileInput");
if(cvFileInput)cvFileInput.onchange=async e=>{await importCVFile(e.target.files[0]);e.target.value="";};
$("#printBtn").onclick=()=>window.print();
$("#wordBtn").onclick=exportWord;
$("#resetBtn").onclick=()=>{
  if(!confirm("Limpar todos os dados do currículo?"))return;
  Object.keys(defaults).forEach(k=>{if($("#"+k))$("#"+k).value=""});
  state.photo="";state.experience=[];state.education=[];state.languages=[];state.zoom=window.matchMedia("(max-width: 650px)").matches?0.55:1;zoomAdjusted=false;
  $("#photoInput").value="";$("#cvPreview").style.transform="";$("#zoomText").textContent=Math.round(state.zoom*100)+"%";
  setTheme("modern");renderForms();update();
  clearTimeout(autosaveTimer);
  try{localStorage.removeItem("cvbuilder-data");}catch(error){console.warn(error);}
  toast("Formulário limpo.");
};
$("#photoInput").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){toast("Utilize uma fotografia JPG, PNG ou WebP.");e.target.value="";return}
  if(file.size>3*1024*1024){toast("A foto deve ter no máximo 3 MB.");e.target.value="";return}
  const reader=new FileReader();reader.onload=()=>{state.photo=reader.result;update()};reader.onerror=()=>toast("Não foi possível ler a fotografia.");reader.readAsDataURL(file);
};
$("#removePhotoBtn").onclick=()=>{state.photo="";$("#photoInput").value="";update()};
$(".zoom-btn").forEach(b=>b.onclick=()=>{
  zoomAdjusted=true;
  state.zoom=Math.max(.35,Math.min(1.3,state.zoom+Number(b.dataset.zoom)));
  $("#cvPreview").style.transform=`scale(${state.zoom})`;
  $("#zoomText").textContent=Math.round(state.zoom*100)+"%";
});
window.addEventListener("resize",()=>{
  if(zoomAdjusted)return;
  state.zoom=window.matchMedia("(max-width: 650px)").matches?0.55:1;
  $("#cvPreview").style.transform="";
  $("#zoomText").textContent=Math.round(state.zoom*100)+"%";
});

// Actualiza a pré-visualização e agenda a gravação automática dos campos simples.
Object.keys(defaults).forEach(key=>{
  const field=$("#"+key);
  if(field)field.addEventListener("input",update);
});

// Recupera o último rascunho local sem exigir uma acção do utilizador.
function restoreDraft(){
  try{
    const raw=localStorage.getItem("cvbuilder-data");
    if(!raw)return;
    const saved=JSON.parse(raw);
    applyImportedData(saved);
    toast("Último rascunho recuperado automaticamente.");
  }catch(error){
    console.warn("O rascunho guardado não pôde ser recuperado.",error);
  }
}
window.addEventListener("beforeunload",()=>{
  try{
    const backup={version:1,data:getData(),...state,savedAt:new Date().toISOString()};
    localStorage.setItem("cvbuilder-data",JSON.stringify(backup));
  }catch(error){console.warn(error);}
});

window.CVBuilder = { state, getData, renderForms, update, toast, exportWord };
$("#zoomText").textContent=Math.round(state.zoom*100)+"%";
restoreDraft();
renderForms();update();
