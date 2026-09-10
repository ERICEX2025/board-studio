import {validateSettlement,newSettlement,settlementActions,applySettlement,settlementChoice,settlementRules} from './settlement-engine.mjs';
// Declarative, deterministic tabletop runtime. No generated code is executed.
const fail=message=>{throw Error(message);};
export function validateRuntime(raw,objects){
 if(raw==null)return null;if(raw.kind==='settlement')return validateSettlement(raw,objects);
 const c=structuredClone(raw),ids=new Map(objects.map(o=>[o.id,o]));
 if(!['routing','rescue'].includes(c.kind))fail('Unsupported rules family. Choose routing or rescue, or use a manual tabletop.');
 for(const key of ['rows','columns'])if(!Number.isInteger(c[key])||c[key]<2||c[key]>8)fail('Rules grid must have 2–8 rows and columns.');
 if(!Number.isInteger(c.turnLimit)||c.turnLimit<2||c.turnLimit>100||c.turnLimit%2)fail('Turn limit must be an even number from 2 to 100.');
 const ref=(id,type)=>{if(typeof id!=='string'||!ids.has(id)||(type&&ids.get(id).type!==type))fail('Rules reference a missing or incompatible component: '+String(id));};
 if(!Array.isArray(c.spaceIds)||c.spaceIds.length!==c.rows*c.columns||new Set(c.spaceIds).size!==c.spaceIds.length)fail('Rules grid must reference each space once.');
 c.spaceIds.forEach(id=>ref(id,'space'));
 const grid=c.spaceIds.map(id=>ids.get(id));
 for(let i=0;i<grid.length;i++){const row=Math.floor(i/c.columns),col=i%c.columns,o=grid[i];if(Math.abs(o.x-grid[col].x)>.01||Math.abs(o.z-grid[row*c.columns].z)>.01||(col&&o.x<=grid[i-1].x)||(row&&o.z<=grid[i-c.columns].z))fail('Guided spaces must form aligned rows and columns, ordered west to east then north to south.');}
 if(!Array.isArray(c.playerNames)||c.playerNames.length!==2||c.playerNames.some(n=>typeof n!=='string'||!n.trim()||n.length>40))fail('Exactly two named players are required.');
 if(!Array.isArray(c.goalIds)||c.goalIds.length!==2||new Set(c.goalIds).size!==2)fail('Two distinct scoring destinations are required.');c.goalIds.forEach(id=>{ref(id);if(c.spaceIds.includes(id))fail('Scoring destinations must be separate from grid spaces.');});
 if(!Array.isArray(c.pawnIds)||!Array.isArray(c.starts)||!Array.isArray(c.directions)||!Array.isArray(c.boats)||!Array.isArray(c.events))fail('Incomplete rules configuration.');
 const cell=n=>Number.isInteger(n)&&n>=0&&n<c.spaceIds.length;
 if(c.kind==='routing'){
  if(c.directions.length!==c.spaceIds.length||c.directions.some(n=>!Number.isInteger(n)||n<0||n>3))fail('Every gutter needs a direction: 0 north, 1 east, 2 south, 3 west.');
  if(c.starts.length!==1||!cell(c.starts[0]))fail('Routing needs one inlet cell.');
  ref(c.waterId,'piece');ref(c.lockId,'piece');if(c.goalIds.includes(c.waterId)||c.goalIds.includes(c.lockId))fail('Markers must be separate from scoring destinations.');if(c.waterId===c.lockId)fail('Water and lock markers must differ.');
  if(c.pawnIds.length||c.boats.length||c.events.length)fail('Routing does not use pawns, boats or events.');
 }else{
  if(c.pawnIds.length!==2||new Set(c.pawnIds).size!==2||c.starts.length!==2||!c.starts.every(cell))fail('Rescue needs two pawns with valid starts.');c.pawnIds.forEach(id=>{ref(id,'piece');if(c.goalIds.includes(id))fail('Pawns must differ from scoring destinations.');});
  if(c.events.length!==c.turnLimit/2||c.events.length>50)fail('Rescue needs exactly one event per round.');
  if(!c.boats.length||c.boats.length>30||new Set(c.boats.map(b=>b.id)).size!==c.boats.length||new Set(c.boats.map(b=>b.cell)).size!==c.boats.length)fail('Boats need unique components and starting cells.');
  c.boats.forEach(b=>{ref(b.id,'piece');if(c.pawnIds.includes(b.id)||c.goalIds.includes(b.id)||!cell(b.cell)||!Number.isInteger(b.value)||b.value<1||b.value>20)fail('Invalid boat placement or value.');});
  if(new Set(c.events.map(e=>e.id)).size!==c.events.length)fail('Event cards must be unique.');
  c.events.forEach(e=>{ref(e.id,'card');if(!Number.isInteger(e.steps)||e.steps<1||e.steps>8||!['none','low','high'].includes(e.sink))fail('Invalid event effect.');});
  if(c.directions.length||c.waterId!==null||c.lockId!==null)fail('Rescue does not use directions or water markers.');
 }
 return c;
}
export function seededRandom(seed=1){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function newMatch(config,seed=1){
 if(config.kind==='settlement')return newSettlement(config,seed);
 const order=config.events.map((_,i)=>i),random=seededRandom(seed);for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const s={turn:0,scores:[0,0],directions:[...config.directions],locked:null,pawns:[...config.starts],boatOwners:config.boats.map(()=>null),eventOrder:order,finished:false,winner:null,lastPath:[],log:[],actions:[],seed};
 if(config.kind==='rescue')beginRound(config,s);return s;
}
export function activePlayer(c,s){return c.kind!=='rescue'?s.turn%2:(Math.floor(s.turn/2)%2+s.turn%2)%2;}
export function eventFor(c,s){return c.events[s.eventOrder[Math.min(Math.floor(s.turn/2),c.events.length-1)]];}
function finish(c,s){
 if(s.turn<c.turnLimit&&!(c.kind==='rescue'&&s.boatOwners.every(x=>x!==null)))return;
 s.finished=true;const counts=[0,1].map(p=>s.boatOwners.filter(o=>o===p).length);
 s.winner=s.scores[0]!==s.scores[1]?(s.scores[0]>s.scores[1]?0:1):c.kind==='rescue'&&counts[0]!==counts[1]?(counts[0]>counts[1]?0:1):null;
}
function beginRound(c,s){
 const e=eventFor(c,s);if(!e)return;
 const available=c.boats.map((b,i)=>i).filter(i=>s.boatOwners[i]===null);
 if(e.sink!=='none'&&available.length){const i=e.sink==='low'?available[0]:available.at(-1);s.boatOwners[i]=-1;s.log.push('Weather: boat '+(i+1)+' sank before either turn.');}
 finish(c,s);
}
export function traceWater(c,directions){
 let cell=c.starts[0];const path=[],seen=new Set();
 while(!seen.has(cell)){
  seen.add(cell);path.push(cell);const row=Math.floor(cell/c.columns),col=cell%c.columns,dir=directions[cell];
  if(dir===0&&row===0)return {path,owner:0,reason:'north delivery'};
  if(dir===2&&row===c.rows-1)return {path,owner:1,reason:'south delivery'};
  if((dir===1&&col===c.columns-1)||(dir===3&&col===0))return {path,owner:null,reason:'side spill'};
  cell+=[-c.columns,1,c.columns,-1][dir];
 }
 return {path,owner:null,reason:'loop: water revisited a gutter'};
}
export function legalActions(c,s){
 if(c.kind==='settlement')return settlementActions(c,s);
 if(s.finished)return [];
 if(c.kind==='routing')return c.spaceIds.flatMap((_,cell)=>cell===s.locked?[]:[{type:'rotate',cell,delta:-1},{type:'rotate',cell,delta:1}]);
 const p=activePlayer(c,s),from=s.pawns[p],steps=eventFor(c,s).steps;
 const moves=c.spaceIds.flatMap((_,cell)=>cell!==from&&Math.abs(Math.floor(cell/c.columns)-Math.floor(from/c.columns))+Math.abs(cell%c.columns-from%c.columns)<=steps?[{type:'move',cell}]:[]);
 const rescues=c.boats.flatMap((b,i)=>b.cell===from&&s.boatOwners[i]===null?[{type:'rescue',boat:i}]:[]);
 return [...moves,...rescues,{type:'pass'}];
}
export function applyAction(c,state,action){
 if(c.kind==='settlement')return applySettlement(c,state,action);
 if(!legalActions(c,state).some(a=>action&&Object.keys(a).length===Object.keys(action).length&&Object.keys(a).every(k=>a[k]===action[k])))fail('That action is not legal on this turn.');
 const s=structuredClone(state),p=activePlayer(c,s),name=c.playerNames[p];
 if(c.kind==='routing'){
  s.directions[action.cell]=(s.directions[action.cell]+action.delta+4)%4;s.locked=action.cell;
  const trace=traceWater(c,s.directions);s.lastPath=trace.path;if(trace.owner!==null)s.scores[trace.owner]++;
  s.log.push(`${name} rotated gutter ${action.cell+1}: ${trace.reason}${trace.owner===null?'':'; '+c.playerNames[trace.owner]+' +1'}.`);
 }else if(action.type==='move'){s.pawns[p]=action.cell;s.log.push(`${name} moved to space ${action.cell+1}.`);}
 else if(action.type==='rescue'){s.boatOwners[action.boat]=p;s.scores[p]+=c.boats[action.boat].value;s.log.push(`${name} rescued boat ${action.boat+1} for ${c.boats[action.boat].value} points.`);}
 else s.log.push(name+' passed.');
 s.actions.push(structuredClone(action));s.turn++;finish(c,s);if(c.kind==='rescue'&&!s.finished&&s.turn%2===0)beginRound(c,s);
 return s;
}
function value(c,s,p){
 let n=(s.scores[p]-s.scores[1-p])*100;if(s.finished)return n+(s.winner===p?10000:s.winner===1-p?-10000:0);
 if(c.kind==='rescue'){const pos=s.pawns[p];for(let i=0;i<c.boats.length;i++)if(s.boatOwners[i]===null){const b=c.boats[i],distance=Math.abs(Math.floor(pos/c.columns)-Math.floor(b.cell/c.columns))+Math.abs(pos%c.columns-b.cell%c.columns);n+=b.value*8/(1+distance);}}
 return n;
}
export function chooseAction(c,s){
 if(c.kind==='settlement')return settlementChoice(c,s);
 const p=activePlayer(c,s);let best=null,bestValue=-Infinity;
 for(const a of legalActions(c,s)){
  const next=applyAction(c,s,a);let score=value(c,next,p);
  if(!next.finished){const replies=legalActions(c,next).map(b=>value(c,applyAction(c,next,b),p));score=(activePlayer(c,next)===p?Math.max(...replies):Math.min(...replies))+score*.05;}
  if(score>bestValue){bestValue=score;best=a;}
 }
 return best;
}
export function rulesText(c){
 if(c.kind==='settlement')return settlementRules(c);
 const names=c.playerNames.join(' and '),grid=`${c.rows} × ${c.columns}`;
 if(c.kind==='routing')return {
  setup:`Two players: ${names}. Arrange the ${c.spaceIds.length} separately cut gutter tiles in the ${grid} grid shown on the board. The first garden is north; the second is south. Directions stay fixed regardless of seating. Initial arrows, row by row: ${Array.from({length:c.rows},(_,r)=>c.directions.slice(r*c.columns,(r+1)*c.columns).map(d=>'↑→↓←'[d]).join(' ')).join(' / ')}. The inlet is gutter ${c.starts[0]+1}. Set the water and lock markers beside the board. On paper, use a pencil and paper for scores and turn tallies. Start both scores at zero; ${c.playerNames[0]} goes first.`,
  turns:`Alternate turns. Rotate exactly one unlocked gutter 90° left or right, then place the lock marker on it. The previously locked tile becomes available. Follow one drop from the inlet through each arrow. All sides accept entry; only the outgoing arrow matters. Stop on leaving the grid or revisiting a tile. The lock never blocks water. Return the water marker to the inlet after tracing. Record one completed turn. No half-turns or passes. Example: if the inlet arrow leads to a north-facing gutter that exits the top edge, ${c.playerNames[0]} scores one, even on the other player's turn.`,
  scoring:`Any north exit scores 1 for ${c.playerNames[0]}; any south exit scores 1 for ${c.playerNames[1]}. Side exits and loops score zero. Scores depend on the destination, not who released the drop.`,
  victory:`Finish after exactly ${c.turnLimit} turns (${c.turnLimit/2} per player). Higher score wins; equal scores are a shared victory. No overtime. Swap first player for a rematch. The digital game enforces these same actions and ending conditions.`};
 return {
  setup:`Two players: ${names}. Arrange the ${grid} board as shown. Place each pawn on its marked starting space. Place boats on their numbered starting spaces; boat values in order are ${c.boats.map(b=>b.value).join(', ')}. Place the two lighthouse ownership markers beside the board. Shuffle the ${c.events.length} weather cards face down; keep their backs indistinguishable. Leave separate areas for rescued boats, sunk boats and discarded weather. No dice or extra score counters are needed.`,
  turns:`Each round, reveal one weather card and resolve its sinking effect before either player acts. Lowest/highest means boat number among boats still on the board. Both keepers then take one action. ${c.playerNames[0]} starts odd rounds and ${c.playerNames[1]} starts even rounds. Move 1 to the weather's step limit through edge-adjacent spaces; or rescue a boat on your current space without moving; or pass. Pawns may share spaces and do not block boats or one another. Moving never rescues automatically. Put rescued boats beside the rescuer's lighthouse; sunk boats cannot return. After both turns, discard the event. Example: a keeper moves onto a boat on one turn and must spend a later turn rescuing it, if weather or the other keeper has not removed it.`,
  scoring:`Each rescued boat scores its printed value for its owner. Rescued boats are safe from weather. Sunk and unrescued boats score zero. Keep rescued tokens visible to record scores.`,
  victory:`End as soon as no boats remain on the board, or after both actions in round ${c.events.length}. Higher points wins; tied points are broken by number of boats rescued. If both tie, share victory. The final weather does not end the game until both actions resolve, unless the board empties sooner.`};
}
