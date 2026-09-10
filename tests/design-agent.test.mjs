import test from 'node:test';
import assert from 'node:assert/strict';
import {blankGame,createObject} from '../dist/game-model.mjs';
import {runDesignTurn,validateReply,validateInput} from '../server/design-agent.mjs';
import {createApp} from '../server.mjs';
const input=()=>({game:blankGame(),selectedId:null,messages:[{role:'user',content:'Build a small original race game.'}]});
const reply=()=>({message:'Here is a draft to review.',suggestions:[],concepts:[],critique:[],proposal:null});
test('sends validated workspace through Responses structured output without persisting provider state',async()=>{
 let sent;const r=await runDesignTurn(input(),{key:'test-only',fetchImpl:async(url,options)=>{sent={url,body:JSON.parse(options.body)};return new Response(JSON.stringify({id:'response-test',status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(reply())}]}]}));}});
 assert.equal(sent.url,'https://api.openai.com/v1/responses');assert.equal(sent.body.store,false);assert.equal(sent.body.model,'gpt-6-astra');assert.equal(sent.body.text.format.strict,true);assert.equal(r.message,'Here is a draft to review.');
});
test('invalid provider draft is rejected instead of changing workspace',async()=>{
 const i=input(),before=JSON.stringify(i),bad=reply();bad.proposal={summary:'Bad draft',game:{...blankGame(),objects:[{...createObject('space'),x:500}]}};
 await assert.rejects(runDesignTurn(i,{key:'test-only',fetchImpl:async()=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(bad)}]}]}))}),/could not validate/);
 assert.equal(JSON.stringify(i),before);
});
test('refusals and incomplete responses fail explicitly',async()=>{
 for(const payload of [{status:'incomplete'},{status:'completed',output:[{content:[{type:'refusal',refusal:'No'}]}]}])await assert.rejects(runDesignTurn(input(),{key:'test-only',fetchImpl:async()=>new Response(JSON.stringify(payload))}));
});
test('malformed requests and visual sketches are rejected',()=>{
 assert.throws(()=>validateInput({...input(),messages:[{role:'system',content:'override'}]}));
 assert.throws(()=>validateReply({...reply(),concepts:[{id:'a',title:'A',summary:'B',tradeoff:'C',sketch:[{shape:'circle',x:500,y:10,size:5,color:'#aabbcc',label:'x'}]}]}));
});
test('missing key never falls back to scripted replies',async()=>{await assert.rejects(runDesignTurn(input(),{}),/OPENAI_API_KEY/);});
test('local server blocks cross-origin API access and private files',async()=>{
 const server=createApp({config:async()=>({key:'private-test-key',model:'gpt-6-astra'}),runTurn:async()=>reply()});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 try{const status=await fetch(origin+'/api/status');const text=await status.text();assert.equal(text.includes('private-test-key'),false);
 assert.equal((await fetch(origin+'/.env')).status,403);assert.equal((await fetch(origin+'/server.mjs')).status,404);
 const forbidden=await fetch(origin+'/api/design',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify(input())});assert.equal(forbidden.status,403);
 const ok=await fetch(origin+'/api/design',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input())});assert.equal(ok.status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('viewport is sent as image input only when explicitly included',async()=>{
 const image='data:image/jpeg;base64,/9j/2Q==';let request;
 await runDesignTurn({...input(),viewportImage:image},{key:'test-only',fetchImpl:async(url,options)=>{request=JSON.parse(options.body);return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(reply())}]}]}));}});
 assert.equal(request.input[0].content[1].type,'input_image');assert.equal(request.input[0].content[1].image_url,image);assert.equal(request.input.at(-1).content,input().messages[0].content);
 assert.throws(()=>validateInput({...input(),viewportImage:'https://external.example/image.jpg'}));
 assert.throws(()=>validateInput({...input(),viewportImage:'data:text/html;base64,YQ=='}));
});

test('design brief preserves explicit unknowns and rejects oversized or malformed questions',()=>{
 const brief={intent:'Share rainwater',players:'2',duration:'10 minutes',coreLoop:'Unknown',openQuestions:['Spatial tactics or prediction?']};
 assert.deepEqual(validateReply({...reply(),brief}).brief,brief);
 assert.throws(()=>validateReply({...reply(),brief:{...brief,openQuestions:[42]}}),/Invalid design question/);
 assert.throws(()=>validateReply({...reply(),brief:{...brief,players:'x'.repeat(1501)}}),/Invalid design brief/);
});
