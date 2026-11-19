# CVBuilder — instalação InfinityFree

Domínio: https://cvbuilder.gt.tc

## Publicação
1. Envie o conteúdo da branch `migration/infinityfree-php` para `cvbuilder.gt.tc/htdocs`, preservando a estrutura de pastas.
2. Dentro de `htdocs`, crie a pasta `private` (o código PHP procura `htdocs/private/config.php`).
3. Copie `private/config.example.php` para `private/config.php` e preencha as credenciais directamente no servidor.
4. Mantenha o ficheiro `private/.htaccess` que bloqueia o acesso HTTP à configuração. Teste que `https://cvbuilder.gt.tc/private/config.php` devolve 403 ou 404.
5. No portal de developers do Canva, registe exactamente o callback: `https://cvbuilder.gt.tc/api/canva.php?action=callback`.

## Segurança
- Nunca coloque chaves reais no GitHub, JavaScript ou mensagens de chat.
- Use uma nova chave Gemini e credenciais Canva no servidor.
- A pasta `private` deve continuar protegida por `.htaccess`.

## Testes obrigatórios no alojamento
- `/api/cv-ai.php` em GET deve responder 405; isto confirma que o PHP está a executar.
- `/api/canva.php?action=status` deve devolver JSON com `configured` e `connected`.
- Confirmar que PHP cURL está activo e que o alojamento permite ligações HTTPS de saída para Google Gemini e Canva.
- Validar Gemini, OAuth Canva, Design Import, templates e Autofill no próprio domínio.

## Limitações
O InfinityFree pode impor limites de execução, cURL e pedidos externos. A integração só deve ser considerada operacional depois dos testes no domínio. Não elimine bases de dados nem ficheiros de utilizadores durante a migração.
