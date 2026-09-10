import {newMatch,activePlayer,legalActions,applyAction,chooseAction,eventFor} from './rules-engine.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installMatch({getGame,onChange,onReview}){
 const panel=document.createElement('aside');panel.id='match-panel';panel.hidden=true;document.querySelector('.workspace').append(panel);
 let state=null,config=null,selected=null,active=false,opponent=true,seed=1,history=[],source=null;
 const api={get active(){return active;},get state(){return state;},get selectedId(){return config?.spaceIds[selected]??null;},get legalIds(){return state&&!state.finished?legalActions(config,state).map(a=>config.spaceIds[a.cell??config.boats[a.boat]?.cell]).filter(Boolean):[];},get pathIds(){return state?.lastPath.map(i=>config.spaceIds[i])??[];},enter,leave,selectObject,projection,reset:()=>{leave();state=null;source=null;}};
 function enter(){const g=getGame();if(!g.runtime)return false;config=g.runtime;if(source!==JSON.stringify(g)){state=null;source=JSON.stringify(g);}active=true;panel.hidden=false;document.body.classList.add('guided-play');render();return true;}
 function leave(){active=false;panel.hidden=true;document.body.classList.remove('guided-play');}
 function start(){state=newMatch(config,seed);history=[];selected=null;render();onChange();}
 function act(action){history.push(structuredClone(state));state=applyAction(config,state,action);selected=null;render();onChange();}
 function selectObject(id){if(!state||state.finished)return;const i=config.spaceIds.indexOf(id);if(i>=0)selected=i;else if(config.kind==='rescue'){const b=config.boats.find(b=>b.id===id);if(b)selected=b.cell;}render();onChange();}
 function actionName(a){return a.type==='rotate'?(a.delta===1?'Turn right · release water':'Turn left · release water'):a.type==='move'?'Move here':a.type==='rescue'?'Rescue boat '+(a.boat+1):'Pass this turn';}
 function render(){
  const c=config;if(!c)return;panel.scrollTop=0;
  if(!state){panel.innerHTML=`<div class="eyebrow">GUIDED TABLETOP</div><h2>${esc(getGame().name)}</h2><p>Two players. ${c.turnLimit/2} turns each. Rules, scores, and the ending are enforced.</p><div class="setup-steps"><h3>Set the table</h3><ol><li>${c.kind==='routing'?'Choose a garden. The shared inlet feeds both sides.':'Choose a lighthouse. Rescue boats before the storm.'}</li><li>${c.kind==='routing'?'Rotate one unlocked tile, then follow the water.':'Reveal weather, then move, rescue, or pass.'}</li><li>Most points wins. The paper kit uses these same rules.</li></ol></div><label class="opponent-choice"><input id="match-opponent" type="checkbox" ${opponent?'checked':''}> Play against the computer</label><p class="match-note">Computer opponent: local two-ply strategy, not a live model call.</p><label>Replay seed<input id="match-seed" type="number" min="1" max="999999" value="${seed}"></label><button class="primary" id="match-start">Start game</button><button id="match-rules">Read the rules</button>`;
   panel.querySelector('#match-opponent').onchange=e=>opponent=e.target.checked;panel.querySelector('#match-seed').onchange=e=>seed=Math.max(1,Math.min(999999,Number(e.target.value)||1));panel.querySelector('#match-start').onclick=start;panel.querySelector('#match-rules').onclick=()=>document.getElementById('edit-rules').click();return;}
  const p=activePlayer(c,state),computer=opponent&&p===1&&!state.finished,actions=legalActions(c,state),available=selected===null?[]:actions.filter(a=>a.cell===selected||(a.type==='rescue'&&c.boats[a.boat].cell===selected));
  const winner=state.winner===null?'Shared victory':c.playerNames[state.winner]+' wins';
  panel.innerHTML=`<div class="eyebrow">${state.finished?'GAME COMPLETE':`TURN ${state.turn+1} / ${c.turnLimit}`}</div><h2>${esc(state.finished?winner:computer?'Computer’s turn':c.playerNames[p]+'’s turn')}</h2><div class="scoreboard">${c.playerNames.map((name,i)=>`<div class="${i===p&&!state.finished?'current':''}"><span>${esc(name)}</span><strong>${state.scores[i]}</strong><small>${opponent&&i===1?'Computer':'Player '+(i+1)}</small></div>`).join('')}</div>
  ${state.finished?'<p>The final score is recorded below. Play a rematch or print the game to try it on paper.</p>':c.kind==='routing'?`<p class="turn-instruction">${computer?'The computer will choose a legal quarter-turn.':'Select a gutter, then turn it left or right. Water resolves automatically.'}</p><p class="match-note">${state.locked===null?'All gutters are available.':'Gutter '+(state.locked+1)+' is locked for this turn.'}</p>`:`<div class="weather-card"><b>${esc(getGame().objects.find(o=>o.id===eventFor(c,state).id)?.name||'Weather')}</b><p>Move up to ${eventFor(c,state).steps} spaces, rescue on your space, or pass.</p><small>${eventFor(c,state).sink==='none'?'No boat sank this round.':'Sinking resolved before the first action.'}</small></div>`}
  ${!state.finished&&!computer?`<div class="action-menu"><label for="match-space">Choose a space</label><select id="match-space"><option value="">Select on board or here</option>${c.spaceIds.map((id,i)=>`<option value="${i}" ${selected===i?'selected':''}>${i+1}. ${esc(getGame().objects.find(o=>o.id===id)?.name)}</option>`).join('')}</select>${selected!==null?`<h3>${esc(getGame().objects.find(o=>o.id===c.spaceIds[selected])?.name)}</h3>`:''}${available.map((a,i)=>`<button class="primary" data-action="${i}">${actionName(a)}</button>`).join('')}${selected!==null&&!available.length?'<p>This tile has no legal action right now. Choose another highlighted tile.</p>':''}${c.kind==='rescue'?'<button id="match-pass">Pass this turn</button>':''}</div>`:''}
  ${computer?'<button class="primary" id="computer-move">Play computer turn</button>':''}<details class="match-log" open><summary>What happened</summary><ol>${state.log.slice(-5).map(line=>`<li>${esc(line)}</li>`).join('')||'<li>The table is ready.</li>'}</ol></details>${state.finished?'<button class="primary" id="match-review">Review this match with Astra</button><button id="match-export">Save match record</button>':''}<div class="match-controls"><button id="match-undo" ${history.length?'':'disabled'}>Undo turn</button><button id="match-restart">New match</button><button id="match-rules">Rules</button></div>`;
  panel.querySelector('#match-space')?.addEventListener('change',e=>{if(e.target.value!=='')selectObject(c.spaceIds[Number(e.target.value)]);});
  panel.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(available[Number(b.dataset.action)]));
  panel.querySelector('#match-pass')?.addEventListener('click',()=>act({type:'pass'}));
  panel.querySelector('#computer-move')?.addEventListener('click',()=>act(chooseAction(c,state)));
  panel.querySelector('#match-review')?.addEventListener('click',()=>onReview?.({seed:state.seed,scores:state.scores,winner:state.winner,turns:state.turn,log:state.log,opponent:opponent?'local two-ply strategy':'two humans'}));
  panel.querySelector('#match-export')?.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({format:'board-studio-match',version:1,game:getGame(),state},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='board-studio-match.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  panel.querySelector('#match-undo').onclick=()=>{if(history.length){state=history.pop();selected=null;render();onChange();}};
  panel.querySelector('#match-restart').onclick=()=>{state=null;history=[];selected=null;render();onChange();};
  panel.querySelector('#match-rules').onclick=()=>document.getElementById('edit-rules').click();
 }
 function projection(){
  if(!active||!config)return null;const doc=structuredClone(getGame());if(!state)return doc;
  if(config.kind==='routing')doc.objects=doc.objects.filter(o=>o.type!=='card');
  const find=id=>doc.objects.find(o=>o.id===id),space=i=>find(config.spaceIds[i]);
  if(config.kind==='routing'){
   config.spaceIds.forEach((id,i)=>{find(id).text='↑→↓←'[state.directions[i]]+(i===config.starts[0]?'\nINLET':'');find(id).rotation=0;});
   for(const [id,cell] of [[config.waterId,state.lastPath.at(-1)??config.starts[0]],[config.lockId,state.locked]])if(cell!==null){const o=find(id),s=space(cell);o.x=s.x+.7;o.z=s.z+.7;}
  }else{
   config.pawnIds.forEach((id,i)=>{const o=find(id),s=space(state.pawns[i]);o.x=s.x+(i===0?-.6:.6);o.z=s.z+.5;});
   config.boats.forEach((b,i)=>{const o=find(b.id),owner=state.boatOwners[i];if(owner===null){const s=space(b.cell);o.x=s.x;o.z=s.z-.4;}else if(owner===-1){o.x=(i-2.5)*1.2;o.z=10;o.color='#69717a';}else{const goal=find(config.goalIds[owner]);const slot=state.boatOwners.slice(0,i).filter(x=>x===owner).length;o.x=goal.x+(owner===0?-1:1)*(1.8+Math.floor(slot/3)*1.2);o.z=goal.z+(slot%3-1)*1.2;}});
   const current=eventFor(config,state);if(current){const card=find(current.id);card.drawn=true;card.x=7;card.z=-7;const deck=find(card.deckId);if(deck)deck.name='Weather: '+Math.max(0,config.events.length-Math.floor(state.turn/2)-1)+' left';doc.objects=doc.objects.filter(o=>o.type!=='card'||o.id===current.id);}
  }
  return doc;
 }
 return api;
}
