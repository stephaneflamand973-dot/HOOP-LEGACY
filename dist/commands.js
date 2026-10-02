// A single boundary for user commands; background sporting updates use their own functions.
export function canChange(s, {busy=false, pending=false, match=false}={}) {
  return !!s && !busy && !s.retired && (pending || !s.pending) && (match || !s.match);
}
export function retireCareer(s) {
  if (!canChange(s)) return false;
  s.retired=true;
  s.phase='Retraite';
  if (s.simulation) s.simulation.cursor=null;
  return true;
}
