import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile,readFile,access} from 'node:fs/promises';
import {runCodexTurn,subscriptionEnvironment} from '../server/codex-agent.mjs';
import {blankGame} from '../dist/game-model.mjs';
const input={game:blankGame(),messages:[{role:'user',content:'Make an observatory.'}],viewportImage:'data:image/jpeg;base64,/9j/2Q=='};
test('subscription transport strips API billing credentials',()=>{
 const env=subscriptionEnvironment({PATH:'/bin',OPENAI_API_KEY:'secret',CODEX_API_KEY:'secret',OPENAI_BASE_URL:'https://other'});
 assert.deepEqual(env,{PATH:'/bin'});
});
test('subscription adapter passes schema and viewport, validates reply and removes temporary files',async()=>{
 let directory;
 const result=await runCodexTurn(input,{statusImpl:async()=>({configured:true}),executeImpl:async(args,options)=>{
  directory=options.cwd;
  assert.ok(args.includes('--ignore-user-config'));assert.ok(args.includes('--ephemeral'));assert.ok(args.includes('read-only'));
  assert.equal(args.at(-1),'-');assert.ok(options.input.includes('Make an observatory.'));
  assert.equal((await readFile(args[args.indexOf('--image')+1])).length,4);
  await writeFile(args[args.indexOf('--output-last-message')+1],JSON.stringify({message:'Done',suggestions:[],concepts:[],critique:[],proposal:null}));
 }});
 assert.equal(result.provider,'codex');await assert.rejects(access(directory));
});
test('API-key login is rejected without invoking generation',async()=>{
 await assert.rejects(runCodexTurn(input,{statusImpl:async()=>({configured:false}),executeImpl:async()=>assert.fail('Must not run')}),/API key authentication is disabled/);
});
