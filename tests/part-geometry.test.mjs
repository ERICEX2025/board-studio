import test from 'node:test';
import assert from 'node:assert/strict';
import {partGeometry} from '../dist/part-geometry.js';
import {createPart,PRIMITIVES} from '../dist/game-model.mjs';
test('all primitives render finite geometry at the requested bounds',()=>{
 for(const kind of PRIMITIVES){const p=createPart(kind);p.width=2;p.height=3;p.depth=4;const g=partGeometry(p);g.computeBoundingBox();const b=g.boundingBox;assert.ok(Math.abs(b.max.x-b.min.x-2)<.03,kind+' width');assert.ok(Math.abs(b.max.y-b.min.y-3)<.03,kind+' height');assert.ok(Math.abs(b.max.z-b.min.z-4)<.03,kind+' depth');assert.ok([...g.attributes.position.array].every(Number.isFinite));g.dispose();}
});
