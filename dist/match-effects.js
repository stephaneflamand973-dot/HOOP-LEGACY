const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const contextBonus=(m,p,context)=>m.bonuses[p.id]?.[context]||0;
export function shotBoost(m,p,{action,kind,catchShot=false}) {
  const primary=kind==='mid'?'pull':kind==='three'?'three':kind;
  return Math.min(.07,contextBonus(m,p,primary)+(action==='drive'?contextBonus(m,p,'drive')*.5:0)+(catchShot?contextBonus(m,p,'catch'):0));
}
export function finishKind(p,d,roll) {
  const a=p.attrs;
  const dunk=a.dunk<50?0:clamp(.08+(a.dunk-50)*.009+(a.vertical-65)*.0015+(a.ballSpeed-d.attrs.interior)*.001-Math.max(0,a.layup-a.dunk)*.002,.02,.55);
  const close=clamp(.14+(a.close-a.layup)*.002,.06,.24);
  return roll<dunk?'dunk':roll<dunk+close?'close':'layup';
}
export function reboundWeight(m,p,offensive) {
  const attr=offensive?p.attrs.offReb:p.attrs.defReb;
  return Math.max(1,(attr-20)**2)*(1+((p.height||200)-190)/120)*(1+contextBonus(m,p,offensive?'offReb':'rebound')*6);
}
export const freeChance=(m,p)=>clamp(.29+p.attrs.free*.006+contextBonus(m,p,'free'),.45,.96);
export const stealChance=(m,p)=>clamp(.58+contextBonus(m,p,'steal'),.4,.72);
export const EFFECT_TEXT={
  catch:'Augmente la réussite à trois points après réception.',three:'Augmente la réussite à trois points.',pull:'Augmente la réussite à mi-distance.',free:'Augmente la réussite des lancers francs.',layup:'Augmente la réussite des lay-ups.',dunk:'Augmente la réussite des dunks en pénétration.',post:'Augmente la réussite du jeu au poste.',close:'Augmente la réussite des tirs proches et des deuxièmes chances.',
  pass:'Réduit les pertes de balle sur les possessions servies par ce passeur.',assist:'Augmente la probabilité qu’un panier soit crédité d’une passe décisive.',handle:'Réduit les pertes de balle du porteur.',drive:'Améliore la réussite des pénétrations, à la moitié du bonus indiqué.',interior:'Réduit la réussite adverse dans la raquette.',perimeter:'Réduit la réussite adverse sur les tirs extérieurs.',steal:'Transforme plus de pertes de balle adverses en interceptions.',block:'Augmente la probabilité de contrer, à 30 % du bonus.',rebound:'Augmente le poids du joueur dans la sélection du rebond défensif et la protection du rebond collectif.',offReb:'Augmente le poids du joueur dans la sélection du rebond offensif et les chances de deuxième possession.',screen:'Améliore la qualité de l’écran et réduit la contestation du tir.',team:'Réduit la pénalité liée à la fatigue sur ses possessions.',defense:'Réduit la réussite adverse grâce au placement, à 40 % du bonus.'
};
