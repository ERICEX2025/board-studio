// Compare validated documents by stable IDs, so review describes actual edits.
export function compareGames(before,after){
 const previous=new Map(before.objects.map(o=>[o.id,o])),next=new Map(after.objects.map(o=>[o.id,o]));
 const added=[],removed=[],changed=[];
 for(const o of after.objects){const old=previous.get(o.id);if(!old)added.push(o.name);else if(JSON.stringify(old)!==JSON.stringify(o))changed.push(o.name);}
 for(const o of before.objects)if(!next.has(o.id))removed.push(o.name);
 const rules=Object.keys(after.rules).filter(key=>before.rules[key]!==after.rules[key]);
 return {added,removed,changed,rules,runtime:JSON.stringify(before.runtime??null)!==JSON.stringify(after.runtime??null),renamed:before.name!==after.name};
}
