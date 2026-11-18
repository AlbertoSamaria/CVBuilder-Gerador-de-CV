(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const normalise = (value) => String(value || "")
    .toLocaleLowerCase("pt")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const STOP_WORDS = new Set(("para com sem por uma um uns umas dos das que como mais menos sobre entre desde ate pela pelo sua seu suas seus este esta esse essa isso isto quando onde qual quais ser ter estar fazer poder dever profissional empresa equipa trabalho experiencia formacao curso vaga funcao candidato candidata requisitos responsavel capacidade conhecimento conhecimentos nivel anos ano").split(" "));
  const TECH_TERMS = [
    "javascript","typescript","php","python","java","c#","c++","html","css","mysql","sql","postgresql",
    "mongodb","git","github","linux","windows"," redes","redes informaticas","ciberseguranca","seguranca informatica",
    "react","vue","angular","node.js","laravel","api","rest","docker","aws","azure","excel","power bi",
    "gestao de projetos","project management","atendimento ao cliente","suporte tecnico","analise de dados",
    "comunicacao","lideranca","resolucao de problemas","trabalho em equipa"
  ];

  const splitItems = (value) => String(value || "").split(/[\n,;|]+/).map(x => x.trim()).filter(Boolean);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);

  function getCVText(data, state) {
    const experience = (state.experience || []).map(item =>
      [item.title,item.company,item.description,item.location].join(" ")
    ).join(" ");
    const education = (state.education || []).map(item =>
      [item.title,item.school,item.date].join(" ")
    ).join(" ");
    const languages = (state.languages || []).map(item => [item.name,item.level].join(" ")).join(" ");
    return normalise([
      data.fullName,data.jobTitle,data.email,data.phone,data.location,data.linkedin,data.summary,
      experience,education,data.skills,data.softSkills,languages,data.certifications,data.projects
    ].join(" "));
  }

  function getKeywords(jobText) {
    const text = normalise(jobText);
    const words = text.split(" ").filter(word => word.length >= 4 && !STOP_WORDS.has(word));
    const unique = [...new Set(words)];
    const phrases = TECH_TERMS.filter(term => text.includes(normalise(term)));
    return [...new Set([...phrases, ...unique])].slice(0, 45);
  }

  function buildChecks(data, state) {
    const exp = (state.experience || []).filter(x => x.title || x.company || x.description);
    const edu = (state.education || []).filter(x => x.title || x.school);
    const languages = (state.languages || []).filter(x => x.name);
    const summaryLength = String(data.summary || "").trim().length;
    const experienceText = exp.map(x => x.description || "").join(" ");
    const hasResults = /\d/.test(experienceText);
    return [
      {label:"Nome completo",weight:8,ok:!!data.fullName},
      {label:"Cargo ou profissão",weight:8,ok:!!data.jobTitle},
      {label:"Email de contacto",weight:5,ok:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")},
      {label:"Telefone",weight:4,ok:String(data.phone || "").replace(/\D/g,"").length >= 8},
      {label:"Localização",weight:3,ok:!!data.location},
      {label:"Perfil profissional (40+ caracteres)",weight:12,ok:summaryLength >= 40},
      {label:"Experiência profissional",weight:15,ok:exp.length > 0},
      {label:"Formação académica",weight:10,ok:edu.length > 0},
      {label:"Competências técnicas",weight:12,ok:splitItems(data.skills).length >= 3},
      {label:"Idiomas",weight:5,ok:languages.length > 0},
      {label:"Certificações",weight:4,ok:!!data.certifications},
      {label:"Projectos ou portefólio",weight:4,ok:!!data.projects},
      {label:"Descrição de experiência detalhada",weight:5,ok:experienceText.trim().length >= 80},
      {label:"Resultados ou métricas na experiência",weight:5,ok:hasResults}
    ];
  }

  function render() {
    if (!window.CVBuilder) return;
    const data = window.CVBuilder.getData();
    const state = window.CVBuilder.state;
    const jobText = ($("#atsJobDescription")?.value || "").trim();
    const checks = buildChecks(data, state);
    const structureScore = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
    const cvText = getCVText(data, state);
    const keywords = jobText ? getKeywords(jobText) : [];
    const matched = keywords.filter(word => cvText.includes(normalise(word)));
    const missing = keywords.filter(word => !cvText.includes(normalise(word)));
    const keywordScore = keywords.length ? Math.round(matched.length / keywords.length * 100) : null;
    const score = keywordScore === null ? structureScore : Math.round(structureScore * 0.65 + keywordScore * 0.35);

    $("#atsScore").textContent = score;
    $("#atsScoreLabel").textContent = score >= 80 ? "Muito bom" : score >= 60 ? "Bom, mas pode melhorar" : score >= 40 ? "Precisa de melhorias" : "Currículo incompleto";
    $("#atsScoreRing").style.setProperty("--score", score + "%");
    $("#atsProgress").style.width = score + "%";
    $("#atsStructure").textContent = structureScore + "/100";
    $("#atsKeywordScore").textContent = keywordScore === null ? "Adicione uma vaga" : keywordScore + "%";
    $("#atsMatched").textContent = matched.length;
    $("#atsMissing").textContent = missing.length;

    const failed = checks.filter(item => !item.ok);
    const checksBox = $("#atsChecks");
    checksBox.innerHTML = checks.map(item =>
      '<li class="' + (item.ok ? "is-ok" : "is-missing") + '"><span aria-hidden="true">' +
      (item.ok ? "✓" : "○") + '</span><span>' + escapeHtml(item.label) +
      '</span><strong>' + (item.ok ? "OK" : "+" + item.weight + " pts") + '</strong></li>'
    ).join("");

    const keywordBox = $("#atsKeywords");
    if (!jobText) {
      keywordBox.innerHTML = '<p class="ats-muted">Cole uma oferta de emprego para comparar os requisitos com o seu currículo.</p>';
    } else {
      keywordBox.innerHTML =
        '<div class="ats-keyword-group"><strong>Encontradas (' + matched.length + ')</strong><div class="ats-tags">' +
        (matched.length ? matched.map(x => '<span class="ats-tag found">' + escapeHtml(x) + '</span>').join("") : '<span class="ats-muted">Nenhuma palavra-chave identificada.</span>') +
        '</div></div><div class="ats-keyword-group"><strong>A considerar (' + missing.length + ')</strong><div class="ats-tags">' +
        (missing.length ? missing.slice(0,20).map(x => '<span class="ats-tag missing">' + escapeHtml(x) + '</span>').join("") : '<span class="ats-muted">Boa correspondência de palavras-chave.</span>') +
        '</div></div>';
    }

    const suggestions = [];
    if (failed.length) suggestions.push("Complete: " + failed.slice(0,4).map(x => x.label.toLowerCase()).join(", ") + ".");
    if (jobText && missing.length) suggestions.push("Se possuir estas competências, inclua-as de forma verdadeira no currículo: " + missing.slice(0,8).join(", ") + ".");
    if (jobText && keywordScore < 50) suggestions.push("Ajuste o perfil e as descrições de experiência para reflectirem os requisitos reais da vaga, sem inventar qualificações.");
    if (!hasExperienceMetrics(state)) suggestions.push("Sempre que possível, quantifique resultados profissionais (por exemplo, número de utilizadores apoiados, projectos concluídos ou tempo poupado).");
    if (!suggestions.length) suggestions.push("O currículo está bem estruturado. Reveja a descrição da vaga e confirme que todas as informações estão correctas.");
    $("#atsSuggestions").innerHTML = suggestions.map(x => "<li>" + escapeHtml(x) + "</li>").join("");
    $("#atsResults").hidden = false;
    $("#atsLastRun").textContent = jobText ? "Análise com comparação da vaga" : "Análise estrutural do currículo";
  }

  function hasExperienceMetrics(state) {
    return (state.experience || []).some(item => /\d/.test(item.description || ""));
  }

  function init() {
    const button = $("#atsAnalyzeBtn");
    if (!button || !window.CVBuilder) return;
    button.addEventListener("click", render);
    document.addEventListener("input", event => {
      if (event.target.closest(".editor") && event.target.id !== "atsJobDescription") {
        window.clearTimeout(init.refreshTimer);
        init.refreshTimer = window.setTimeout(render, 350);
      }
    });
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();