import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateGame} from '../dist/game-model.mjs';
import {newMatch,traceWater,legalActions,applyAction,chooseAction,activePlayer,eventFor} from '../dist/rules-engine.mjs';
const game=name=>validateGame(JSON.parse(readFileSync(new URL('../dist/examples/'+name+'.json',import.meta.url))));
const routing=game('gutter-duel').runtime,rescue=game('last-light').runtime;
test('routing distinguishes both scoring edges, spills, and cycles',()=>{
 for(const [d,owner,reason] of [[0,0,'north delivery'],[2,1,'south delivery'],[1,null,'side spill']])assert.deepEqual(traceWater(routing,Array(9).fill(d)).owner,owner);
 const dirs=Array(9).fill(1);dirs[5]=3;assert.match(traceWater(routing,dirs).reason,/loop/);
});
test('turn transitions are immutable and locked tiles cannot be rotated twice',()=>{
 const s=newMatch(routing),original=structuredClone(s);const next=applyAction(routing,s,{delta:1,cell:4,type:'rotate'});
 assert.deepEqual(s,original);assert.equal(next.turn,1);assert.equal(next.locked,4);assert.equal(legalActions(routing,next).length,16);
 assert.throws(()=>applyAction(routing,next,{type:'rotate',cell:4,delta:-1}),/not legal/);
 assert.throws(()=>applyAction(routing,s,{type:'rotate',cell:0,delta:2}),/not legal/);
});
test('routing ends at the exact limit, records scores and rejects postgame actions',()=>{
 const c={...routing,turnLimit:2};let s=newMatch(c);s=applyAction(c,s,{type:'rotate',cell:4,delta:-1});assert.deepEqual(s.scores,[1,0]);
 s=applyAction(c,s,{type:'rotate',cell:8,delta:1});assert.equal(s.finished,true);assert.equal(s.winner,0);assert.deepEqual(legalActions(c,s),[]);
 assert.throws(()=>applyAction(c,s,{type:'rotate',cell:0,delta:1}));
});
test('rescue seed is reproducible and round initiative alternates',()=>{
 let s=newMatch(rescue,12);assert.deepEqual(s,newMatch(rescue,12));assert.equal(new Set(s.eventOrder).size,6);
 const order=[];for(let i=0;i<4;i++){order.push(activePlayer(rescue,s));s=applyAction(rescue,s,{type:'pass'});}assert.deepEqual(order,[0,1,1,0]);
});
test('rescue requires separate move and rescue actions and weather spares owned boats',()=>{
 const c=structuredClone(rescue);c.events=c.events.map(e=>({...e,sink:'none',steps:3}));let s=newMatch(c);s=applyAction(c,s,{type:'move',cell:0});assert.equal(s.boatOwners[0],null);
 s=applyAction(c,s,{type:'pass'});s=applyAction(c,s,{type:'pass'});s=applyAction(c,s,{type:'rescue',boat:0});assert.equal(s.scores[0],3);assert.equal(s.boatOwners[0],0);
 assert.throws(()=>applyAction(c,s,{type:'rescue',boat:0}));
 c.events=c.events.map(e=>({...e,sink:'low'}));s=applyAction(c,s,{type:'pass'});s=applyAction(c,s,{type:'pass'});assert.equal(s.boatOwners[0],0);assert.equal(s.boatOwners[1],-1);
});
test('weather movement limit and termination are enforced',()=>{
 const c=structuredClone(rescue);c.events=c.events.map(e=>({...e,steps:1,sink:'none'}));let s=newMatch(c);
 assert.equal(eventFor(c,s).steps,1);assert.throws(()=>applyAction(c,s,{type:'move',cell:2}));
 while(!s.finished)s=applyAction(c,s,{type:'pass'});assert.equal(s.turn,12);assert.equal(s.winner,null);
});
test('invalid runtime references fail before replacing a design',()=>{
 const g=game('last-light');g.runtime.pawnIds[0]='missing';assert.throws(()=>validateGame(g));
 const g2=game('gutter-duel');g2.runtime.spaceIds[0]=g2.runtime.spaceIds[1];assert.throws(()=>validateGame(g2));
});
test('both computer policies complete 40 seeded matches without illegal actions',()=>{
 for(const c of [routing,rescue])for(let seed=1;seed<=40;seed++){
  let s=newMatch(c,seed);while(!s.finished){const a=chooseAction(c,s);assert.ok(a);s=applyAction(c,s,a);assert.ok(s.turn<=c.turnLimit);}
  assert.ok(s.scores.every(n=>Number.isInteger(n)&&n>=0));assert.ok([null,0,1].includes(s.winner));
 }
});
test('guided grid rejects visual topology that disagrees with adjacency',()=>{const g=game('gutter-duel');g.objects.find(o=>o.id===g.runtime.spaceIds[4]).x+=1;assert.throws(()=>validateGame(g),/aligned/);});
test('saved match actions replay to the same complete state',()=>{for(const c of [routing,rescue]){let s=newMatch(c,3);while(!s.finished)s=applyAction(c,s,chooseAction(c,s));const replay=s.actions.reduce((state,action)=>applyAction(c,state,action),newMatch(c,3));assert.deepEqual(replay,s);}});
