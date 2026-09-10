import test from 'node:test';import assert from 'node:assert/strict';
import {blankGame,createObject,validateGame} from '../dist/game-model.mjs';import {newMatch,legalActions,applyAction,chooseAction} from '../dist/rules-engine.mjs';import {exportComponentSTL} from '../dist/stl-export.mjs';
export function island(){const g=blankGame();g.name='Island test fixture';const tiles=[];for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++)if(Math.abs(q+r)<=2){const i=tiles.length,o=createObject('space');o.id='t'+i;o.width=o.depth=3.2;o.x=2.771281*(q+r/2);o.z=2.4*r;g.objects.push(o);tiles.push({id:o.id,q,r,resource:['wood','brick','grain','ore'][i%4],number:i%6+1});}const pawns=[0,1].map(i=>{const o=createObject('piece');o.id='p'+i;o.shape='square';g.objects.push(o);return o.id;});g.runtime={kind:'settlement',tiles,playerNames:['Coral','Indigo'],playerColors:['#d78962','#6e82be'],starts:[0,18],pawnIds:pawns,turnLimit:40,targetPoints:6};return validateGame(g);}
test('island has legal production, one action, costs and adjacency',()=>{const c=island().runtime;let s=newMatch(c,1);if(s.choiceNeeded)s=applyAction(c,s,{type:'harvest',resource:'wood'});const a=legalActions(c,s).find(a=>a.type==='build');assert.ok(a);const before=structuredClone(s);s=applyAction(c,s,a);assert.equal(s.scores[0],2);assert.equal(s.resources[0].brick,before.resources[0].brick-1);assert.equal(s.owners[a.cell],0);assert.equal(s.turn,1);assert.throws(()=>applyAction(c,before,{type:'build',cell:18}));});
test('harvest is available only when production is absent, and does not spend the turn',()=>{const c=island().runtime;let s=newMatch(c,1);s.choiceNeeded=true;assert.ok(legalActions(c,s).every(a=>a.type==='harvest'));s=applyAction(c,s,{type:'harvest',resource:'grain'});assert.equal(s.turn,0);assert.equal(s.choiceNeeded,false);assert.throws(()=>applyAction(c,s,{type:'harvest',resource:'grain'}));});
test('bank trade uses exactly three resources and spends the action',()=>{const c=island().runtime;let s=newMatch(c,2);s.choiceNeeded=false;s.resources[0].wood=5;const grain=s.resources[0].grain;const next=applyAction(c,s,{type:'trade',give:'wood',receive:'grain'});assert.equal(next.resources[0].wood,2);assert.ok(next.resources[0].grain>=grain+1);assert.equal(next.turn,1);assert.equal(s.turn,0);});
test('twenty seeded island matches terminate and replay identically',()=>{const c=island().runtime;for(let seed=1;seed<=20;seed++){let s=newMatch(c,seed),steps=0;while(!s.finished){s=applyAction(c,s,chooseAction(c,s));assert.ok(++steps<=80);}assert.ok(s.turn<=40);assert.deepEqual(s.actions.reduce((a,b)=>applyAction(c,a,b),newMatch(c,seed)),s);}});
test('city production reaches both owners and suppresses free harvest only for the active owner',()=>{
 const c=island().runtime; c.tiles.forEach(t=>t.number=2);
 let s=newMatch(c,1);s.choiceNeeded=false;s.levels[c.starts[0]]=2;s.rng=1;
 const before=structuredClone(s.resources),next=applyAction(c,s,{type:'pass'});
 assert.equal(next.roll,2);assert.equal(next.choiceNeeded,false);
 assert.equal(next.resources[0][c.tiles[c.starts[0]].resource],before[0][c.tiles[c.starts[0]].resource]+2);
 assert.equal(next.resources[1][c.tiles[c.starts[1]].resource],before[1][c.tiles[c.starts[1]].resource]+1);
 c.tiles[c.starts[1]].number=3;
 assert.equal(applyAction(c,s,{type:'pass'}).choiceNeeded,true);
});
test('winning upgrade ends immediately, preserves input and rejects all postgame actions',()=>{
 const c=island().runtime;let s=newMatch(c,1);s.choiceNeeded=false;s.scores[0]=c.targetPoints-1;s.resources[0].grain=2;s.resources[0].ore=2;
 const before=structuredClone(s),next=applyAction(c,s,{type:'upgrade',cell:c.starts[0]});
 assert.equal(next.finished,true);assert.equal(next.winner,0);assert.equal(next.scores[0],c.targetPoints);assert.equal(next.turn,1);assert.equal(next.roll,s.roll);
 assert.equal(next.resources[0].grain,0);assert.equal(next.resources[0].ore,0);assert.equal(next.levels[c.starts[0]],2);assert.deepEqual(s,before);
 assert.deepEqual(legalActions(c,next),[]);assert.throws(()=>applyAction(c,next,{type:'pass'}));
});
test('turn cap supports shared victory without an extra production roll',()=>{
 const c=island().runtime,s=newMatch(c,1);s.turn=c.turnLimit-1;s.choiceNeeded=false;
 const next=applyAction(c,s,{type:'pass'});assert.equal(next.finished,true);assert.equal(next.turn,c.turnLimit);assert.equal(next.winner,null);assert.equal(next.roll,s.roll);
});
test('STL export is dimensioned, closed, binary and rejects bad requested scales',()=>{const o=createObject('piece');o.shape='square';o.width=2;o.height=1;o.depth=2;const r=exportComponentSTL(o,25);assert.equal(r.report.triangles,12);assert.equal(r.report.openEdges,0);assert.equal(r.report.heightMM,12.5);assert.equal(r.buffer.byteLength,684);assert.equal(new DataView(r.buffer).getUint32(80,true),12);assert.throws(()=>exportComponentSTL(o,0));});
