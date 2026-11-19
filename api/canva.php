<?php
declare(strict_types=1);
session_name('cvbuilder_session');
session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>!empty($_SERVER['HTTPS']),'httponly'=>true,'samesite'=>'Lax']);
session_start();
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(int $status,array $data=[]): never { http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES); exit; }
$cfgFile=dirname(__DIR__).'/private/config.php';
$cfg=is_file($cfgFile)?require $cfgFile:[];
$client=(string)($cfg['CANVA_CLIENT_ID']??''); $secret=(string)($cfg['CANVA_CLIENT_SECRET']??'');
$redirect=(string)($cfg['CANVA_REDIRECT_URI']??''); $base='https://api.canva.com/rest/v1';
function canva_call(string $path,string $token,string $method='GET',?string $body=null,array $headers=[]): array {
 global $base;
 $ch=curl_init($base.$path); $h=array_merge(['Authorization: Bearer '.$token,'Accept: application/json'],$headers);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$h,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25]);
 if($body!==null) curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
 $raw=curl_exec($ch); $status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE); $err=curl_error($ch); curl_close($ch);
 $data=json_decode((string)$raw,true); if($status<200||$status>=300) throw new RuntimeException(($data['message']??$data['error']??$err?:'Erro Canva HTTP '.$status),$status);
 return is_array($data)?$data:[];
}
function token_exchange(array $fields): array {
 global $client,$secret;
 $ch=curl_init('https://api.canva.com/rest/v1/oauth/token');
 curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25,CURLOPT_USERPWD=>$client.':'.$secret,CURLOPT_HTTPAUTH=>CURLAUTH_BASIC,CURLOPT_HTTPHEADER=>['Content-Type: application/x-www-form-urlencoded','Accept: application/json'],CURLOPT_POSTFIELDS=>http_build_query($fields)]);
 $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);$err=curl_error($ch);curl_close($ch);$data=json_decode((string)$raw,true);
 if($status<200||$status>=300) throw new RuntimeException($data['message']??$data['error']??$err?:'Falha OAuth Canva',$status);
 return is_array($data)?$data:[];
}
function get_token(): string {
 global $cfg;
 if(empty($_SESSION['canva']['access_token'])) return '';
 $s=$_SESSION['canva'];
 if(($s['expires_at']??0)>time()+60) return $s['access_token'];
 if(empty($s['refresh_token'])) return '';
 try { $n=token_exchange(['grant_type'=>'refresh_token','refresh_token'=>$s['refresh_token']]); $_SESSION['canva']=['access_token'=>$n['access_token'],'refresh_token'=>$n['refresh_token']??$s['refresh_token'],'expires_at'=>time()+max(60,(int)($n['expires_in']??14400)),'scope'=>$n['scope']??'']; return $_SESSION['canva']['access_token']; } catch(Throwable $e){unset($_SESSION['canva']);return '';}
}
$action=$_GET['action']??'status';$method=$_SERVER['REQUEST_METHOD']??'GET';
if($action==='callback' && $method==='GET'){
 $state=(string)($_GET['state']??'');$code=(string)($_GET['code']??'');
 if(!$code||!$state||empty($_SESSION['canva_oauth'])||!hash_equals($_SESSION['canva_oauth']['state'],$state)) respond(400,['error'=>'OAuth Canva inválido ou expirado.']);
 try{$t=token_exchange(['grant_type'=>'authorization_code','code'=>$code,'code_verifier'=>$_SESSION['canva_oauth']['verifier'],'redirect_uri'=>$redirect]);unset($_SESSION['canva_oauth']);$_SESSION['canva']=['access_token'=>$t['access_token'],'refresh_token'=>$t['refresh_token']??'','expires_at'=>time()+max(60,(int)($t['expires_in']??14400)),'scope'=>$t['scope']??''];header('Location: /?canva=connected',true,302);exit;}catch(Throwable $e){respond(502,['error'=>'Não foi possível concluir a ligação ao Canva.']);}
}
if($action==='status'&&$method==='GET') respond(200,['ok'=>true,'configured'=>(bool)($client&&$secret&&$redirect),'connected'=>(bool)get_token(),'capabilities'=>['designImport'=>true,'brandTemplates'=>true,'autofill'=>true]]);
if($action==='authorize'&&$method==='GET'){
 if(!$client||!$secret||!$redirect) respond(503,['error'=>'Configure as credenciais Canva no ficheiro privado do servidor.']);
 $verifier=rtrim(strtr(base64_encode(random_bytes(48)),'+/','-_'),'=');$challenge=rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'=');$state=bin2hex(random_bytes(24));
 $_SESSION['canva_oauth']=['state'=>$state,'verifier'=>$verifier,'created'=>time()];
 $scopes='design:content:read design:content:write design:meta:read brandtemplate:meta:read brandtemplate:content:read asset:read asset:write';
 $q=http_build_query(['code_challenge'=>$challenge,'code_challenge_method'=>'S256','scope'=>$scopes,'response_type'=>'code','client_id'=>$client,'state'=>$state,'redirect_uri'=>$redirect]);
 header('Location: https://www.canva.com/api/oauth/authorize?'.$q,true,302);exit;
}
if($action==='disconnect'&&$method==='POST'){unset($_SESSION['canva']);http_response_code(204);exit;}
$token=get_token();if(!$token) respond(401,['error'=>'Ligue primeiro a sua conta Canva.']);
try {
 if($action==='import'&&$method==='POST'){
  if(empty($_FILES['file'])||$_FILES['file']['error']!==UPLOAD_ERR_OK) respond(400,['error'=>'Seleccione um ficheiro Word ou PDF.']);
  if($_FILES['file']['size']>15*1024*1024) respond(413,['error'=>'O ficheiro excede 15 MB.']);
  $mime=mime_content_type($_FILES['file']['tmp_name'])?:'application/octet-stream';$title=substr(preg_replace('/[^\pL\pN\s._-]/u','',$_POST['title']??'CVBuilder'),0,50);
  $metadata=json_encode(['title_base64'=>base64_encode($title),'mime_type'=>$mime]);
  $ch=curl_init($base.'/imports');curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>60,CURLOPT_HTTPHEADER=>['Authorization: Bearer '.$token,'Content-Type: application/octet-stream','Import-Metadata: '.$metadata],CURLOPT_POSTFIELDS=>file_get_contents($_FILES['file']['tmp_name'])]);
  $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);$d=json_decode((string)$raw,true);if($status<200||$status>=300) throw new RuntimeException($d['message']??'Falha na importação Canva',$status);
  respond(200,['jobId'=>$d['job']['id']??'','status'=>$d['job']['status']??'in_progress']);
 }
 if($action==='import-status'&&$method==='GET') respond(200,canva_call('/imports/'.rawurlencode((string)($_GET['jobId']??'')),$token));
 if($action==='templates'&&$method==='GET'){ $q=['limit'=>50,'dataset'=>'non_empty'];if(!empty($_GET['query']))$q['query']=substr((string)$_GET['query'],0,120);respond(200,canva_call('/brand-templates?'.http_build_query($q),$token));}
 if($action==='template-dataset'&&$method==='GET') respond(200,canva_call('/brand-templates/'.rawurlencode((string)($_GET['templateId']??'')).'/dataset',$token));
 if($action==='autofill'&&$method==='POST'){ $b=json_decode(file_get_contents('php://input')?:'',true);$id=trim((string)($b['brandTemplateId']??''));$data=is_array($b['data']??null)?$b['data']:[];if(!$id||!$data)respond(400,['error'=>'Template ou campos de Autofill em falta.']);respond(200,canva_call('/autofills',$token,'POST',json_encode(['type'=>'create_from_brand_template','brand_template_id'=>$id,'data'=>$data]),['Content-Type: application/json']));}
 if($action==='autofill-status'&&$method==='GET') respond(200,canva_call('/autofills/'.rawurlencode((string)($_GET['jobId']??'')),$token));
 respond(405,['error'=>'Método ou operação Canva não permitido.']);
}catch(Throwable $e){$status=$e->getCode();respond($status>=400&&$status<600?$status:502,['error'=>$e->getMessage()?:'Falha na comunicação com o Canva.']);}
