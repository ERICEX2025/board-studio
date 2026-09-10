import * as THREE from 'three';
import {partGeometry} from './part-geometry.js';
import { installDesignChat } from './design-chat.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { blankGame, createObject, layoutObjects, validateGame, serializeGame, removeObject, deckCards, createPart, PRIMITIVES } from './game-model.mjs';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let game = blankGame(), selected = null, mode = 'build', history = [], dirty = false, timer;
let scene, renderer, camera, controls, world, observer;
let chat=null,previewGame=null;
const targets = [], ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
const ruleLabels = { setup: 'Setup', turns: 'Turn sequence & actions', scoring: 'Scoring & resources', victory: 'Victory / end of game' };
function current() { return game.objects.find(o => o.id === selected); }
function notify(message) { $('toast').textContent = message; $('toast').classList.add('show'); clearTimeout(timer); timer = setTimeout(() => $('toast').classList.remove('show'), 3500); }
function mark() { dirty = true; $('project-status').textContent = 'Unsaved changes'; }
function checkpoint() { history.push(JSON.stringify({game, selected})); if(history.length > 40) history.shift(); mark(); }
function select(id) { if(previewGame)return; selected = id; refresh(); }
function edit(key, value) { const o = current(); if(!o) return; const copy = structuredClone(game); copy.objects.find(x => x.id === o.id)[key] = value; try { validateGame(copy); } catch(e) { notify(e.message); inspector(); return; } checkpoint(); o[key] = value; refresh(); }

function geometry(o) {
  if(o.type === 'card' || o.type === 'deck' || o.shape === 'square') return new THREE.BoxGeometry(o.width, o.height, o.depth);
  const g = new THREE.CylinderGeometry(.5,.5,o.height,o.shape === 'hex'?6:32);
  g.scale(o.width,1,o.depth); return g;
}
function createLabel(text) {
  const c=document.createElement('canvas'),ctx=c.getContext('2d');
  const short=text.length>22?text.slice(0,21)+'…':text;
  ctx.font='500 24px sans-serif';c.width=Math.ceil(ctx.measureText(short).width)+20;c.height=38;
  ctx.fillStyle='rgba(32,34,38,.86)';ctx.fillRect(0,0,c.width,c.height);
  ctx.font='500 24px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4f4f4';ctx.fillText(short,c.width/2,19);
  const texture=new THREE.CanvasTexture(c),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,sizeAttenuation:false}));
  sprite.userData.labelAspect=c.width/c.height;return sprite;
}
function sizeLabels(){
 if(!world||!renderer)return;
 const height=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*18/Math.max(1,renderer.domElement.clientHeight);
 world.traverse(o=>{if(o.userData.labelAspect)o.scale.set(height*o.userData.labelAspect,height,1);});
}

