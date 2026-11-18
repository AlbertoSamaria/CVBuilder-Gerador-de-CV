# CVBuilder — Gerador de Currículos Online

Gerador de currículos moderno, responsivo e estático, com processamento de documentos no navegador.

## Funcionalidades

- Formulário completo para dados pessoais
- Foto de perfil
- Perfil profissional
- Experiência profissional
- Formação académica
- Competências técnicas e pessoais
- Idiomas
- Certificações
- Projetos / portfólio
- 13 modelos visuais, incluindo um modelo ATS simplificado
- Pré-visualização em tempo real
- Importar currículos PDF com texto seleccionável e Word (.docx)
- Importar cópias de segurança CVBuilder (.json)
- Guardar no navegador e descarregar cópia de segurança JSON
- Exportar o currículo para PDF através da impressão do navegador
- Exportar um documento Word (.docx) editável com os dados do currículo
- Responsivo para computador, tablet e telemóvel
- Sem PHP, MySQL ou servidor backend para os dados do currículo

## Importar um currículo existente

1. Clique em **Carregar**.
2. Seleccione um ficheiro PDF, Word (.docx) ou uma cópia JSON do CVBuilder.
3. Aguarde a leitura e confirme os campos preenchidos.
4. Corrija manualmente os dados que não tenham sido identificados correctamente.

A importação de PDF e DOCX é executada localmente no navegador. Os documentos não são enviados para a função de IA nem para um servidor da aplicação. A leitura de PDF depende de texto seleccionável; PDFs digitalizados como imagem necessitam de OCR e não são suportados nesta versão. A qualidade da identificação automática depende da estrutura e formatação do documento original.

## Guardar e recuperar

O botão **Guardar** mantém uma cópia no armazenamento local do navegador e descarrega também um ficheiro JSON de segurança. Para recuperar essa cópia noutro navegador ou computador, utilize **Carregar** e seleccione o ficheiro JSON.

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

## Privacidade

Os dados do currículo são processados no navegador e guardados localmente. A importação de documentos não envia o ficheiro para um servidor. As funcionalidades de IA são independentes e enviam apenas os dados profissionais seleccionados pelo utilizador para a função configurada.

## Licença

Pode modificar e utilizar o projecto para fins pessoais ou comerciais.
