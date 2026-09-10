import test from 'node:test';
import assert from 'node:assert/strict';
import {compareGames} from '../dist/proposal-diff.mjs';
import {blankGame,createObject} from '../dist/game-model.mjs';
test('proposal review distinguishes retained IDs from additions, removals and rule changes',()=>{
 const old=blankGame();old.objects=[createObject('space'),createObject('piece')];
 const next=structuredClone(old);next.objects[0].name='Revised space';next.objects.pop();next.objects.push(createObject('card'));next.rules.victory='First to three wins.';
 const diff=compareGames(old,next);assert.deepEqual(diff.changed,['Revised space']);assert.equal(diff.added.length,1);assert.equal(diff.removed.length,1);assert.deepEqual(diff.rules,['victory']);assert.equal(compareGames(old,old).changed.length,0);
});
