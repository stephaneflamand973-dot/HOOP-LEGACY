export const MANDATES=Object.freeze(Object.fromEntries([
 ['self','Autogestion',0,0],['local','Conseiller local',.01,1],
 ['national','Agence nationale',.02,3],['international','Agence internationale',.03,5]
].map(([id,label,rate,margin])=>[id,Object.freeze({id,label,rate,margin})])));
export const validMandate=id=>typeof id==='string'&&Object.hasOwn(MANDATES,id);
