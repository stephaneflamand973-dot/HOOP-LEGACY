import {MANDATES,validMandate} from './representation-catalog.js?v=3.8.0';
const invalid=()=>{throw Error('Négociation invalide');};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function negotiationLimits({salary,years,age,gap,budget,payroll,mandate}){
 if(![salary,budget,payroll].every(n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER/100)||!Number.isInteger(years)||years<1||years>4||!Number.isFinite(age)||age<16||age>80||!Number.isFinite(gap)||Math.abs(gap)>100||!validMandate(mandate))invalid();
 const sportMargin=clamp(2+gap/2,0,10),margin=Math.min(15,sportMargin+MANDATES[mandate].margin),capacity=Math.max(salary,budget-payroll);
 return {salary,years,age,gap,budget,payroll,mandate,sportMargin,margin,capacity,maxSalary:Math.max(salary,Math.floor(Math.min(capacity,salary*(100+margin)/100))),maxYears:age<=30&&gap>=0?Math.min(4,years+1):years};
}
export function evaluateCounter(initial,current,limits,request){
 if(!request||![0,5,10,15].includes(request.raise)||!Number.isInteger(request.years)||request.years<Math.max(1,initial.years-1)||request.years>Math.min(4,initial.years+1))invalid();
 const requested=Math.floor(initial.salary*(100+request.raise)/100),salary=Math.min(requested,limits.maxSalary),years=Math.min(request.years,limits.maxYears);
 const outcome=salary===requested&&years===request.years?'accepted':salary===current.salary&&years===current.years?'refused':'compromise';
 return {salary,years,outcome,reasons:[`Marge sportive : ${limits.sportMargin} %.`,`Mandat : +${MANDATES[limits.mandate].margin} point(s).`,`Capacité salariale : ${limits.capacity} €.`,`Durée : au plus ${limits.maxYears} an(s) pour cette offre.`]};
}
