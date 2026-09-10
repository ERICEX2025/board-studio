import {runCodexTurn} from '../server/codex-agent.mjs';
import {blankGame} from '../dist/game-model.mjs';
import {writeFile} from 'node:fs/promises';
const prompt='Build a complete original printable 2-player game called Last Light, about rival lighthouse keepers rescuing boats before a storm. 10-15 minutes, simple enough to learn in two minutes. Use a small grid or track of spaces (maximum 12), 2 player pawns, 6 boat tokens, and at most 6 event cards in a deck. Include two distinctive lighthouse landmarks composed of editable primitive parts. Every physical resource must be included or explicitly listed as a household item. Rules must precisely cover setup, legal movement, turn order, rescue ownership/scoring, event timing, ending and tie breakers. No hidden mutable stats the editor cannot represent. Include a concrete short worked example in rules. This is a tabletop prototype with manual rules, not automated gameplay. Build now, no further questions; return complete proposal with at most 32 objects. Make the 3D view clear and printable footprints separated.';
const result=await runCodexTurn({game:blankGame(),messages:[{role:'user',content:prompt}]},{signal:AbortSignal.timeout(300000)});
if(!result.proposal)throw Error('No game proposal returned');
await writeFile('dist/examples/last-light.json',JSON.stringify(result.proposal.game,null,2));
await writeFile('submission/generation.json',JSON.stringify({prompt,provider:result.provider,model:result.model,message:result.message,critique:result.critique},null,2));
console.log(JSON.stringify({name:result.proposal.game.name,objects:result.proposal.game.objects.length,parts:result.proposal.game.objects.reduce((n,o)=>n+o.parts.length,0)}));
