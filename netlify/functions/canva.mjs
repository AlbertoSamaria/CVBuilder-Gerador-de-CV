const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";
const CANVA_TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const CANVA_API = "https://api.canva.com/rest/v1";

function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}
  });
}

function cookie(name, value, options = {}) {
  const parts=[name+"="+encodeURIComponent(value)];
  if(options.maxAge !== undefined) parts.push("Max-Age="+options.maxAge);
  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  if(options.secure !== false) parts.push("Secure");
  return parts.join("; ");
}

function randomString(length=64) {
  const bytes=new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("").slice(0,length);
}

function base64(bytes) {
  let binary="";
  bytes.forEach(b=>binary+=String.fromCharCode(b));
  return btoa(binary);
}

function base64url(bytes) {
  return base64(bytes).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function sha256(value) {
  return crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
}

function getCookie(request,name) {
  const raw=request.headers.get("cookie")||"";
  const item=raw.split(";").map(v=>v.trim()).find(v=>v.startsWith(name+"="));
  return item ? decodeURIComponent(item.slice(name.length+1)) : "";
}

function config() {
  return {
    clientId: process.env.CANVA_CLIENT_ID || "",
    clientSecret: process.env.CANVA_CLIENT_SECRET || "",
    redirectUri: process.env.CANVA_REDIRECT_URI || ""
  };
}

function scopes() {
  return [
    "design:content:read",
    "design:content:write",
    "design:meta:read",
    "profile:read"
  ].join(" ");
}

async function exchangeCode(code, verifier) {
  const {clientId,clientSecret,redirectUri}=config();
  const credentials=btoa(clientId+":"+clientSecret);
  const body=new URLSearchParams({
    grant_type:"authorization_code",
    code,
    code_verifier:verifier,
    redirect_uri:redirectUri
  });
  const response=await fetch(CANVA_TOKEN_URL,{
    method:"POST",
    headers:{
      "Authorization":"Basic "+credentials,
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.message||data.error||"Falha ao obter o token Canva.");
  return data;
}

async function canvaRequest(path, token, options={}) {
  const response=await fetch(CANVA_API+path,{
    ...options,
    headers:{
      "Authorization":"Bearer "+token,
      ...(options.headers||{})
    }
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) {
    const message=data.message||data.error||"A API Canva devolveu HTTP "+response.status+".";
    const error=new Error(message);
    error.status=response.status;
    error.data=data;
    throw error;
  }
  return data;
}

export default async function handler(request) {
  const url=new URL(request.url);
  const action=url.searchParams.get("action")||"status";

  if(request.method==="OPTIONS") return new Response(null,{status:204});
  if(request.method==="GET" && action==="status") {
    return json(200,{configured:Boolean(config().clientId&&config().clientSecret&&config().redirectUri),connected:Boolean(getCookie(request,"cv_canva_access"))});
  }

  if(request.method==="GET" && action==="authorize") {
    const {clientId,redirectUri}=config();
    if(!clientId||!redirectUri||!config().clientSecret) return json(500,{error:"Canva ainda não está configurado no Netlify. Defina CANVA_CLIENT_ID, CANVA_CLIENT_SECRET e CANVA_REDIRECT_URI."});
    const verifier=randomString(64);
    const challenge=base64url(new Uint8Array(await sha256(verifier)));
    const state=randomString(48);
    const params=new URLSearchParams({
      code_challenge:challenge,
      code_challenge_method:"S256",
      scope:scopes(),
      response_type:"code",
      client_id:clientId,
      state,
      redirect_uri:redirectUri
    });
    return new Response(null,{status:302,headers:{
      "Location":CANVA_AUTHORIZE_URL+"?"+params.toString(),
      "Set-Cookie":cookie("cv_canva_oauth",JSON.stringify({state,verifier}),{maxAge:600})
    }});
  }

  if(request.method==="GET" && action==="callback") {
    const {clientId}=config();
    const code=url.searchParams.get("code");
    const returnedState=url.searchParams.get("state");
    const storedRaw=getCookie(request,"cv_canva_oauth");
    let stored={};
    try { stored=JSON.parse(storedRaw||"{}"); } catch {}
    if(!clientId||!code||!returnedState||!stored.state||returnedState!==stored.state||!stored.verifier) {
      return json(400,{error:"OAuth Canva inválido ou expirado. Inicie a ligação novamente."});
    }
    try {
      const token=await exchangeCode(code,stored.verifier);
      if(!token.access_token) return json(502,{error:"Canva não devolveu um access token."});
      const maxAge=Math.max(300,Number(token.expires_in||14400));
      const headers=new Headers({
        "Location":"/?canva=connected",
        "Set-Cookie":cookie("cv_canva_access",token.access_token,{maxAge})
      });
      return new Response(null,{status:302,headers});
    } catch(error) {
      console.error("Canva OAuth callback failed",error);
      return json(502,{error:error.message||"Não foi possível concluir a ligação ao Canva."});
    }
  }

  const token=getCookie(request,"cv_canva_access");
  if(!token) return json(401,{error:"Ligue primeiro a sua conta Canva."});

  if(request.method==="POST" && action==="import") {
    try {
      const form=await request.formData();
      const file=form.get("file");
      if(!file || typeof file.arrayBuffer!=="function") return json(400,{error:"Seleccione um ficheiro PDF ou Word."});
      if(file.size>15*1024*1024) return json(413,{error:"O ficheiro excede o limite de 15 MB."});
      const allowed=["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword"];
      if(file.type && !allowed.includes(file.type)) return json(400,{error:"Para o Canva, use PDF ou Word (.doc/.docx)."});
      const title=String(form.get("title")||file.name||"CVBuilder").replace(/[^\p{L}\p{N}\s._-]/gu,"").trim().slice(0,50)||"CVBuilder";
      const metadata=JSON.stringify({
        title_base64:base64(new TextEncoder().encode(title)),
        mime_type:file.type||"application/octet-stream"
      });
      const created=await canvaRequest("/imports",token,{
        method:"POST",
        headers:{
          "Content-Type":"application/octet-stream",
          "Import-Metadata":metadata
        },
        body:await file.arrayBuffer()
      });
      const jobId=created?.job?.id;
      if(!jobId) return json(502,{error:"Canva não devolveu o ID do trabalho de importação."});
      return json(202,{jobId,status:created?.job?.status||"in_progress"});
    } catch(error) {
      console.error("Canva import failed",error);
      return json(error.status===401?401:502,{error:error.message||"Não foi possível importar o currículo para o Canva."});
    }
  }

  if(request.method==="GET" && action==="import-status") {
    const jobId=url.searchParams.get("jobId");
    if(!jobId) return json(400,{error:"ID de importação em falta."});
    try {
      const data=await canvaRequest("/imports/"+encodeURIComponent(jobId),token);
      return json(200,data);
    } catch(error) {
      return json(error.status===401?401:502,{error:error.message||"Não foi possível consultar a importação Canva."});
    }
  }

  if(request.method==="POST" && action==="disconnect") {
    return new Response(null,{status:204,headers:{"Set-Cookie":cookie("cv_canva_access","",{maxAge:0})}});
  }

  return json(405,{error:"Método ou operação Canva não permitido."});
}
