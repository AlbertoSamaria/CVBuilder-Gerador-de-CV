const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  theme: "modern",
  photo: "",
  experience: [],
  education: [],
  languages: [],
  zoom: 1
};

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
function update(){renderCV();}

function saveData(){
  localStorage.setItem("cvbuilder-data",JSON.stringify({data:getData(),...state}));
  toast("Currículo guardado neste dispositivo.");
}
function loadData(){
  const raw=localStorage.getItem("cvbuilder-data");
  if(!raw){toast("Não existe um currículo guardado.");return}
  try{
    const s=JSON.parse(raw);
    Object.entries(s.data||{}).forEach(([k,v])=>{if($("#"+k))$("#"+k).value=v});
    state.theme=s.theme||"modern";state.photo=s.photo||"";state.experience=s.experience||[];state.education=s.education||[];state.languages=s.languages||[];
    renderForms();setTheme(state.theme);update();toast("Currículo carregado.");
  }catch(e){toast("Não foi possível carregar os dados.")}
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
$("#printBtn").onclick=()=>window.print();
$("#resetBtn").onclick=()=>{
  if(!confirm("Limpar todos os dados do currículo?"))return;
  Object.keys(defaults).forEach(k=>{if($("#"+k))$("#"+k).value=""});
  state.photo="";state.experience=[];state.education=[];state.languages=[];setTheme("modern");renderForms();update();toast("Formulário limpo.");
};
$("#photoInput").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>3*1024*1024){toast("A foto deve ter no máximo 3 MB.");return}
  const reader=new FileReader();reader.onload=()=>{state.photo=reader.result;update()};reader.readAsDataURL(file);
};
$("#removePhotoBtn").onclick=()=>{state.photo="";$("#photoInput").value="";update()};
$$(".zoom-btn").forEach(b=>b.onclick=()=>{
  state.zoom=Math.max(.55,Math.min(1.3,state.zoom+Number(b.dataset.zoom)));
  $("#cvPreview").style.transform=`scale(${state.zoom})`;
  $("#zoomText").textContent=Math.round(state.zoom*100)+"%";
});

window.CVBuilder = { state, getData, renderForms, update, toast };
renderForms();update();
