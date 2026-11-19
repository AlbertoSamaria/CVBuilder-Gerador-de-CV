(() => {
  "use strict";
  const $=s=>document.querySelector(s);
  const connectButtons=[$("#canvaConnectTop"),$("#canvaConnectBtnPanel")].filter(Boolean);
  const createButtons=[$("#canvaCreateTop"),$("#canvaCreateBtnPanel")].filter(Boolean);
  const connectBtn=connectButtons[0];
  const createBtn=createButtons[0];
  const status=$("#canvaStatus");

  function setStatus(message,type="") {
    if(!status)return;
    status.textContent=message;
    status.className="canva-status"+(type?" "+type:"");
  }

  async function getStatus() {
    try {
      const response=await fetch("/.netlify/functions/canva?action=status",{cache:"no-store"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||"Falha ao consultar o Canva.");
      if(!data.configured) {
        setStatus("Canva ainda não configurado no backend.");
        connectButtons.forEach(button=>button.disabled=true);
        createButtons.forEach(button=>button.disabled=true);
        return;
      }
      if(data.connected) {
        setStatus("Canva ligado. Pode criar um design editável.","success");
        connectBtn.textContent="Canva ligado";
        createButtons.forEach(button=>button.disabled=false);
      } else {
        setStatus("Ligue a sua conta Canva para criar o CV no Canva.");
        createButtons.forEach(button=>button.disabled=true);
      }
    } catch(error) {
      setStatus(error.message||"Não foi possível verificar o Canva.","error");
    }
  }

  connectButtons.forEach(button=>button.addEventListener("click",()=> {
    window.location.href="/.netlify/functions/canva?action=authorize";
  }));

  createButtons.forEach(button=>button.addEventListener("click",async()=> {
    if(!window.CVBuilder) return;
    createButtons.forEach(button=>button.disabled=true);
    setStatus("A preparar o CV editável para o Canva...","loading");
    try {
      const blob=await window.CVBuilder.buildWordBlob();
      const data=window.CVBuilder.getData();
      const form=new FormData();
      const safe=(data.fullName||"curriculo").trim().slice(0,40);
      form.append("title","CV - "+(safe||"Currículo"));
      form.append("file",blob,(safe||"curriculo")+".docx");
      const response=await fetch("/.netlify/functions/canva?action=import",{
        method:"POST",
        body:form
      });
      const result=await response.json().catch(()=>({}));
      if(response.status===401) {
        setStatus("A ligação ao Canva expirou. Ligue novamente a conta.","error");
        createButtons.forEach(button=>button.disabled=false);
        return;
      }
      if(!response.ok) throw new Error(result.error||"Não foi possível enviar o CV para o Canva.");
      setStatus("Importação iniciada. A aguardar o Canva...","loading");
      await pollImport(result.jobId);
    } catch(error) {
      console.error(error);
      setStatus(error.message||"Falha ao criar o design no Canva.","error");
      createButtons.forEach(button=>button.disabled=false);
    }
  });

  async function pollImport(jobId) {
    for(let attempt=0;attempt<12;attempt++) {
      await new Promise(resolve=>setTimeout(resolve,1500));
      const response=await fetch("/.netlify/functions/canva?action=import-status&jobId="+encodeURIComponent(jobId),{cache:"no-store"});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||"Falha ao consultar o Canva.");
      const job=data.job||{};
      if(job.status==="success") {
        const design=job.result?.designs?.[0];
        if(!design?.urls?.edit_url) throw new Error("O Canva concluiu a importação, mas não devolveu o link de edição.");
        setStatus("CV criado no Canva. A abrir o editor...","success");
        window.open(design.urls.edit_url,"_blank","noopener,noreferrer");
        createBtn.disabled=false;
        return;
      }
      if(job.status==="failed") throw new Error(job.error?.message||"O Canva não conseguiu importar este documento.");
      setStatus("A importar para o Canva... ("+(attempt+1)+"/12)","loading");
    }
    throw new Error("A importação está a demorar mais do que o esperado. Tente novamente em alguns instantes.");
  }

  if(new URLSearchParams(location.search).get("canva")==="connected") {
    history.replaceState({},document.title,location.pathname+location.hash);
    setStatus("Canva ligado com sucesso.","success");
  }
  getStatus();
})();
