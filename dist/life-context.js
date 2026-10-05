import {hero,team,clamp} from './engine.js?v=3.7.0';
import {canChange} from './commands.js?v=3.7.0';
const names=['Camille','Alex','Charlie','Sasha','Lou','Noa','Robin','Alix','Jules','Morgan','Eden','Léa'];
function identity(s,id,role){let h=0;for(const c of `${hero(s).name}:${id}`)h=(h*31+c.charCodeAt(0))>>>0;return {id,name:names[h%names.length]+' '+['Laurent','Joseph','Baptiste','Moreau','Diallo'][Math.floor(h/13)%5],role};}
export function initContext(s){const l=s.life;l.people??={agent:identity(s,'agent','Agent'),mentor:identity(s,'mentor','Mentor'),close:identity(s,'close','Proche')};
 if(l.partner){l.partner.id??='partner-1';if(!l.partner.name||l.partner.name==='Votre partenaire')l.partner.name=identity(s,l.partner.id,'Partenaire').name;}
 for(const [i,c] of l.children.entries()){c.id??='child-'+(i+1);c.name??=identity(s,c.id,'Enfant').name;}
 l.policies??={routine:l.delegated?'family':'manual',media:l.delegated?'team':'manual',agent:l.delegated?'local':'manual'};l.delegationLog??=[];l.stories??=[];l.storySeen??=[];l.preferences??={exposure:'local',familyAfter:0,meetingAfter:0};
 l.observed??={team:s.team,injury:hero(s).injury>0,titles:s.careerLedger?.titles.filter(t=>t.eligible).length||0};
}
export function newPerson(s,id,role){return identity(s,id,role);}
export function setPolicy(s,domain,value){if(!canChange(s))return false;initContext(s);const allowed={routine:['manual','family','rest','work'],media:['manual','team','rest','ambition'],agent:['manual','local','rest'],exposure:['local','national','none']};if(!allowed[domain]?.includes(value))return false;if(domain==='exposure')s.life.preferences.exposure=value;else s.life.policies[domain]=value;return true;}
export function delegateChoice(s,e){if(e.major)return null;const domain=e.kind==='media'?'media':e.kind==='sponsor'?'agent':'routine';let choice=s.life.policies[domain];if(choice==='manual')return null;if(!e.choices.some(c=>c[0]===choice))choice=e.default||'rest';return e.choices.some(c=>c[0]===choice)?{domain,choice}:null;}
export function observeLife(s){initContext(s);const l=s.life,o=l.observed,p=hero(s),titles=s.careerLedger?.titles.filter(t=>t.eligible).length||0;
 function add(id,kind,text,major=false){if(l.storySeen.includes(id))return;l.storySeen.push(id);l.stories.push({id,kind,text,major,step:0,due:s.day+3,status:'active'});}
 if(o.team!==s.team){add(`move-${s.day}-${s.team}`,'move',`${team(s).name} devient votre club. ${l.partner?.name||l.people.close.name} vous propose de préparer cette nouvelle étape.`,true);o.team=s.team;}
 if(p.injury>=14&&!o.injury)add(`injury-${s.day}`,'injury',`${p.injury} jours de blessure : ${l.people.mentor.name} et vos proches proposent de vous accompagner.`);
 o.injury=p.injury>0;
 if(titles>o.titles)add(`title-${titles}`,'title',`Votre nouveau titre mérite un moment avec ${l.partner?.name||l.people.close.name}.`);
 o.titles=titles;
}
export function contextEvent(s){const l=s.life,story=l.stories.find(x=>x.status==='active'&&x.due<=s.day);if(!story)return null;
 const follow=story.step>0;return {type:'life',kind:follow?'followup':story.kind,storyId:story.id,major:!follow&&story.major,title:follow?'Votre choix a une suite':{move:'Une nouvelle ville, un projet commun',injury:'Traverser la blessure',title:'Partager ce titre'}[story.kind],text:follow?`${story.text} Votre choix : ${story.choice}. ${story.kind==='move'?'Vos proches prennent leurs repères.':story.kind==='injury'?'Votre entourage prend de vos nouvelles pendant la récupération.':'Vos proches gardent le souvenir de cette célébration.'}`:story.text,choices:story.kind==='move'&&!follow?[['family','Préparer cette étape en famille','Liens +6 ; le logement reste un choix séparé.'],['rest','Organiser une transition progressive','Récupération +6 ; aucun déménagement automatique.']]:[['family','Prendre du temps ensemble','Liens +6, moral +4.'],['rest','Garder du temps pour récupérer','Fatigue −6, moral +2.']],default:'family'};
}
export function rememberChoice(s,e,choice,label){const l=s.life;l.history.push({day:s.day,title:e.title,text:label,kind:e.kind,storyId:e.storyId||null});if(e.storyId){const st=l.stories.find(x=>x.id===e.storyId);if(st){if(st.step===0){st.step=1;st.choice=label;st.due=s.day+21;}else{st.status='closed';st.closed=s.day;}}}if(e.kind==='family'&&choice==='rest')l.preferences.familyAfter=s.day+365;if(e.kind==='relationship'&&choice==='rest')l.preferences.meetingAfter=s.day+180;
}