function faceText(o){
 const lines=o.text.split('\n');
 if(!o.text||o.text.length>40||lines.length>3)return null;
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
 const rgb=[1,3,5].map(i=>parseInt(o.color.slice(i,i+2),16));ctx.fillStyle=(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)>145?'#18212b':'#ffffff';
 ctx.textAlign='center';ctx.textBaseline='middle';
 lines.forEach((line,i)=>{ctx.font=`600 ${line.length<=3?220:78}px sans-serif`;ctx.fillText(line,256,lines.length===1?256:(i===0?205:405),450);});
 const face=new THREE.Mesh(new THREE.PlaneGeometry(o.width*.85,o.depth*.85),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,side:THREE.DoubleSide}));
 face.rotation.x=-Math.PI/2;face.position.y=o.height+.015;return face;
}
function baseY(o,doc=game) { if(o.type !== 'piece') return 0; return Math.max(0,...doc.objects.filter(s => s.type === 'space' && Math.abs(s.x-o.x)<s.width/2 && Math.abs(s.z-o.z)<s.depth/2).map(s=>s.height))+.02; }
function rebuild() {
  if(!world) return;
  while(world.children.length) { const o = world.children[0]; o.traverse(c=>{c.geometry?.dispose(); if(c.material){c.material.map?.dispose(); c.material.dispose();}}); world.remove(o); }
  targets.length = 0;
  const doc=previewGame||game;
  for(const o of doc.objects) {
    if(o.type === 'card' && o.deckId && !o.drawn) continue;
    const g = new THREE.Group(); g.position.set(o.x,baseY(o,doc),o.z); g.rotation.y = THREE.MathUtils.degToRad(o.rotation); world.add(g);
    const parts=o.parts||[];
    if(parts.length){
      for(const p of parts){
        const body=new THREE.Mesh(partGeometry(p),new THREE.MeshStandardMaterial({color:p.color,roughness:p.roughness,metalness:p.metalness}));
        body.position.set(p.x,p.y,p.z);body.rotation.set(...[p.rx,p.ry,p.rz].map(THREE.MathUtils.degToRad));body.userData.id=o.id;g.add(body);targets.push(body);
        if(o.id===selected){const lines=new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry),new THREE.LineBasicMaterial({color:'#e99a46'}));body.add(lines);}
      }
    }else{
      const material=new THREE.MeshStandardMaterial({color:o.color,roughness:.72,metalness:.02});
      const body=new THREE.Mesh(geometry(o),material);body.position.y=o.height/2;body.userData.id=o.id;g.add(body);targets.push(body);
      if(o.type==='piece'&&o.shape==='circle'){const cap=new THREE.Mesh(new THREE.SphereGeometry(o.width*.36,16,12),material.clone());cap.position.y=o.height+.05;cap.userData.id=o.id;g.add(cap);targets.push(cap);}
      if(o.id===selected){const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry(o)),new THREE.LineBasicMaterial({color:'#e99a46'}));edges.position.y=o.height/2+.01;g.add(edges);}
    }
    const face=o.type==='space'&&!parts.length?faceText(o):null;if(face)g.add(face);
    const text = o.type === 'deck' ? o.name+' · '+deckCards(doc,o.id).filter(c=>!c.drawn).length : o.name;
    if(!face||o.id===selected){const label=createLabel(text);label.position.y=o.height+.55;g.add(label);}
  }
}
function init3D() {
  try {
    scene = new THREE.Scene(); scene.fog = new THREE.Fog('#303030',30,100);
    camera = new THREE.PerspectiveCamera(38,1,.1,200); camera.position.set(12,15,17);
    renderer = new THREE.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; $('scene').append(renderer.domElement);
    controls = new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.maxPolarAngle=Math.PI/2.1; controls.minDistance=3;controls.maxDistance=120;
    scene.add(new THREE.HemisphereLight('#ffffff','#555555',2.7)); const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(5,14,8);scene.add(light);
    const grid = new THREE.GridHelper(60,60,'#555555','#3d3d3d'); grid.position.y=-.04;scene.add(grid);world=new THREE.Group();scene.add(world);
    observer=new ResizeObserver(()=>{const r=$('scene').getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}});observer.observe($('scene'));
    let down;
    renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
    renderer.domElement.addEventListener('pointerup',e=>{
      if(previewGame)return;
      if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
      const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
      const hit=ray.intersectObjects(targets)[0], obj=current();
      if(mode==='play' && obj?.type==='piece' && (!hit || game.objects.find(o=>o.id===hit.object.userData.id)?.type==='space')) {
        const point=new THREE.Vector3();if(ray.ray.intersectPlane(floorPlane,point)){checkpoint();obj.x=Math.max(-30,Math.min(30,Math.round(point.x*4)/4));obj.z=Math.max(-30,Math.min(30,Math.round(point.z*4)/4));refresh();}return;
      }
      select(hit?hit.object.userData.id:null);
    });
    renderer.setAnimationLoop(()=>{if(mode!=='print'){controls.update();sizeLabels();renderer.render(scene,camera);}});
  } catch(e) { $('scene-error').hidden=false; console.error(e); }
}
function fit(top=false) {
  if(!camera)return;
  const objects=(previewGame||game).objects.filter(o=>!o.deckId||o.drawn);let x=0,z=0,size=8;
  if(objects.length){const minX=Math.min(...objects.map(o=>o.x-o.width)),maxX=Math.max(...objects.map(o=>o.x+o.width)),minZ=Math.min(...objects.map(o=>o.z-o.depth)),maxZ=Math.max(...objects.map(o=>o.z+o.depth));x=(minX+maxX)/2;z=(minZ+maxZ)/2;size=Math.max(5,maxX-minX,maxZ-minZ);}
  const distance=Math.min(95,size*1.35/Math.min(camera.aspect,1)); controls.target.set(x,0,z);camera.position.set(x+(top?0:distance*.65),distance,z+(top?.01:distance*.85));controls.update();
}
function objectList() {
  const filter=$('filter').value;
  const list=game.objects.filter(o=>filter==='all'||o.type===filter);
  $('object-count').textContent=game.objects.length;
  $('object-list').innerHTML=list.length?list.map(o=>`<button class="object-row ${o.id===selected?'active':''} ${o.deckId?'card-row':''}" data-select="${esc(o.id)}"><i style="--component-color:${o.color};background:${o.color}"></i><span>${esc(o.name)}</span><small>${o.type}</small></button>`).join(''):'<p class="empty-list">No components here yet.<br>Add something to make it yours.</p>';
  $('object-list').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));
}
function field(key,label,value,type='text',attrs='') { return `<div><label for="prop-${key}">${label}</label><input id="prop-${key}" data-field="${key}" type="${type}" value="${esc(value)}" ${attrs}></div>`; }
function inspector() {
  const o=current(), el=$('inspector');
  const openParts=new Set([...el.querySelectorAll('.part-editor[open]')].map(d=>d.dataset.partId));
  if(!o){el.innerHTML='<div class="inspector-placeholder"><div class="eyebrow">PROPERTIES</div><h2>No selection</h2><p class="muted">Select an object in the viewport or Components panel to inspect its properties.</p><div class="guidance">Transform<br>Appearance<br>Component data<br>Custom properties</div></div>';return;}
  const cards=o.type==='deck'?deckCards(game,o.id):[];
  el.innerHTML=`<div class="eyebrow">${o.type} / SELECTED</div><h2>${esc(o.name)}</h2>${mode==='play'&&o.type==='piece'?'<p class="play-move-note">Click a space or the tabletop to move this piece. You can also change its position below.</p>':''}
    ${field('name','Name',o.name,'text','maxlength="80"')}
    <div class="field-pair"><div><label for="prop-shape">Shape</label><select id="prop-shape" data-field="shape">${['hex','square','circle'].map(s=>`<option ${o.shape===s?'selected':''}>${s}</option>`).join('')}</select></div>${field('color','Color',o.color,'color')}</div>
    <div class="field-pair">${field('x','Position X',o.x,'number','min="-30" max="30" step=".25"')}${field('z','Position Y',o.z,'number','min="-30" max="30" step=".25"')}</div>
    <div class="field-triple">${field('width','Width',o.width,'number','min=".2" max="12" step=".1"')}${field('depth','Depth',o.depth,'number','min=".2" max="12" step=".1"')}${field('height','Height',o.height,'number','min=".02" max="6" step=".05"')}</div>
    ${field('rotation','Rotation °',o.rotation,'number','min="-360" max="360" step="15"')}
    <div class="actions"><button data-turn="90">Rotate left 90°</button><button data-turn="-90">Rotate right 90°</button></div>
    <label for="prop-text">${o.type==='card'?'Card text':'Description / instructions'}</label><textarea id="prop-text" data-field="text" maxlength="3000" placeholder="Write what this component does…">${esc(o.text)}</textarea>
    ${o.type==='card'?`<label for="prop-deckId">Deck</label><select id="prop-deckId" data-field="deckId"><option value="">Standalone card</option>${game.objects.filter(d=>d.type==='deck').map(d=>`<option value="${esc(d.id)}" ${d.id===o.deckId?'selected':''}>${esc(d.name)}</option>`).join('')}</select>`:''}
    ${o.type==='deck'?`<h3>CARDS / ${cards.length}</h3>${cards.map(c=>`<div class="deck-card-row"><button data-card="${esc(c.id)}">${esc(c.name)} ${c.drawn?'<small>drawn</small>':''}</button></div>`).join('')||'<p class="muted">Your deck is empty.</p>'}<button id="add-card" class="wide">＋ Add card to deck</button><div class="actions"><button id="shuffle">Shuffle / reset</button><button id="draw" class="primary">Draw card</button></div>`:''}
    <h3>3D PARTS / ${(o.parts||[]).length}</h3><p class="property-empty">Parts replace the base shape. Coordinates are relative to this component.</p>
    <div id="part-list">${(o.parts||[]).map((p,i)=>`<details class="part-editor" data-part-id="${esc(p.id)}" ${openParts.has(p.id)?'open':''}><summary>${esc(p.name)} <span>${p.kind}</span></summary><label>Name<input data-part="${i}" data-key="name" value="${esc(p.name)}" maxlength="80"></label><label>Geometry<select data-part="${i}" data-key="kind">${PRIMITIVES.map(k=>`<option ${k===p.kind?'selected':''}>${k}</option>`).join('')}</select></label><label>Color<input type="color" data-part="${i}" data-key="color" value="${p.color}"></label>${[['x','y','z'],['width','height','depth'],['rx','ry','rz'],['roughness','metalness']].map(keys=>`<div class="field-triple">${keys.map(k=>`<label>${k}<input type="number" step="${k.startsWith('r')&&k.length===2?'15':'.1'}" data-part="${i}" data-key="${k}" value="${p[k]}"></label>`).join('')}</div>`).join('')}<button data-remove-part="${i}" class="danger">Remove part</button></details>`).join('')}</div><div class="actions"><select id="part-kind" aria-label="New part geometry">${PRIMITIVES.map(k=>`<option>${k}</option>`).join('')}</select><button id="add-part">Add part</button></div>
    <h3>CUSTOM PROPERTIES</h3>${o.properties.map((p,i)=>`<div class="property-row"><input aria-label="Property ${i+1} name" data-pkey="${i}" value="${esc(p.key)}" maxlength="40" placeholder="Cost"><input aria-label="Property ${i+1} value" data-pvalue="${i}" value="${esc(p.value)}" maxlength="200" placeholder="200"><button data-premove="${i}" aria-label="Remove property ${i+1}">✕</button></div>`).join('')||'<p class="property-empty">Add cost, score, movement, resource type…<br>These are your labels, not enforced rules.</p>'}<button id="add-property" class="wide">＋ Add property</button>
    <div class="actions"><button id="duplicate">Duplicate</button><button id="delete" class="danger">Delete</button></div>`;
  el.querySelectorAll('[data-turn]').forEach(button=>{button.disabled=mode==='print';button.onclick=()=>edit('rotation',((o.rotation+Number(button.dataset.turn)+540)%360)-180);});
  el.querySelectorAll('[data-part]').forEach(input=>{input.disabled=mode!=='build';input.onchange=()=>{const next=structuredClone(o.parts||[]),key=input.dataset.key;next[+input.dataset.part][key]=input.type==='number'?Number(input.value):input.value;edit('parts',next);};});
  el.querySelectorAll('[data-remove-part]').forEach(b=>{b.disabled=mode!=='build';b.onclick=()=>{const parts=structuredClone(o.parts||[]);parts.splice(+b.dataset.removePart,1);edit('parts',parts);};});
  $('add-part').disabled=mode!=='build';$('add-part').onclick=()=>{if((o.parts||[]).length>=32)return notify('Maximum 32 parts per component.');edit('parts',[...(o.parts||[]),createPart($('part-kind').value)]);};
  el.querySelectorAll('[data-field]').forEach(input=>{input.onchange=()=>{const key=input.dataset.field;let value=input.type==='number'?Number(input.value):input.value;if(key==='deckId')value=value||null;edit(key,value);};if(mode!=='build'&&!(mode==='play'&&['x','z','rotation'].includes(input.dataset.field)))input.disabled=true;});
  if(o.type==='card'||o.type==='deck')$('prop-shape').disabled=true;
  el.querySelectorAll('[data-pkey],[data-pvalue]').forEach(input=>{input.disabled=mode!=='build';input.onchange=()=>{checkpoint();const key=input.dataset.pkey!==undefined?'key':'value';o.properties[Number(input.dataset.pkey??input.dataset.pvalue)][key]=input.value;refresh();};});
  el.querySelectorAll('[data-premove]').forEach(b=>{b.disabled=mode!=='build';b.onclick=()=>{checkpoint();o.properties.splice(+b.dataset.premove,1);refresh();};});
  $('add-property').onclick=()=>{if(o.properties.length>=30)return notify('Up to 30 properties per component.');checkpoint();o.properties.push({key:'',value:''});refresh();};
  $('duplicate').onclick=()=>{if(game.objects.length>=250)return notify('Component limit reached.');checkpoint();const copy=structuredClone(o);copy.id=crypto.randomUUID();copy.name=(copy.name+' copy').slice(0,80);copy.x=Math.min(30,copy.x+1);copy.z=Math.min(30,copy.z+1);if(copy.type==='deck')copy.name=(copy.name+' (empty)').slice(0,80);game.objects.push(copy);selected=copy.id;refresh();};
  $('delete').onclick=()=>{checkpoint();removeObject(game,o.id);selected=null;refresh();};
  ['add-property','duplicate','delete','add-card'].forEach(id=>{if($(id))$(id).disabled=mode!=='build';});
  if(o.type==='deck'){$('add-card').onclick=()=>add('card',o.id);el.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>select(b.dataset.card));$('draw').disabled=!cards.some(c=>!c.drawn);$('draw').onclick=()=>draw(o);$('shuffle').onclick=()=>{checkpoint();const shuffled=[...cards];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}shuffled.forEach((c,i)=>{c.order=i;c.drawn=false;});refresh();notify('Deck shuffled. Drawn cards returned.');};}
}
function draw(deck) {
  const card=deckCards(game,deck.id).find(c=>!c.drawn);if(!card)return;
  checkpoint();card.drawn=true;card.x=Math.min(30,deck.x+deck.width+1);card.z=deck.z;refresh();
  $('drawn-card').innerHTML=`<div class="eyebrow">${esc(deck.name)}</div><h2>${esc(card.name)}</h2><p>${esc(card.text||'This card has no text yet.')}</p>${card.properties.map(p=>`<p><strong>${esc(p.key)}</strong> ${esc(p.value)}</p>`).join('')}`;$('card-dialog').showModal();
}
function add(type,deckId=null) {
  if(game.objects.length>=250)return notify('This prototype supports up to 250 components.');
  checkpoint();const o=createObject(type,game.objects.length,deckId);o.x=Math.max(-30,Math.min(30,o.x));o.z=Math.max(-30,Math.min(30,o.z));
  if(deckId){const d=game.objects.find(d=>d.id===deckId);o.x=d.x;o.z=d.z;}
  if(type==='piece'){o.x=0;o.z=0;}game.objects.push(o);selected=o.id;refresh();
}
function applyLayout(layout) {
  if(game.objects.some(o=>o.type==='space')&&!confirm('Replace the existing board spaces? Pieces, cards, and rules will remain. You can undo this.'))return;
  const spaces=layout==='blank'?[]:layoutObjects(layout);
  if(game.objects.filter(o=>o.type!=='space').length+spaces.length>250)return notify('Remove some components before adding this layout.');
  checkpoint();game.objects=game.objects.filter(o=>o.type!=='space').concat(spaces);selected=spaces[0]?.id??null;refresh();fit();
}
function refresh() { $('game-name').value=game.name;$('empty-canvas').hidden=(previewGame||game).objects.length>0;$('undo').disabled=!history.length;objectList();inspector();rebuild();chat?.selectionChanged();if(mode==='print')printView(); }
function setMode(next) { mode=next;document.body.classList.toggle('mode-print',mode==='print');$('print-kit').hidden=mode!=='print';$('play-bar').hidden=mode!=='play';$('mode-label').textContent=mode.toUpperCase()+' / 3D CANVAS';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.querySelectorAll('[data-add],[data-layout]').forEach(b=>b.disabled=mode!=='build');$('game-name').disabled=mode!=='build';refresh(); }
function boardSvg() {
  const spaces=game.objects.filter(o=>o.type==='space');if(!spaces.length)return '<p>No board spaces yet. Add a layout or place spaces in Build.</p>';
  const minX=Math.min(...spaces.map(o=>o.x-Math.max(o.width,o.depth))),maxX=Math.max(...spaces.map(o=>o.x+Math.max(o.width,o.depth))),minZ=Math.min(...spaces.map(o=>o.z-Math.max(o.width,o.depth))),maxZ=Math.max(...spaces.map(o=>o.z+Math.max(o.width,o.depth)));
  const scale=Math.min(760/(maxX-minX),600/(maxZ-minZ));
  return `<svg viewBox="0 0 800 650" role="img" aria-label="Printable board overview">${spaces.map(o=>{const printLabel=o.text&&o.text.split('\n')[0].length<=40?o.text.split('\n')[0]:o.name;const x=400+(o.x-(minX+maxX)/2)*scale,y=325+(o.z-(minZ+maxZ)/2)*scale,w=o.width*scale,d=o.depth*scale;
    let shape;if(o.shape==='square')shape=`<rect x="${-w/2}" y="${-d/2}" width="${w}" height="${d}"/>`;else if(o.shape==='circle')shape=`<ellipse rx="${w/2}" ry="${d/2}"/>`;else shape=`<polygon points="${Array.from({length:6},(_,i)=>{const a=(i*60)*Math.PI/180;return [Math.sin(a)*w/2,Math.cos(a)*d/2].join(',');}).join(' ')}"/>`;
    return `<g transform="translate(${x},${y}) rotate(${-o.rotation})" fill="${o.color}" stroke="#263b28" stroke-width="1">${shape}<text text-anchor="middle" y="4" fill="#142118" stroke="none" font-size="${Math.max(5,Math.min(13,w/Math.max(5,printLabel.length)*1.3))}" font-family="sans-serif">${esc(printLabel)}</text></g>`;}).join('')}</svg>`;
}
function printView() {
  $('print-title').textContent=game.name;
  const pieces=game.objects.filter(o=>o.type==='piece'),cards=game.objects.filter(o=>o.type==='card');
  let pages=`<article class="kit-page"><h1>${esc(game.name)}</h1><div class="eyebrow">BOARD OVERVIEW</div>${boardSvg()}<p class="kit-note">Overview fitted to one page. Full-size tiled boards and custom 3D fabrication are not included.</p></article>`;
  for(let i=0;i<pieces.length;i+=12)pages+=`<article class="kit-page"><h1>Player pieces & counters</h1><p>1-inch cutouts · cut on dotted lines</p><div class="cutouts">${pieces.slice(i,i+12).map(o=>`<div class="piece-cut" style="--component-color:${o.color};background:${o.color}">${esc(o.name)}</div>`).join('')}</div></article>`;
  for(let i=0;i<cards.length;i+=6)pages+=`<article class="kit-page"><h1>Cards</h1><div class="print-cards">${cards.slice(i,i+6).map(o=>`<div class="print-card" style="--component-color:${o.color};background:${o.color}"><small>${esc(game.objects.find(d=>d.id===o.deckId)?.name||'Standalone card')}</small><h2>${esc(o.name)}</h2><p>${esc(o.text)}</p>${o.properties.map(p=>`<p><strong>${esc(p.key)}</strong> ${esc(p.value)}</p>`).join('')}</div>`).join('')}</div></article>`;
  pages+=`<article class="kit-page"><h1>${esc(game.name)} / Rules</h1>${Object.entries(ruleLabels).map(([key,label])=>`<h2>${label}</h2><p>${esc(game.rules[key]||'Not written yet.')}</p>`).join('')}</article>`;
  const described=game.objects.filter(o=>o.type!=='card'&&(o.text||o.properties.length));
  if(described.length)pages+=`<article class="kit-page"><h1>Component reference</h1>${described.map(o=>`<h2>${esc(o.name)}</h2><p>${esc(o.text)}</p>${o.properties.map(p=>`<p><strong>${esc(p.key)}</strong> ${esc(p.value)}</p>`).join('')}`).join('')}</article>`;
  $('print-pages').innerHTML=pages;
}

