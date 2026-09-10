import * as THREE from './vendor/three.module.js';
export function partGeometry(p){
 let g;
 if(p.kind==='box')g=new THREE.BoxGeometry(1,1,1);
 else if(p.kind==='sphere')g=new THREE.SphereGeometry(.5,20,14);
 else if(p.kind==='cone')g=new THREE.ConeGeometry(.5,1,16);
 else if(p.kind==='cylinder')g=new THREE.CylinderGeometry(.5,.5,1,20);
 else if(p.kind==='torus'){g=new THREE.TorusGeometry(.35,.15,12,24);g.rotateX(Math.PI/2);g.scale(1,1/.3,1);}
 else throw Error('Unknown part geometry');
 g.scale(p.width,p.height,p.depth);return g;
}
