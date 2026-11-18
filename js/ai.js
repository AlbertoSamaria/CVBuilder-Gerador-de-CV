(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const resultBox = $("#aiResult");
  const statusBox = $("#aiStatus");
  const applyButton = $("#aiApply");
  const actionButtons = [
    $("#aiImproveSummary"),
    $("#aiImproveExperience"),
    $("#aiTailorJob"),
    $("#aiAnalyze")
  ];

  let pendingSuggestion = null;

  function setStatus(message, type = "") {
    statusBox.textContent = message;
    statusBox.className = "ai-feedback" + (type ? " " + type : "");
  }

  function refreshExperienceOptions() {
    const select = $("#aiExperienceTarget");
    if (!select || !window.CVBuilder) return;
    const previous = select.value;
    const experiences = window.CVBuilder.state.experience;
    select.innerHTML = "";
    if (!experiences.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Adicione primeiro uma experiência";
      select.appendChild(option);
      return;
    }
    experiences.forEach((experience, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = (experience.title || "Experiência " + (index + 1)).slice(0, 80);
      select.appendChild(option);
    });
    if (previous !== "" && experiences[Number(previous)]) select.value = previous;
  }

  function getProfessionalData() {
    const cv = window.CVBuilder;
    const data = cv.getData();
    return {
      jobTitle: data.jobTitle,
      summary: data.summary,
      experience: cv.state.experience.map(item => ({
        title: item.title || "",
        description: item.description || ""
      })),
      education: cv.state.education.map(item => ({
        course: item.title || ""
      })),
      skills: data.skills,
      softSkills: data.softSkills,
      certifications: data.certifications,
      projects: data.projects
    };
  }

  function clearSuggestion() {
    pendingSuggestion = null;
    resultBox.hidden = true;
    resultBox.textContent = "";
    applyButton.hidden = true;
  }

  async function runAI(action) {
    if (!window.CVBuilder) {
      setStatus("A aplicação ainda não terminou de carregar. Actualize a página.", "error");
      return;
    }

    const payload = { action, data: getProfessionalData() };
    if (action === "improve-experience") {
      const index = Number($("#aiExperienceTarget").value);
      const experience = window.CVBuilder.state.experience[index];
      if (!Number.isInteger(index) || !experience) {
        setStatus("Adicione e seleccione uma experiência profissional primeiro.", "error");
        return;
      }
      payload.data.selectedExperience = {
        index,
        title: experience.title || "",
        description: experience.description || ""
      };
    }

    if (action === "tailor") {
      payload.jobDescription = $("#aiJobDescription").value.trim();
      if (payload.jobDescription.length < 80) {
        setStatus("Cole uma descrição de vaga com pelo menos 80 caracteres.", "error");
        return;
      }
    }

    clearSuggestion();
    actionButtons.forEach(button => { button.disabled = true; });
    applyButton.disabled = true;
    setStatus("A IA está a analisar as informações. Aguarde...", "loading");

    try {
      const response = await fetch("/.netlify/functions/cv-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Não foi possível obter uma resposta da IA.");
      if (!body.text || typeof body.text !== "string") throw new Error("A IA devolveu uma resposta vazia.");

      resultBox.textContent = body.text.trim();
      resultBox.hidden = false;

      if (action === "improve-summary" || action === "tailor") {
        pendingSuggestion = { type: "summary", value: body.text.trim() };
      } else if (action === "improve-experience") {
        pendingSuggestion = {
          type: "experience",
          index: Number(payload.data.selectedExperience.index),
          value: body.text.trim()
        };
      }

      applyButton.hidden = !pendingSuggestion;
      setStatus(action === "analyze" ? "Análise concluída. Reveja as recomendações." : "Sugestão pronta. Reveja antes de aplicar.", "success");
    } catch (error) {
      setStatus(error.message || "Ocorreu um erro ao contactar a IA.", "error");
    } finally {
      actionButtons.forEach(button => { button.disabled = false; });
      applyButton.disabled = false;
    }
  }

  $("#aiImproveSummary").addEventListener("click", () => runAI("improve-summary"));
  $("#aiImproveExperience").addEventListener("click", () => runAI("improve-experience"));
  $("#aiTailorJob").addEventListener("click", () => runAI("tailor"));
  $("#aiAnalyze").addEventListener("click", () => runAI("analyze"));

  applyButton.addEventListener("click", () => {
    if (!pendingSuggestion || !window.CVBuilder) return;
    const cv = window.CVBuilder;
    if (pendingSuggestion.type === "summary") {
      $("#summary").value = pendingSuggestion.value;
    } else if (pendingSuggestion.type === "experience" && cv.state.experience[pendingSuggestion.index]) {
      cv.state.experience[pendingSuggestion.index].description = pendingSuggestion.value;
      cv.renderForms();
      refreshExperienceOptions();
    } else {
      setStatus("Não foi possível aplicar esta sugestão. Verifique os dados.", "error");
      return;
    }
    cv.update();
    setStatus("Sugestão aplicada. A pré-visualização foi actualizada.", "success");
    clearSuggestion();
    cv.toast("Sugestão da IA aplicada ao currículo.");
  });

  const experienceContainer = $("#experienceForm");
  if (experienceContainer && "MutationObserver" in window) {
    new MutationObserver(refreshExperienceOptions).observe(experienceContainer, { childList: true, subtree: true });
  }
  refreshExperienceOptions();
})();
