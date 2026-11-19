# CVBuilder — instalação InfinityFree

Domínio: https://cvbuilder.gt.tc

## Publicação
1. Envie o conteúdo da branch `migration/infinityfree-php` para `cvbuilder.gt.tc/htdocs`.
2. Mantenha a estrutura de pastas do repositório.
3. Crie uma pasta `private` ao nível da pasta `htdocs`, se o gestor de ficheiros permitir. Coloque nela `config.php` baseado em `private/config.example.php`. Se não for possível criar fora de `htdocs`, use `htdocs/private` com o bloqueio .htaccess fornecido e teste que o acesso HTTP é negado.
4. Preencha a chave Gemini e as credenciais Canva directamente no servidor. Nunca as envie por chat nem as grave no Git.
5. No portal de developers do Canva, registe exactamente o callback: `https://cvbuilder.gt.tc/api/canva.php?action=callback`.

## Limitações e validação
- O InfinityFree tem de permitir PHP cURL e pedidos HTTPS de saída para Google e Canva. Teste `/api/cv-ai.php` (deve responder 405 em GET) e `/api/canva.php?action=status`.
- O suporte a cURL, limites de execução e regras anti-abuso variam no alojamento gratuito. As integrações externas só ficam operacionais depois de testar no próprio domínio.
- O OAuth Canva usa sessão PHP e PKCE. Use HTTPS e confirme que o callback configurado no Canva coincide exactamente.
- Não elimine bases de dados ou ficheiros de utilizadores durante a migração.