// All views operate on the same validated game document.
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
document.querySelectorAll('[data-layout]').forEach(b=>b.onclick=()=>applyLayout(b.dataset.layout));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$('filter').onchange=objectList;
$('game-name').onchange=e=>{checkpoint();game.name=e.target.value.trim()||'Untitled game';refresh();};
$('undo').onclick=()=>{if(!history.length)return;const previous=JSON.parse(history.pop());game=previous.game;selected=previous.selected;mark();refresh();};
$('new-game').onclick=()=>{if((dirty||game.objects.length)&&!confirm('Start a new game and design conversation? Save first to keep your work.'))return;chat?.reset();checkpoint();game=blankGame();selected=null;setMode('build');fit();};
$('component-toggle').onclick=()=>document.body.classList.toggle('tools-open');
$('save-game').onclick=()=>{try{const url=URL.createObjectURL(new Blob([serializeGame(game)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=(game.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)||'board-game')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;$('project-status').textContent='Download requested';}catch(e){notify(e.message);}};
$('open-game').onclick=()=>$('file-input').click();
$('file-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>1500000)throw Error('Game file is too large.');const loaded=validateGame(JSON.parse(await file.text()));if(dirty&&!confirm('Replace this workspace with the selected game? Save first to keep your current work.'))return;chat?.reset();checkpoint();game=loaded;selected=null;dirty=false;$('project-status').textContent='Opened game file';setMode('build');fit();notify('Game opened.');}catch(err){notify(err.message||'This game file could not be opened.');}finally{e.target.value='';}};
$('perspective').onclick=()=>{fit();$('perspective').classList.add('active');$('top-down').classList.remove('active');};
$('top-down').onclick=()=>{fit(true);$('top-down').classList.add('active');$('perspective').classList.remove('active');};
$('fit').onclick=()=>fit($('top-down').classList.contains('active'));
$('roll').onclick=()=>$('die').textContent=1+Math.floor(Math.random()*6);
$('print-now').onclick=()=>window.print();
$('edit-rules').onclick=()=>{$('rule-fields').innerHTML=Object.entries(ruleLabels).map(([key,label])=>`<label for="rule-${key}">${label}</label><textarea id="rule-${key}" maxlength="8000" placeholder="${key==='victory'?'How does your game end?':'Write your '+label.toLowerCase()+'…'}">${esc(game.rules[key])}</textarea>`).join('');$('rules-dialog').showModal();};
$('save-rules').onclick=()=>{checkpoint();for(const key of Object.keys(ruleLabels))game.rules[key]=$('rule-'+key).value;$('rules-dialog').close();refresh();notify('Rules saved to this workspace. Download your game to keep them.');};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('beforeprint',printView);
window.addEventListener('pagehide',()=>{renderer?.setAnimationLoop(null);observer?.disconnect();controls?.dispose();renderer?.dispose();});
init3D();refresh();
chat=installDesignChat({
 getContext:()=>({game:structuredClone(game),selectedId:selected}),
 captureView:()=>{
   if(!renderer||!scene||!camera||mode==='print')return null;
   sizeLabels();renderer.render(scene,camera);
   const source=renderer.domElement,canvas=document.createElement('canvas'),scale=Math.min(1,1400/source.width,1000/source.height);
   canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale);
   const ctx=canvas.getContext('2d');ctx.fillStyle='#303030';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
   return canvas.toDataURL('image/jpeg',.82);
 },
 onPreview:draft=>{previewGame=validateGame(draft);document.body.classList.add('previewing');setMode('build');fit();},
 onDiscard:()=>{previewGame=null;document.body.classList.remove('previewing');refresh();fit();},
 onApply:draft=>{const valid=validateGame(draft);checkpoint();game=valid;previewGame=null;selected=null;document.body.classList.remove('previewing');setMode('build');fit();notify('AI proposal applied. Undo is available.');}
});

if(document.modelContext?.registerTool)try{Promise.resolve(document.modelContext.registerTool({name:'add_game_component',description:'Add a generic editable space, piece, card or deck to the current game in Build mode.',inputSchema:{type:'object',properties:{type:{type:'string',enum:['space','piece','card','deck']}},required:['type'],additionalProperties:false},execute(input){if(!input||!['space','piece','card','deck'].includes(input.type))throw Error('Invalid component type');if(mode!=='build')throw Error('Switch to Build first');if(game.objects.length>=250)throw Error('Component limit reached');add(input.type);return structuredClone(current());}})).catch(()=>{});}catch{}
