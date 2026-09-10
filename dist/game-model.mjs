export const FORMAT = 'board-studio';
export const TYPES = ['space', 'piece', 'card', 'deck'];
export const PRIMITIVES = ['box', 'cylinder', 'cone', 'sphere', 'torus'];
export const SHAPES = ['hex', 'square', 'circle'];
export function blankGame() {
  return { format: FORMAT, version: 1, name: 'Untitled game', objects: [], rules: { setup: '', turns: '', scoring: '', victory: '' } };
}
export function createObject(type, count = 0, deckId = null) {
  if (!TYPES.includes(type)) throw new Error('Unknown component type.');
  const defaults = {
    space: { name: 'New space', color: '#9caf68', shape: 'hex', width: 2.3, depth: 2.3, height: .2 },
    piece: { name: 'Player piece', color: '#ed9d87', shape: 'circle', width: .55, depth: .55, height: .8 },
    card: { name: 'New card', color: '#e9dfc8', shape: 'square', width: 1.6, depth: 2.3, height: .04 },
    deck: { name: 'New deck', color: '#8199b1', shape: 'square', width: 1.6, depth: 2.3, height: .3 },
  };
  return { id: crypto.randomUUID(), type, ...defaults[type], x: (count % 4) * 1.5 - 2, z: Math.floor(count / 4) * 1.5 - 1,
    rotation: 0, text: '', parts: [], properties: [], deckId: type === 'card' ? deckId : null, drawn: false, order: count };
}
export function layoutObjects(layout) {
  if (!['hex', 'grid', 'track'].includes(layout)) throw new Error('Unknown layout.');
  const coords = [];
  if (layout === 'hex') {
    for (let q = -2; q <= 2; q++) for (let r = -2; r <= 2; r++) {
      if (Math.abs(q + r) <= 2) coords.push([Math.sqrt(3) * 1.27 * (q + r / 2), 1.905 * r]);
    }
  } else if (layout === 'grid') {
    for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) coords.push([(x - 2) * 1.7, (z - 2) * 1.7]);
  } else {
    for (let x = 0; x < 6; x++) coords.push([(x - 2.5) * 1.7, -4.25]);
    for (let z = 1; z < 6; z++) coords.push([4.25, (z - 2.5) * 1.7]);
    for (let x = 4; x >= 0; x--) coords.push([(x - 2.5) * 1.7, 4.25]);
    for (let z = 4; z > 0; z--) coords.push([-4.25, (z - 2.5) * 1.7]);
  }
  return coords.map(([x, z], i) => ({ ...createObject('space', i), name: 'Space ' + (i + 1), x, z,
    shape: layout === 'hex' ? 'hex' : 'square', width: layout === 'hex' ? 2.45 : 1.6,
    depth: layout === 'hex' ? 2.45 : 1.6, color: layout === 'track' && i === 0 ? '#ed9d87' : '#9caf68' }));
}
function text(value, max, label) {
  if (typeof value !== 'string' || value.length > max) throw new Error('Invalid ' + label + '.');
  return value;
}
function num(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error('Invalid ' + label + '.');
  return value;
}
export function validateGame(raw) {
  if (!raw || raw.format !== FORMAT || raw.version !== 1) throw new Error('Choose a Board Studio v1 game file.');
  if (!Array.isArray(raw.objects) || raw.objects.length > 250) throw new Error('Games support up to 250 components.');
  const game = blankGame();
  game.name = text(raw.name, 80, 'game name');
  for (const key of Object.keys(game.rules)) game.rules[key] = text(raw.rules?.[key], 8000, key + ' rules');
  const ids = new Set();
  let partCount = 0;
  game.objects = raw.objects.map(o => {
    if (!o || !TYPES.includes(o.type) || !SHAPES.includes(o.shape)) throw new Error('Invalid component type or shape.');
    const id = text(o.id, 80, 'component id');
    if (!id || ids.has(id)) throw new Error('Component IDs must be unique.');
    ids.add(id);
    if (!/^#[0-9a-f]{6}$/i.test(o.color)) throw new Error('Invalid component color.');
    if (!Array.isArray(o.properties) || o.properties.length > 30) throw new Error('Invalid custom properties.');
    if (typeof o.drawn !== 'boolean') throw new Error('Invalid card state.');
    const parts = validateParts(o.parts ?? []);
    partCount += parts.length;
    if (partCount > 1200) throw new Error('Scene supports up to 1200 custom parts.');
    return { id, parts, type: o.type, name: text(o.name, 80, 'component name'), shape: o.shape, color: o.color,
      x: num(o.x, -30, 30, 'position'), z: num(o.z, -30, 30, 'position'), rotation: num(o.rotation, -360, 360, 'rotation'),
      width: num(o.width, .2, 12, 'width'), depth: num(o.depth, .2, 12, 'depth'), height: num(o.height, .02, 6, 'height'),
      text: text(o.text, 3000, 'component text'), deckId: o.deckId === null ? null : text(o.deckId, 80, 'deck reference'),
      drawn: o.drawn, order: num(o.order, 0, 10000, 'card order'),
      properties: o.properties.map(p => ({ key: text(p?.key, 40, 'property name'), value: text(p?.value, 200, 'property value') })) };
  });
  for (const o of game.objects) {
    if (o.deckId !== null && (o.type !== 'card' || !game.objects.some(d => d.id === o.deckId && d.type === 'deck'))) {
      throw new Error('A card references a missing deck.');
    }
  }
  return game;
}
export function removeObject(game, id) {
  game.objects = game.objects.filter(o => o.id !== id);
  for (const o of game.objects) if (o.deckId === id) { o.deckId = null; o.drawn = false; }
}
export function deckCards(game, id) { return game.objects.filter(o => o.type === 'card' && o.deckId === id).sort((a, b) => a.order - b.order); }
export function serializeGame(game) { return JSON.stringify(validateGame(game), null, 2); }

export function createPart(kind='box') {
  if (!PRIMITIVES.includes(kind)) throw new Error('Unsupported geometry.');
  return {id:crypto.randomUUID(),name:kind,kind,x:0,y:.5,z:0,rx:0,ry:0,rz:0,width:1,height:1,depth:1,color:'#a5a5a5',roughness:.7,metalness:0};
}
export function validateParts(parts) {
  if (!Array.isArray(parts) || parts.length > 32) throw new Error('A component supports up to 32 parts.');
  const ids=new Set();
  return parts.map(p=>{
    if (!p || !PRIMITIVES.includes(p.kind)) throw new Error('Unsupported part geometry.');
    const id=text(p.id,80,'part ID'); if (!id || ids.has(id)) throw new Error('Part IDs must be unique within a component.');ids.add(id);
    if (!/^#[0-9a-f]{6}$/i.test(p.color)) throw new Error('Invalid part color.');
    return {id,name:text(p.name,80,'part name'),kind:p.kind,
      x:num(p.x,-12,12,'part X'),y:num(p.y,-6,12,'part Y'),z:num(p.z,-12,12,'part Z'),
      rx:num(p.rx,-360,360,'part rotation'),ry:num(p.ry,-360,360,'part rotation'),rz:num(p.rz,-360,360,'part rotation'),
      width:num(p.width,.02,12,'part width'),height:num(p.height,.02,12,'part height'),depth:num(p.depth,.02,12,'part depth'),
      color:p.color,roughness:num(p.roughness,0,1,'roughness'),metalness:num(p.metalness,0,1,'metalness')};
  });
}
