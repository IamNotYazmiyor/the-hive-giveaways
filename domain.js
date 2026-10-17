// Pure functions shared by public views and regression tests.
export function phase(g, now = Date.now()) {
  if(g.status === 'cancelled') return 'cancelled';
  if(g.status === 'draft') return 'draft';
  if(g.drawn_at && g.results_published !== false && g.winners?.length) return 'completed';
  if(g.status === 'ended' || Date.parse(g.ends_at) <= now) return 'awaiting';
  if(Date.parse(g.starts_at) > now) return 'upcoming';
  return 'live';
}
export const isPast = (g, now) => ['completed','awaiting'].includes(phase(g, now));
export const atCapacity = g => Number(g.max_total_entries)>0 && Number(g.entry_slots_used??g.entry_count)>=Number(g.max_total_entries);
export const canEnter = (g, now) => phase(g, now) === 'live' && !atCapacity(g);
export function partitionGiveaways(giveaways, now = Date.now()) {
  const live = giveaways.filter(g => ['live','upcoming'].includes(phase(g,now)));
  const featured = live.find(g => g.featured && phase(g,now)==='live') || live.find(g=>phase(g,now)==='live') || live[0];
  return {live,featured,regular:live.filter(g=>g.id!==featured?.id),past:giveaways.filter(g=>isPast(g,now)).sort((a,b)=>Date.parse(b.drawn_at||b.ends_at)-Date.parse(a.drawn_at||a.ends_at))};
}
export function winnerHistory(giveaways) {
  return giveaways.filter(g=>phase(g)==='completed').flatMap(g=>(g.winners||[]).map(w=>({...w,slug:g.slug,title:g.title,prize_name:g.prize_name,prize_image_url:g.prize_image_url,category:g.category,drawn_at:w.drawn_at||g.drawn_at}))).sort((a,b)=>Date.parse(b.drawn_at)-Date.parse(a.drawn_at));
}
export function remaining(iso, now=Date.now()) { const total=Math.max(0,Math.floor((Date.parse(iso)-now)/1000));return [Math.floor(total/86400),Math.floor(total%86400/3600),Math.floor(total%3600/60),total%60]; }
export function entryValidation({nick,contactType,contact,accepted}) {
  if(typeof nick!=='string'||nick.trim().length<3||nick.trim().length>32||/[\u0000-\u001f<>]/.test(nick))return 'nick';
  if(!['discord','email','instagram','youtube','other'].includes(contactType)||typeof contact!=='string'||contact.trim().length<2||contact.trim().length>200)return 'contact';
  if(contactType==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim()))return 'contact';
  if(!accepted)return 'accepted';
  return null;
}
export const csvCell=value=>'"'+String(/^[=+\-@\t\r\n]/.test(String(value??''))?"'"+value:value??'').replaceAll('"','""')+'"';
