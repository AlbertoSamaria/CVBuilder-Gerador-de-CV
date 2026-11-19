(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const connectButtons = [$("#canvaConnectTop"), $("#canvaConnectBtnPanel")].filter(Boolean);
  const createButtons = [$("#canvaCreateTop"), $("#canvaCreateBtnPanel")].filter(Boolean);
  const status = $("#canvaStatus");
  const templateSearch = $("#canvaTemplateSearch");
  const loadTemplatesBtn = $("#canvaLoadTemplatesBtn");
  const templateStatus = $("#canvaTemplateStatus");
  const templateGrid = $("#canvaTemplateGrid");
  const autofillPanel = $("#canvaAutofillPanel");
  const autofillFields = $("#canvaAutofillFields");
  const autofillStatus = $("#canvaAutofillStatus");
  const datasetStatus = $("#canvaDatasetStatus");
  const selectedTemplateLabel = $("#canvaSelectedTemplate");
  const autofillBtn = $("#canvaAutofillBtn");
  const closeAutofillBtn = $("#canvaCloseAutofillBtn");

  let currentTemplates = [];
  let selectedTemplate = null;
  let selectedDataset = {};

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.className = "canva-status" + (type ? " " + type : "");
  }

  function setTemplateStatus(message, type = "") {
    if (!templateStatus) return;
    templateStatus.textContent = message;
    templateStatus.className = "canva-template-status" + (type ? " " + type : "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getCvData() {
    return window.CVBuilder?.getData?.() || {};
  }

  function formatExperience(items) {
    if (!Array.isArray(items)) return "";
    return items
      .filter(item => item && (item.title || item.company || item.description))
      .map(item => {
        const heading = [item.title, item.company].filter(Boolean).join(" — ");
        const dates = [item.startDate, item.endDate].filter(Boolean).join(" — ");
        return [heading, dates, item.description].filter(Boolean).join("\n");
      })
      .join("\n\n")
      .slice(0, 5000);
  }

  function formatEducation(items) {
    if (!Array.isArray(items)) return "";
    return items
      .filter(item => item && (item.course || item.school || item.description))
      .map(item => {
        const heading = [item.course, item.school].filter(Boolean).join(" — ");
        const dates = [item.startDate, item.endDate].filter(Boolean).join(" — ");
        return [heading, dates, item.description].filter(Boolean).join("\n");
      })
      .join("\n\n")
      .slice(0, 5000);
  }

  function formatLanguages(items) {
    if (!Array.isArray(items)) return "";
    return items
      .filter(item => item && (item.name || item.level))
      .map(item => [item.name, item.level].filter(Boolean).join(" — "))
      .join(", ")
      .slice(0, 2000);
  }

  function candidateValues(data) {
    return {
      "nome": data.fullName || "",
      "nome completo": data.fullName || "",
      "full name": data.fullName || "",
      "name": data.fullName || "",
      "cargo": data.jobTitle || "",
      "cargo pretendido": data.jobTitle || "",
      "job title": data.jobTitle || "",
      "title": data.jobTitle || "",
      "profissao": data.jobTitle || "",
      "profissão": data.jobTitle || "",
      "perfil": data.summary || "",
      "perfil profissional": data.summary || "",
      "resumo": data.summary || "",
      "summary": data.summary || "",
      "sobre": data.summary || "",
      "email": data.email || "",
      "telefone": data.phone || "",
      "phone": data.phone || "",
      "localizacao": data.location || "",
      "localização": data.location || "",
      "location": data.location || "",
      "linkedin": data.linkedin || "",
      "experiencia": formatExperience(data.experience),
      "experiência": formatExperience(data.experience),
      "experience": formatExperience(data.experience),
      "formacao": formatEducation(data.education),
      "formação": formatEducation(data.education),
      "educacao": formatEducation(data.education),
      "educação": formatEducation(data.education),
      "education": formatEducation(data.education),
      "competencias": data.skills || "",
      "competências": data.skills || "",
      "competencias tecnicas": data.skills || "",
      "competências técnicas": data.skills || "",
      "skills": data.skills || "",
      "hard skills": data.skills || "",
      "competencias pessoais": data.softSkills || "",
      "competências pessoais": data.softSkills || "",
      "soft skills": data.softSkills || "",
      "idiomas": formatLanguages(data.languages),
      "languages": formatLanguages(data.languages),
      "certificacoes": data.certifications || "",
      "certificações": data.certifications || "",
      "certifications": data.certifications || "",
      "projetos": data.projects || "",
      "projectos": data.projects || "",
      "projects": data.projects || ""
    };
  }

  function guessValue(fieldName, data) {
    const key = normalize(fieldName);
    const values = candidateValues(data);

    if (values[key]) return values[key];

    const aliases = [
      ["name", ["nome", "name"]],
      ["job", ["cargo", "job", "title", "profession", "profissao"]],
      ["summary", ["summary", "perfil", "resumo", "about"]],
      ["email", ["email", "mail"]],
      ["phone", ["phone", "telefone", "mobile", "telemovel"]],
      ["location", ["location", "localizacao", "cidade", "city", "address"]],
      ["linkedin", ["linkedin"]],
      ["experience", ["experience", "experiencia", "work"]],
      ["education", ["education", "formacao", "educacao", "academic"]],
      ["skills", ["skills", "competencias", "technical"]],
      ["soft", ["soft", "personal", "competencias pessoais"]],
      ["language", ["language", "idioma"]],
      ["cert", ["cert", "certificacao"]],
      ["project", ["project", "projeto", "projecto", "portfolio"]]
    ];

    for (const [, terms] of aliases) {
      if (terms.some(term => key.includes(term))) {
        const direct = terms.map(term => values[term]).find(Boolean);
        if (direct) return direct;
      }
    }

    return "";
  }

  async function getStatus() {
    try {
      const response = await fetch("/api/canva?action=status", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao consultar o Canva.");

      if (!data.configured) {
        setStatus("Canva ainda não configurado no backend.");
        connectButtons.forEach(button => button.disabled = true);
        createButtons.forEach(button => button.disabled = true);
        if (loadTemplatesBtn) loadTemplatesBtn.disabled = true;
        return;
      }

      connectButtons.forEach(button => button.disabled = false);

      if (data.connected) {
        setStatus("Canva ligado. Pode criar um design editável.", "success");
        connectButtons.forEach(button => {
          button.textContent = "Canva ligado";
        });
        createButtons.forEach(button => button.disabled = false);
        if (loadTemplatesBtn) loadTemplatesBtn.disabled = false;
      } else {
        setStatus("Ligue a sua conta Canva para criar o CV no Canva.");
        createButtons.forEach(button => button.disabled = true);
        if (loadTemplatesBtn) loadTemplatesBtn.disabled = true;
      }
    } catch (error) {
      setStatus(error.message || "Não foi possível verificar o Canva.", "error");
    }
  }

  connectButtons.forEach(button => {
    button.addEventListener("click", () => {
      window.location.href = "/api/canva?action=authorize";
    });
  });

  createButtons.forEach(button => {
    button.addEventListener("click", async () => {
      if (!window.CVBuilder) return;

      createButtons.forEach(item => item.disabled = true);
      setStatus("A preparar o CV editável para o Canva...", "loading");

      try {
        const blob = await window.CVBuilder.buildWordBlob();
        const data = getCvData();
        const form = new FormData();
        const safe = (data.fullName || "curriculo").trim().slice(0, 40);
        form.append("title", "CV - " + (safe || "Currículo"));
        form.append("file", blob, (safe || "curriculo") + ".docx");

        const response = await fetch("/api/canva?action=import", {
          method: "POST",
          body: form
        });
        const result = await response.json().catch(() => ({}));

        if (response.status === 401) {
          setStatus("A ligação ao Canva expirou. Ligue novamente a conta.", "error");
          createButtons.forEach(item => item.disabled = false);
          return;
        }

        if (!response.ok) throw new Error(result.error || "Não foi possível enviar o CV para o Canva.");

        setStatus("Importação iniciada. A aguardar o Canva...", "loading");
        await pollImport(result.jobId);
      } catch (error) {
        console.error(error);
        setStatus(error.message || "Falha ao criar o design no Canva.", "error");
        createButtons.forEach(item => item.disabled = false);
      }
    });
  });

  async function pollImport(jobId) {
    for (let attempt = 0; attempt < 16; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch(
        "/api/canva?action=import-status&jobId=" + encodeURIComponent(jobId),
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Falha ao consultar o Canva.");

      const job = data.job || {};

      if (job.status === "success") {
        const design = job.result?.designs?.[0];
        if (!design?.urls?.edit_url) {
          throw new Error("O Canva concluiu a importação, mas não devolveu o link de edição.");
        }

        setStatus("CV criado no Canva. A abrir o editor...", "success");
        window.location.href = design.urls.edit_url;
        createButtons.forEach(item => item.disabled = false);
        return;
      }

      if (job.status === "failed") {
        throw new Error(job.error?.message || "O Canva não conseguiu importar este documento.");
      }

      setStatus("A importar para o Canva... (" + (attempt + 1) + "/16)", "loading");
    }

    throw new Error("A importação está a demorar mais do que o esperado. Tente novamente em alguns instantes.");
  }

  async function loadTemplates() {
    if (!templateGrid) return;

    setTemplateStatus("A carregar templates Canva...", "");
    templateGrid.innerHTML = "";

    try {
      const query = templateSearch?.value?.trim() || "";
      const response = await fetch(
        "/api/canva?action=templates&query=" + encodeURIComponent(query),
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setTemplateStatus("Ligue novamente a conta Canva.", "error");
        return;
      }

      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os templates.");

      currentTemplates = Array.isArray(data.items) ? data.items : [];

      if (!currentTemplates.length) {
        setTemplateStatus("Não foram encontrados Brand Templates com campos de Autofill. Isto pode depender do seu plano Canva ou dos templates disponíveis na conta.", "");
        return;
      }

      setTemplateStatus(currentTemplates.length + " template(s) disponível(eis).", "success");
      renderTemplates();
    } catch (error) {
      setTemplateStatus(error.message || "Falha ao carregar templates Canva.", "error");
    }
  }

  function renderTemplates() {
    if (!templateGrid) return;

    templateGrid.innerHTML = currentTemplates.map(template => {
      const thumbnail = template.thumbnail?.url
        ? '<img src="' + escapeHtml(template.thumbnail.url) + '" alt="">'
        : '<div class="canva-template-placeholder">C</div>';

      return '<article class="canva-template-card">' +
        thumbnail +
        '<div class="canva-template-card-body">' +
        '<strong>' + escapeHtml(template.title || "Template Canva") + '</strong>' +
        '<small>Template com campos de dados</small>' +
        '<button class="btn btn-light canva-template-select" type="button" data-template-id="' + escapeHtml(template.id) + '">Usar template</button>' +
        '</div>' +
        '</article>';
    }).join("");

    templateGrid.querySelectorAll(".canva-template-select").forEach(button => {
      button.addEventListener("click", () => selectTemplate(button.dataset.templateId));
    });
  }

  async function selectTemplate(templateId) {
    selectedTemplate = currentTemplates.find(item => item.id === templateId) || null;
    if (!selectedTemplate || !autofillPanel) return;

    autofillPanel.hidden = false;
    selectedTemplateLabel.textContent = selectedTemplate.title || "Template Canva";
    datasetStatus.textContent = "A consultar os campos de Autofill...";
    autofillFields.innerHTML = "";
    setTemplateStatus("Template seleccionado.", "success");

    try {
      const response = await fetch(
        "/api/canva?action=template-dataset&templateId=" + encodeURIComponent(templateId),
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Não foi possível obter os campos do template.");

      selectedDataset = data.dataset && typeof data.dataset === "object" ? data.dataset : {};
      renderAutofillFields(selectedDataset);

      const fieldCount = Object.keys(selectedDataset).length;
      datasetStatus.textContent = fieldCount
        ? fieldCount + " campo(s) de dados disponível(eis). Confirme os textos antes de gerar."
        : "Este template não tem campos de Autofill disponíveis.";
      autofillBtn.disabled = fieldCount === 0;
    } catch (error) {
      datasetStatus.textContent = error.message || "Falha ao consultar o template.";
      autofillBtn.disabled = true;
    }
  }

  function renderAutofillFields(dataset) {
    if (!autofillFields) return;

    const data = getCvData();
    const entries = Object.entries(dataset);

    autofillFields.innerHTML = entries.map(([name, definition]) => {
      const type = definition?.type || "text";
      if (type === "image") {
        return '<div class="canva-autofill-field">' +
          '<label>' + escapeHtml(name) + ' <small>(imagem)</small></label>' +
          '<p class="feature-help">Campo de imagem detectado. Nesta versão o preenchimento automático de fotografias fica preparado para a próxima etapa de Assets API.</p>' +
          '</div>';
      }

      if (type !== "text") {
        return '<div class="canva-autofill-field">' +
          '<label>' + escapeHtml(name) + ' <small>(' + escapeHtml(type) + ')</small></label>' +
          '<p class="feature-help">Tipo "' + escapeHtml(type) + '" detectado. O motor de CVBuilder irá tratar este tipo numa etapa posterior.</p>' +
          '</div>';
      }

      const value = guessValue(name, data);
      return '<div class="canva-autofill-field">' +
        '<label for="canva-field-' + escapeHtml(name) + '">' + escapeHtml(name) + '</label>' +
        '<textarea id="canva-field-' + escapeHtml(name) + '" data-canva-field="' + escapeHtml(name) + '" rows="3" maxlength="5000">' +
        escapeHtml(value) +
        '</textarea>' +
        '</div>';
    }).join("");
  }

  function collectAutofillData() {
    const data = {};

    if (!autofillFields) return data;

    autofillFields.querySelectorAll("[data-canva-field]").forEach(field => {
      const name = field.dataset.canvaField;
      const type = selectedDataset[name]?.type;

      if (type === "text") {
        const text = field.value.trim();
        if (text) data[name] = { type: "text", text };
      }
    });

    return data;
  }

  async function startAutofill() {
    if (!selectedTemplate || !autofillBtn) return;

    const data = collectAutofillData();
    if (!Object.keys(data).length) {
      autofillStatus.textContent = "Preencha pelo menos um campo de texto.";
      autofillStatus.className = "canva-status error";
      return;
    }

    autofillBtn.disabled = true;
    autofillStatus.textContent = "A gerar o CV no template Canva...";
    autofillStatus.className = "canva-status loading";

    try {
      const response = await fetch("/api/canva?action=autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandTemplateId: selectedTemplate.id,
          data
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível iniciar o Autofill.");

      await pollAutofill(result.jobId);
    } catch (error) {
      autofillStatus.textContent = error.message || "Falha no Autofill Canva.";
      autofillStatus.className = "canva-status error";
      autofillBtn.disabled = false;
    }
  }

  async function pollAutofill(jobId) {
    for (let attempt = 0; attempt < 16; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch(
        "/api/canva?action=autofill-status&jobId=" + encodeURIComponent(jobId),
        { cache: "no-store" }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "Falha ao consultar o Autofill Canva.");

      const job = data.job || {};

      if (job.status === "success") {
        const design = job.result?.design || job.result?.designs?.[0];
        const editUrl = design?.urls?.edit_url || design?.url;

        if (!editUrl) {
          throw new Error("O Canva concluiu o Autofill, mas não devolveu o link de edição.");
        }

        autofillStatus.textContent = "CV preenchido com sucesso. A abrir o Canva...";
        autofillStatus.className = "canva-status success";
        window.location.href = editUrl;
        return;
      }

      if (job.status === "failed") {
        throw new Error(job.error?.message || "O Canva não conseguiu preencher este template.");
      }

      autofillStatus.textContent = "A gerar o CV no Canva... (" + (attempt + 1) + "/16)";
    }

    throw new Error("O Autofill está a demorar mais do que o esperado.");
  }

  loadTemplatesBtn?.addEventListener("click", loadTemplates);

  templateSearch?.addEventListener("keydown", event => {
    if (event.key === "Enter") loadTemplates();
  });

  closeAutofillBtn?.addEventListener("click", () => {
    if (autofillPanel) autofillPanel.hidden = true;
  });

  autofillBtn?.addEventListener("click", startAutofill);

  if (new URLSearchParams(location.search).get("canva") === "connected") {
    history.replaceState({}, document.title, location.pathname + location.hash);
    setStatus("Canva ligado com sucesso.", "success");
  }

  getStatus();
})();
