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
- 3 modelos: Moderno, Clássico e Minimalista
- Pré-visualização em tempo real
- Importar currículos PDF com texto seleccionável e Word (.docx)
- Importar cópias de segurança CVBuilder (.json)
- Guardar no navegador e descarregar cópia de segurança JSON
- Exportar o currículo formatado para PDF através da impressão do navegador
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

## Exportar PDF

O botão **Exportar PDF** abre a janela de impressão do navegador. Escolha **Guardar como PDF** como destino. O documento exportado contém o currículo formatado, não o formulário de edição.

## Dependências de leitura

- PDF.js 3.11.174 (CDNJS)
- Mammoth.js 1.8.0 (CDNJS)

As bibliotecas são carregadas por CDN. É necessária ligação à Internet para importar PDF e DOCX.

## Privacidade

Os dados do currículo são processados no navegador e guardados localmente. A importação de documentos não envia o ficheiro para um servidor. As funcionalidades de IA são independentes e enviam apenas os dados profissionais seleccionados pelo utilizador para a função configurada.

## Licença

Pode modificar e utilizar o projecto para fins pessoais ou comerciais.
