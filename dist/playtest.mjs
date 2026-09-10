import {validateGame} from './game-model.mjs';
import {newMatch,legalActions,applyAction,chooseAction,activePlayer,seededRandom} from './rules-engine.mjs';
// A bounded diagnostic, not a claim that people will find the game fun.
export function evaluateGame(raw,{seeds=4}={}){
 const game=validateGame(raw),c=game.runtime;
 if(!c)return {supported:false,summary:'Manual tabletop: no executable rules. Review the written rules and play with people.'};
 if(c.kind==='settlement'?c.tiles.length>37:c.spaceIds.length>16)return {supported:false,summary:'Automatic strategy diagnostics are limited to 16 grid spaces. Guided play remains available.'};
 const games=[];
 for(const policies of [['strategy','strategy'],['strategy','random'],['random','strategy']])for(let seed=1;seed<=Math.min(8,Math.max(1,seeds));seed++){
  const random=seededRandom(seed+800);let s=newMatch(c,seed),scoreless=0,actionCount=0;
  while(!s.finished){const p=activePlayer(c,s),actions=legalActions(c,s),a=policies[p]==='strategy'?chooseAction(c,s):actions[Math.floor(random()*actions.length)],before=s.scores[0]+s.scores[1];s=applyAction(c,s,a);actionCount++;if(s.scores[0]+s.scores[1]===before)scoreless++;}
  games.push({seed,policies,winner:s.winner,scores:s.scores,turns:s.turn,scoreless,actionCount});
 }
 const actionCount=games.reduce((n,g)=>n+g.actionCount,0);
 const wins=[0,1].map(p=>games.filter(g=>g.winner===p).length),ties=games.filter(g=>g.winner===null).length,turns=games.reduce((n,g)=>n+g.turns,0),scoreless=games.reduce((n,g)=>n+g.scoreless,0);
 const findings=[];
 if(Math.max(...wins)/games.length>.75)findings.push('One seat won over 75% of these diagnostics. Investigate opening position and policy bias with paired human games.');
 if(c.kind==='routing'&&scoreless/turns>.5)findings.push('More than half the turns produced no points. Check whether defensive loops feel repetitive.');
 if(games.every(g=>g.scores.every(s=>s===0)))findings.push('No points were scored. Revisit access to scoring opportunities.');
 if(!findings.length)findings.push('No coarse warning triggered. Human comprehension, enjoyment and balance remain unverified.');
 return {supported:true,game:game.name,matches:games.length,wins,ties,meanTurns:Number((turns/games.length).toFixed(1)),scorelessPercent:Math.round(scoreless/actionCount*100),findings,games,limitations:'Small deterministic sample using local heuristics (two-ply for grid games) and seeded random actions. Scoreless percentage counts actions, including free resource choices. Routing has no randomness, so repeated strategy matches are identical. These results do not establish balance or fun.'};
}
