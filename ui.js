export const $ = id => document.getElementById(id);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const storage = {
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
};
export let language = storage.get('lang') === 'tr' ? 'tr' : 'en';
export const t = (en, tr) => language === 'tr' ? tr : en;
export function translate() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-en][data-tr]').forEach(el => el.textContent = el.dataset[language]);
  document.querySelectorAll('[data-language]').forEach(el => { const active = el.dataset.language === language; el.classList.toggle('active', active); el.setAttribute('aria-pressed', String(active)); });
}
export function changeLanguage(value) {
  language = value === 'tr' ? 'tr' : 'en'; storage.set('lang', language); translate();
  document.dispatchEvent(new CustomEvent('languagechange'));
}
document.querySelectorAll('[data-language]').forEach(b => b.addEventListener('click', () => changeLanguage(b.dataset.language)));
export function number(value) { return Number(value ?? 0).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-GB'); }
export function date(value, time = false) {
  const d = new Date(value);
  return !value || !Number.isFinite(d.getTime()) ? '—' : new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-GB', {dateStyle:'medium', ...(time ? {timeStyle:'short'} : {})}).format(d);
}
const paths = {
 arrow:'M5 12h14M13 6l6 6-6 6', chevron:'m9 5 7 7-7 7', back:'M19 12H5m6-6-6 6 6 6', close:'m6 6 12 12M6 18 18 6',
 ticket:'M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm12 0v3m0 3v1m0 3v2',
 trophy:'M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8',
 users:'M16 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3m14-8a4 4 0 0 1 4 4v4M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-3a4 4 0 0 1 0 7',
 gift:'M3 8h18v4H3V8Zm2 4v9h14v-9M12 8v13m0-13H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
 clock:'M12 8v5l3 2m7-3a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 check:'m5 12 4 4L19 6', shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6',
 share:'M8 12h8m-4-4 4 4-4 4M9 5V3H3v18h6v-2M15 3h6v18h-6',
 link:'m9 15 6-6m-7 4-2 2a3.5 3.5 0 0 0 5 5l3-3m2-6 2-2a3.5 3.5 0 0 0-5-5l-3 3',
 youtube:'m10 8 6 4-6 4V8ZM3 5h18v14H3V5Z', menu:'M4 6h16M4 12h16M4 18h16',
 crown:'m3 6 5 5 4-7 4 7 5-5-2 13H5L3 6Zm2 10h14', spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
 coin:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM9 7h6v10H9V7Z',
 history:'M3 3v6h6m-6 0a9 9 0 1 1 0 6m9-8v6l4 2', search:'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 mail:'M3 5h18v14H3V5Zm0 1 9 7 9-7', lock:'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 5v2',
 edit:'m14 4 6 6M3 21l1-6L17 2l5 5L9 20l-6 1Z', plus:'M12 4v16M4 12h16', refresh:'M3 11a9 9 0 0 1 16-6l2 3M21 3v5h-5m5 5a9 9 0 0 1-16 6l-2-3m0 5v-5h5',
 download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4', calendar:'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 10h14',
 info:'M12 11v6m0-11v1m10 5a10 10 0 1 1-20 0 10 10 0 0 1 20 0', logout:'M9 3H3v18h6m5-15 6 6-6 6m-5-6h11'
};
export const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.gift}"/></svg>`;
export function paintIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon)); }
export function safeImage(value) { try { const u = new URL(value, location.href); return u.protocol === 'https:' || (u.origin === location.origin && u.protocol === 'http:') ? u.href : ''; } catch { return ''; } }
export function prizeImage(g) {
  if (g.prize_image_url && safeImage(g.prize_image_url)) return safeImage(g.prize_image_url);
  if (/season\s*5|sezon\s*5/i.test(`${g.title} ${g.prize_name}`)) return './season5-ticket.jpg';
  return '';
}
export function prizeArt(g, cls = '', eager = false) {
  const src = prizeImage(g);
  return src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(g.prize_name)}" loading="${eager?'eager':'lazy'}" decoding="async" referrerpolicy="no-referrer">` : `<div class="prize-fallback ${cls} kind-${['minecoins','ranks','cosmetics'].includes(g.category)?g.category:'other'}">${icon(({minecoins:'coin',ranks:'crown',cosmetics:'spark'})[g.category]||'gift')}<span>${esc(g.prize_name)}</span></div>`;
}
let toastTimer;
export function toast(text) { const el=$('toast'); if (!el) return; clearTimeout(toastTimer); el.textContent=text; el.classList.add('show'); toastTimer=setTimeout(()=>el.classList.remove('show'),3500); }
export function openDialog(el) { if(!el.open) el.showModal(); document.body.classList.add('dialog-open'); }
export function closeDialog(el) { el.close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open'); }
document.querySelectorAll('dialog').forEach(el=> { el.addEventListener('close',()=>document.body.classList.remove('dialog-open')); el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(el);}}); });
document.querySelector('[data-menu-toggle]')?.addEventListener('click',e=>{const button=e.currentTarget,nav=$('mainNav');const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
export function confetti(container) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer=document.createElement('div');layer.className='confetti';layer.setAttribute('aria-hidden','true');
  for(let i=0;i<16;i++){const p=document.createElement('i');p.style.setProperty('--i',i);layer.append(p);}container.append(layer);setTimeout(()=>layer.remove(),1800);
}
translate(); paintIcons();
