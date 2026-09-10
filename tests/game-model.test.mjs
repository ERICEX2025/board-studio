import test from 'node:test';
import assert from 'node:assert/strict';
import { blankGame, createObject, layoutObjects, validateGame, serializeGame, removeObject, deckCards } from '../dist/game-model.mjs';

test('blank workspace has no game-specific content', () => {
  const game = blankGame();
  assert.equal(game.objects.length, 0);
  assert.deepEqual(Object.values(game.rules), ['', '', '', '']);
  assert.deepEqual(validateGame(game), game);
});

test('all starting layouts are distinct valid editable spaces', () => {
  for (const [layout, expected] of [['hex',19],['grid',25],['track',20]]) {
    const game = blankGame(); game.objects = layoutObjects(layout);
    assert.equal(game.objects.length, expected);
    assert.equal(new Set(game.objects.map(o=>o.id)).size, expected);
    assert.equal(new Set(game.objects.map(o=>[o.x,o.z].join(','))).size, expected);
    assert.deepEqual(validateGame(game), game);
  }
  assert.throws(()=>layoutObjects('unknown'));
});

test('save round-trip preserves cards, custom properties, transforms, and rules', () => {
  const game = blankGame(); game.name = 'Train Auction';
  const space = createObject('space'); space.properties = [{key:'Price',value:'200'},{key:'Effect',value:'Draw a card'}]; space.rotation=45;
  const deck = createObject('deck'); deck.name='Events';
  const card = createObject('card',0,deck.id); card.text='Collect 30 coins\nThen move two spaces.';
  game.objects=[space,deck,card]; game.rules.victory='First player to score 12 points wins.';
  assert.deepEqual(validateGame(JSON.parse(serializeGame(game))),game);
});

test('invalid imports fail without changing the existing document', () => {
  const game=blankGame();game.objects=[createObject('piece')];const before=serializeGame(game);
  const cases=[
    g=>g.objects[0].x=Infinity,
    g=>g.objects[0].width=-2,
    g=>g.objects[0].color='red;position:fixed',
    g=>g.objects.push({...g.objects[0]}),
    g=>g.objects[0].properties=[{key:'cost',value:{bad:true}}],
    g=>g.objects[0].deckId='missing-deck',
    g=>g.version=99,
  ];
  for(const mutate of cases){const incoming=structuredClone(game);mutate(incoming);assert.throws(()=>validateGame(incoming));}
  assert.equal(serializeGame(game),before);
});

test('removing a deck preserves its cards as standalone components', () => {
  const game=blankGame(),deck=createObject('deck'),card=createObject('card',0,deck.id);
  card.drawn=true;game.objects=[deck,card];removeObject(game,deck.id);
  assert.equal(game.objects.length,1);assert.equal(card.deckId,null);assert.equal(card.drawn,false);
  assert.deepEqual(validateGame(game),game);
});

test('deck card ordering does not mix cards between decks', () => {
  const game=blankGame(),a=createObject('deck'),b=createObject('deck');
  const a2=createObject('card',2,a.id),a1=createObject('card',1,a.id),b0=createObject('card',0,b.id);
  game.objects=[a,b,a2,b0,a1];assert.deepEqual(deckCards(game,a.id).map(c=>c.id),[a1.id,a2.id]);
  assert.deepEqual(game.objects.map(c=>c.id),[a.id,b.id,a2.id,b0.id,a1.id]);
});

test('custom parts survive save/open and old files get empty part lists', async()=>{
 const {createPart}=await import('../dist/game-model.mjs');const game=blankGame(),piece=createObject('piece'),part=createPart('cone');part.name='Tower roof';part.y=1.4;piece.parts=[part];game.objects=[piece];
 assert.deepEqual(validateGame(JSON.parse(serializeGame(game))),game);
 const old=structuredClone(game);delete old.objects[0].parts;assert.deepEqual(validateGame(old).objects[0].parts,[]);
 for(const mutate of [p=>p.kind='script',p=>p.width=-1,p=>p.y=Infinity,p=>p.metalness=2]){const bad=structuredClone(game);mutate(bad.objects[0].parts[0]);assert.throws(()=>validateGame(bad));}
 const duplicate=structuredClone(game);duplicate.objects[0].parts.push({...part});assert.throws(()=>validateGame(duplicate));
});
