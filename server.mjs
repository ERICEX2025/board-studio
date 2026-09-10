import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {runCodexTurn,subscriptionStatus} from './server/codex-agent.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),publicRoot=path.join(root,'dist');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
export async function configuration(){let env={};try{env=parseEnv(await readFile(path.join(root,'.env'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 return {provider:'codex',model:process.env.OPENAI_MODEL||env.OPENAI_MODEL||'gpt-6-astra'};
}
export function createApp({config=configuration,runTurn=runCodexTurn}={}){
 let active=0;
 return http.createServer(async(req,res)=>{
  const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  if(!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host||''))return json(403,{error:'Local access only.'});
  let url;try{url=new URL(req.url,'http://'+req.headers.host);}catch{return json(400,{error:'Invalid URL.'});}
  if(url.pathname==='/api/status'&&req.method==='GET'){const c=await config();return json(200,{...(await subscriptionStatus()),model:c.model});}
  if(url.pathname==='/api/design'&&req.method==='POST'){
    if(req.headers.origin!=='http://'+req.headers.host)return json(403,{error:'This request must come from the local studio.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'Expected JSON.'});
    if(active>=2)return json(429,{error:'Another design request is running. Please wait.'});
    let data;try{let text='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>4000000)throw Error('Request too large.');text+=chunk;}data=JSON.parse(text);}catch{return json(400,{error:'Invalid or oversized request.'});}
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),300000);res.on('close',()=>{if(!res.writableEnded)controller.abort();});active++;
    try{const c=await config();const reply=await runTurn(data,{...c,signal:controller.signal});if(!res.destroyed)json(200,reply);}catch(e){if(!res.destroyed)json(e.name==='AbortError'?504:e.status||400,{error:e.name==='AbortError'?'Request timed out. Try a smaller change.':e.message||'Request failed.'});}finally{clearTimeout(timeout);active--;}
    return;
  }
  if(url.pathname.startsWith('/api/'))return json(404,{error:'Unknown endpoint.'});
  if(!['GET','HEAD'].includes(req.method))return json(405,{error:'Method not allowed.'});
  try{const decoded=decodeURIComponent(url.pathname),file=path.resolve(publicRoot,'.'+(decoded==='/'?'/board.html':decoded));if(!file.startsWith(publicRoot+path.sep)||decoded.split('/').some(s=>s.startsWith('.')))return json(403,{error:'Not available.'});if(!(await stat(file)).isFile())return json(404,{error:'Not found.'});const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);}catch{json(404,{error:'Not found.'});}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){createApp().listen(4173,'127.0.0.1',()=>console.log('Board Studio: http://127.0.0.1:4173/board.html'));}
