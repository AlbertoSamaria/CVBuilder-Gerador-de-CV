# CVBuilder — Gerador de Currículos Online

Gerador de currículos moderno, responsivo e estático, com processamento de documentos no navegador.

## Funcionalidades

- Formulário organizado por secções: dados pessoais, perfil, experiência, formação, competências, idiomas, certificações e portefólio
- Navegação rápida entre secções do formulário
- Formulário completo para dados pessoais
- Foto de perfil
- Perfil profissional
- Experiência profissional com cargo, empresa, período, localização e descrição
- Formação académica
- Competências técnicas e pessoais
- Idiomas
- Certificações
- Projetos / portfólio
- 13 modelos visuais, incluindo um modelo ATS simplificado
- Pré-visualização em tempo real
- Analisador ATS local com pontuação estrutural de 0 a 100
- Comparação opcional com descrição de vaga e identificação de palavras-chave encontradas/em falta
- Recomendações de melhoria baseadas nos campos e conteúdo do currículo, sem enviar dados para servidores
- Importar currículos PDF com texto seleccionável e Word (.docx)
- Importar cópias de segurança CVBuilder (.json)
- Gravação automática do rascunho no navegador enquanto edita
- Recuperação automática do último rascunho ao reabrir a aplicação
- Guardar manualmente e descarregar cópia de segurança JSON
- Exportar o currículo para PDF através da impressão do navegador
- Exportar um documento Word (.docx) editável com os dados do currículo
- Adaptação do perfil profissional à descrição de uma vaga com IA, mediante confirmação do utilizador
- Editor avançado para reordenar secções do currículo
- Gerador editável de cartas de apresentação, com cópia e exportação TXT
- Histórico local de até 20 versões, com restauração e eliminação
- Alternância entre modo claro e modo escuro
- Responsivo para computador, tablet e telemóvel
- Sem PHP, MySQL ou servidor backend para os dados do currículo

## Importar um currículo existente

1. Clique em **Carregar**.
2. Seleccione um ficheiro PDF, Word (.docx) ou uma cópia JSON do CVBuilder.
3. Aguarde a leitura e confirme os campos preenchidos.
4. Corrija manualmente os dados que não tenham sido identificados correctamente.

A importação de PDF e DOCX é executada localmente no navegador. Os documentos não são enviados para a função de IA nem para um servidor da aplicação. A leitura de PDF depende de texto seleccionável; PDFs digitalizados como imagem necessitam de OCR e não são suportados nesta versão. A qualidade da identificação automática depende da estrutura e formatação do documento original.

## Guardar e recuperar

O CVBuilder guarda automaticamente o rascunho no armazenamento local do navegador enquanto edita e tenta recuperar a última versão ao reabrir a aplicação. O botão **Guardar** também descarrega um ficheiro JSON de segurança. Se o armazenamento local estiver cheio ou indisponível, a aplicação tenta manter a exportação JSON independente. Para recuperar essa cópia noutro navegador ou computador, utilize **Carregar** e seleccione o ficheiro JSON.

## Exportar documentos

- **PDF:** o botão abre a janela de impressão do navegador. Escolha **Guardar como PDF** como destino. A paginação e a apresentação podem variar conforme o navegador e as opções de impressão.
- **Word (.docx):** o botão gera um documento Word editável com os dados pessoais, perfil, experiência, formação, competências, idiomas, certificações e projectos. A exportação utiliza a biblioteca docx carregada por CDN e requer ligação à Internet.

## Dependências de leitura

- PDF.js 3.11.174 (CDNJS)
- Mammoth.js 1.8.0 (CDNJS)

As bibliotecas são carregadas por CDN. É necessária ligação à Internet para importar PDF e DOCX.

## Modelos de currículo

A aplicação disponibiliza 13 modelos visuais:

1. Moderno
2. Clássico
3. Minimalista
4. Executivo
5. Corporativo
6. Elegante
7. Tecnologia
8. Criativo
9. Académico
10. ATS / Simples — estrutura linear, sem coluna lateral, com contacto, competências e idiomas preservados no fluxo principal para facilitar a leitura automática
11. Profissional Verde
12. Impacto
13. Internacional

A escolha do modelo altera apenas a apresentação visual; os dados do formulário permanecem intactos. O modelo escolhido também é incluído na cópia de segurança JSON.

## Funcionalidades avançadas

- A adaptação à vaga utiliza a função de IA já configurada no Netlify e depende da disponibilidade da chave e do serviço Gemini. A sugestão é apresentada para revisão e não deve acrescentar competências ou experiências que o candidato não possua.
- A carta de apresentação é gerada localmente a partir dos campos do currículo. O texto pode ser editado, copiado ou exportado em TXT.
- O histórico mantém até 20 versões no armazenamento local do navegador. Não é uma sincronização na nuvem; limpar os dados do navegador pode eliminar estas versões.
- A ordem das secções e a preferência de tema claro/escuro também são guardadas localmente no navegador.
- Nos modelos de uma coluna, as competências técnicas e os idiomas passam a aparecer no corpo principal do currículo, em vez de desaparecerem com a barra lateral.
- A exportação Word respeita a ordem actual das secções definida no editor.

## Privacidade

Os dados do currículo são processados no navegador e guardados localmente. As fotografias aceites são JPG, PNG e WebP, até 3 MB. A importação de documentos não envia o ficheiro para um servidor. As funcionalidades de IA são independentes e enviam apenas os dados profissionais seleccionados pelo utilizador para a função configurada.

## Licença

Pode modificar e utilizar o projecto para fins pessoais ou comerciais.
