import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {instructions,responseSchema,validateInput,validateReply} from './design-agent.mjs';

export function subscriptionEnvironment(source=process.env){
 const env={...source};
 for(const key of ['OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL'])delete env[key];
 return env;
}
function execute(args,{cwd,signal,input='',env=subscriptionEnvironment()}={}){
 return new Promise((resolve,reject)=>{
  const bundled='/Applications/Codex.app/Contents/Resources/codex';
  const child=spawn(existsSync(bundled)?bundled:'codex',args,{cwd,env,signal,stdio:['pipe','pipe','pipe'],shell:false});
  let output='';
  const collect=chunk=>{output=(output+chunk.toString()).slice(-12000);};
  child.stdout.on('data',collect);child.stderr.on('data',collect);
  child.stdin.on('error',()=>{});
  child.on('error',reject);
  child.on('close',code=>code===0?resolve(output):reject(Error('Codex could not finish this request. Check your subscription limits and model access, then retry.',{cause:output}))); 
  child.stdin.end(input);
 });
}
export async function subscriptionStatus(){
 try{const status=await execute(['login','status'],{signal:AbortSignal.timeout(10000)});return {configured:/Logged in using ChatGPT/i.test(status),provider:'codex',billing:'ChatGPT subscription'};}
 catch{return {configured:false,provider:'codex',billing:'ChatGPT subscription'};}
}
export async function runCodexTurn(input,{model='gpt-6-astra',signal,executeImpl=execute,statusImpl=subscriptionStatus}={}){
 const data=validateInput(input);
 if(!(await statusImpl()).configured)throw Object.assign(Error('Sign in to Codex with ChatGPT using codex login, then reconnect. API key authentication is disabled in this studio.'),{status:503});
 const directory=await mkdtemp(path.join(tmpdir(),'board-studio-'));
 try{
  const schemaPath=path.join(directory,'schema.json'),outputPath=path.join(directory,'reply.json');
  await writeFile(schemaPath,JSON.stringify(responseSchema),{mode:0o600});
  const args=['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--color','never','--model',model,'--output-schema',schemaPath,'--output-last-message',outputPath];
  if(data.viewportImage){const imagePath=path.join(directory,'viewport.jpg');await writeFile(imagePath,Buffer.from(data.viewportImage.split(',')[1],'base64'),{mode:0o600});args.push('--image',imagePath);}
  args.push('-');
  const prompt=instructions+'\nReturn only the requested structured response. Do not use tools, run commands, inspect files, or access the network. All design context is supplied below.\nCURRENT WORKSPACE DATA:\n'+JSON.stringify({game:data.game,selectedId:data.selectedId})+'\nCONVERSATION:\n'+JSON.stringify(data.messages);
  await executeImpl(args,{cwd:directory,signal,input:prompt,env:subscriptionEnvironment()});
  try{return {...validateReply(JSON.parse(await readFile(outputPath,'utf8'))),model,provider:'codex'};}
  catch{throw Object.assign(Error('Codex returned a draft the editor could not validate. Your game is unchanged; try a smaller request.'),{status:502});}
 }finally{await rm(directory,{recursive:true,force:true});}
}
