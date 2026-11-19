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

- A adaptação à vaga utiliza a função de IA já configurada no Cloudflare e depende da disponibilidade da chave e do serviço Gemini. A sugestão é apresentada para revisão e não deve acrescentar competências ou experiências que o candidato não possua.
- A carta de apresentação é gerada localmente a partir dos campos do currículo. O texto pode ser editado, copiado ou exportado em TXT.
- O histórico mantém até 20 versões no armazenamento local do navegador. Não é uma sincronização na nuvem; limpar os dados do navegador pode eliminar estas versões.
- A ordem das secções e a preferência de tema claro/escuro também são guardadas localmente no navegador.
- Nos modelos de uma coluna, as competências técnicas e os idiomas passam a aparecer no corpo principal do currículo, em vez de desaparecerem com a barra lateral.
- A exportação Word respeita a ordem actual das secções definida no editor.

## Privacidade

Os dados do currículo são processados no navegador e guardados localmente. As fotografias aceites são JPG, PNG e WebP, até 3 MB. A importação de documentos não envia o ficheiro para um servidor. As funcionalidades de IA são independentes e enviam apenas os dados profissionais seleccionados pelo utilizador para a função configurada.

## Licença

Pode modificar e utilizar o projecto para fins pessoais ou comerciais.


## Integração com Canva

O CVBuilder inclui uma integração opcional com a Canva REST API através de Cloudflare Pages Functions.

### 1. Configuração no Canva Developer Portal

Crie uma app Canva com as REST APIs activadas e configure uma Redirect URL:

`https://SEU-PROJECTO.pages.dev/api/canva?action=callback`

Para esta arquitectura são usados os seguintes scopes:

- `design:content:read`
- `design:content:write`
- `design:meta:read`
- `brandtemplate:meta:read`
- `brandtemplate:content:read`
- `asset:read`
- `asset:write`

A Design Import usa `design:content:write`. Templates e Autofill usam os scopes de Brand Templates; Assets ficam preparados para a próxima etapa, permitindo tratar fotografias do currículo como campos de imagem.

### 2. Variáveis no Cloudflare

Configure as seguintes variáveis de ambiente no site:

- `CANVA_CLIENT_ID`
- `CANVA_CLIENT_SECRET`
- `CANVA_REDIRECT_URI`
- `CANVA_SESSION_SECRET`

`CANVA_CLIENT_SECRET` e `CANVA_SESSION_SECRET` são segredos de backend e não devem ser colocados no código frontend.

### 3. Fluxos disponíveis

**Design Import**

O botão **Criar no Canva** gera um documento Word a partir dos dados actuais e envia-o para a Design Import API. O Canva processa a importação de forma assíncrona e devolve um link temporário para abrir o design no editor.

**Templates + Autofill**

A secção **Templates Canva** consulta Brand Templates disponíveis para a conta, filtra templates com campos de dados, lê o dataset do template e permite confirmar/editar os valores antes de iniciar o Autofill.

O Autofill depende da disponibilidade de Brand Templates/Autofill na conta Canva. Quando não estiver disponível, os 13 modelos locais do CVBuilder continuam a funcionar normalmente.

### 4. Fallback local

A integração Canva é opcional. Se a conta não estiver ligada, a API estiver indisponível ou a conta não tiver acesso a templates/Autofill, o utilizador continua a poder criar e exportar o currículo através dos modelos locais.

### 5. Segurança

A autenticação Canva é feita exclusivamente no backend. O fluxo utiliza OAuth 2.0 com PKCE e o estado OAuth é validado no callback. Os tokens são mantidos numa sessão HttpOnly protegida no backend; o frontend não recebe o access token.


## Alojamento Cloudflare Pages

O frontend é publicado no Cloudflare Pages. As funções de backend são executadas como Pages Functions nos caminhos `/api/cv-ai` e `/api/canva`. Os módulos originais em `netlify/functions/` são mantidos como lógica partilhada e não são copiados para a pasta pública `dist/`.

### Configuração de build

- Repositório: `AlbertoSamaria/CVBuilder-Gerador-de-CV`
- Branch inicial de validação: `migration/cloudflare-pages-workers`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: raiz do repositório
- Compatibilidade: `nodejs_compat`, definida em `wrangler.toml`

O script `scripts/build.mjs` copia apenas `index.html`, `favicon.svg`, `css/`, `js/` e `vendor/` para `dist/`. As funções e os ficheiros de configuração não são publicados como recursos estáticos.

### Variáveis e segredos

No painel Cloudflare Pages, abre **Settings → Variables and Secrets** e configura as variáveis para Production e Preview:

| Nome | Tipo |
|---|---|
| `GEMINI_API_KEY` | Secret |
| `CANVA_CLIENT_ID` | Text |
| `CANVA_CLIENT_SECRET` | Secret |
| `CANVA_REDIRECT_URI` | Text |
| `CANVA_SESSION_SECRET` | Secret |

Não coloques valores secretos no GitHub, no frontend ou em ficheiros públicos. Depois de adicionar ou alterar variáveis, publica um novo deployment.

### Configurar OAuth Canva

Depois de criares o projecto Pages, copia o domínio real atribuído pela Cloudflare e define exactamente:

`https://TEU-PROJECTO.pages.dev/api/canva?action=callback`

Usa o mesmo URL em `CANVA_REDIRECT_URI` no Cloudflare e na lista de Redirect URLs da aplicação no Canva Developer Portal. Não uses o domínio Netlify antigo.

### Testes após publicação

- `https://TEU-PROJECTO.pages.dev/api/cv-ai` — deve devolver JSON com `service: "cv-ai"` e `status: "ready"`.
- `https://TEU-PROJECTO.pages.dev/api/canva?action=status` — deve devolver JSON com `service: "canva"` e o estado `configured`.
- Testa também a ligação OAuth, Design Import, Templates e Autofill. A disponibilidade de Templates e Autofill depende das permissões concedidas pela Canva.

Os dados do currículo, os 13 modelos locais, o armazenamento local, a importação e as exportações continuam no frontend. A integração Canva é opcional e o CVBuilder mantém o funcionamento local mesmo sem credenciais Canva.
