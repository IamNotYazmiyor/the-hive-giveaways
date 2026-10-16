const SUPABASE_URL="https://adgfwvqndgwdllnjtbcc.supabase.co";
const SUPABASE_KEY="sb_publishable_ZgCi1NpFMv9KcDGdZlEfdg_0aHBMs7J";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let lang=localStorage.getItem("lang")||"en";
const T={
 en:{
  navGiveaways:"Giveaways",navHow:"How it works",navAdmin:"Admin",
  heroText:"Community giveaways for Minecraft Bedrock players. Pick an event, enter once and follow the result.",
  heroCta:"VIEW GIVEAWAYS",heroHow:"HOW IT WORKS",heroNote:"One nickname per giveaway • Fair community draws",
  statEntries:"TOTAL ENTRIES",statLive:"LIVE GIVEAWAYS",statCompleted:"COMPLETED",
  liveTitle:"Live Giveaways",howTitle:"How it works",
  step1h:"Choose a giveaway",step1p:"Open an active event and check the prize, schedule and requirements.",
  step2h:"Enter once",step2p:"Use your exact Minecraft Bedrock nickname and one contact method.",
  step3h:"Watch the result",step3p:"When the event ends, eligible entries are drawn and the result is published.",
  finalTitle:"YOUR NEXT<br><span>DROP AWAITS.</span>",finalCta:"VIEW LIVE EVENTS"
 },
 tr:{
  navGiveaways:"Çekilişler",navHow:"Nasıl çalışır",navAdmin:"Yönetim",
  heroText:"Minecraft Bedrock oyuncuları için topluluk çekilişleri. Bir etkinlik seç, bir kez katıl ve sonucu takip et.",
  heroCta:"ÇEKİLİŞLERİ GÖR",heroHow:"NASIL ÇALIŞIR",heroNote:"Her çekilişte bir nick • Adil topluluk çekilişleri",
  statEntries:"TOPLAM KATILIM",statLive:"AKTİF ÇEKİLİŞ",statCompleted:"TAMAMLANAN",
  liveTitle:"Canlı Çekilişler",howTitle:"Nasıl çalışır",
  step1h:"Bir çekiliş seç",step1p:"Aktif etkinliği aç ve ödülü, zamanı ve katılım şartlarını kontrol et.",
  step2h:"Bir kez katıl",step2p:"Minecraft Bedrock nickini doğru yaz ve bir iletişim yöntemi bırak.",
  step3h:"Sonucu takip et",step3p:"Süre bitince geçerli katılımlar arasından kazanan belirlenir ve sonuç yayınlanır.",
  finalTitle:"SIRADAKİ<br><span>ÖDÜL SENİ BEKLİYOR.</span>",finalCta:"CANLI ETKİNLİKLER"
 }
};

function t(k){return T[lang][k]||k}
function applyLang(){
 document.querySelectorAll("[data-i18n]").forEach(e=>e.innerHTML=t(e.dataset.i18n));
 document.getElementById("enBtn").classList.toggle("active",lang==="en");
 document.getElementById("trBtn").classList.toggle("active",lang==="tr");
 document.documentElement.lang=lang;
}
document.getElementById("enBtn").onclick=()=>{lang="en";localStorage.setItem("lang",lang);applyLang();load()};
document.getElementById("trBtn").onclick=()=>{lang="tr";localStorage.setItem("lang",lang);applyLang();load()};

const deviceId=(()=>{
 let x=localStorage.getItem("yg_device");
 if(!x){x=crypto.randomUUID()+"-"+crypto.randomUUID();localStorage.setItem("yg_device",x)}
 return x
})();

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmt(d){return new Intl.DateTimeFormat(lang==="tr"?"tr-TR":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(d))}

async function loadStats(){
 const {data,error}=await sb.rpc("get_public_giveaway_stats");
 if(error||!data)return;
 document.getElementById("statEntries").textContent=Number(data.total_entries||0).toLocaleString(lang==="tr"?"tr-TR":"en-US");
 document.getElementById("statLive").textContent=Number(data.active_giveaways||0).toLocaleString(lang==="tr"?"tr-TR":"en-US");
 document.getElementById("statCompleted").textContent=Number(data.completed_giveaways||0).toLocaleString(lang==="tr"?"tr-TR":"en-US");
}

async function load(){
 const {data,error}=await sb.from("giveaways").select("*").eq("published",true).in("status",["live","ended"]).order("ends_at",{ascending:true});
 const cards=document.getElementById("cards");
 if(error){cards.innerHTML='<div class="empty">'+(lang==="tr"?"Çekilişler yüklenemedi.":"Unable to load giveaways.")+'</div>';return}
 const live=data.filter(g=>g.status==="live"&&new Date(g.ends_at)>new Date()).length;
 document.getElementById("count").textContent=lang==="tr"?live+" aktif etkinlik":live+" live event"+(live===1?"":"s");
 if(!data.length){cards.innerHTML='<div class="empty">'+(lang==="tr"?"Şu anda yayınlanmış çekiliş yok.":"No published giveaways right now.")+'</div>';return}
 cards.innerHTML=data.map(g=>{
  const req=Array.isArray(g.requirements)?g.requirements:[];
  const ended=g.status==="ended"||new Date(g.ends_at)<=new Date();
  return '<article class="card">'+
   '<div class="card-img">'+(g.prize_image_url?'<img src="'+esc(g.prize_image_url)+'" alt="'+esc(g.prize_name)+'">':'<div class="hero-code">'+esc(g.prize_name)+'</div>')+'</div>'+
   '<div class="card-body">'+
   '<span class="tag '+(ended?"ended":"")+'">'+(ended?(lang==="tr"?"BİTTİ":"ENDED"):(lang==="tr"?"AKTİF":"LIVE"))+'</span>'+
   '<h3>'+esc(g.title)+'</h3><p>'+esc(g.description)+'</p>'+
   '<div class="meta"><span>'+(lang==="tr"?"ÖDÜL":"PRIZE")+'<br><strong>'+esc(g.prize_name)+'</strong></span><span>'+(ended?(lang==="tr"?"BİTTİ":"ENDED"):(lang==="tr"?"BİTİŞ":"ENDS"))+'<br><strong>'+fmt(g.ends_at)+'</strong></span></div>'+
   (ended?"":'<button class="enter" onclick="openEntry(\''+g.id+'\')">'+(lang==="tr"?"KATIL":"ENTER")+' →</button>')+
   '</div></article>'
 }).join("");
}

window.openEntry=async id=>{
 const {data:g}=await sb.from("giveaways").select("*").eq("id",id).single();
 if(!g)return;
 const req=Array.isArray(g.requirements)?g.requirements:[];
 document.getElementById("modalContent").innerHTML=
 '<form class="form" id="entryForm">'+
 '<div class="eyebrow">'+(lang==="tr"?"ÇEKİLİŞE KATIL":"ENTER GIVEAWAY")+'</div>'+
 '<h2>'+esc(g.title)+'</h2><div class="sub">'+esc(g.description)+'</div>'+
 (req.length?'<div class="field"><label>'+(lang==="tr"?"Şartlar":"Requirements")+'</label><ul class="reqs">'+req.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div>':"")+
 '<div class="field"><label>'+(lang==="tr"?"Minecraft Nick":"Minecraft Username")+'</label><input id="nick" maxlength="32" required placeholder="Your exact in-game name"></div>'+
 '<div class="field"><label>'+(lang==="tr"?"İletişim türü":"Contact method")+'</label><select id="ctype"><option value="discord">Discord</option><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="email">Email</option><option value="other">Other</option></select></div>'+
 '<div class="field"><label>'+(lang==="tr"?"İletişim bilgisi":"Contact information")+'</label><input id="contact" maxlength="200" required placeholder="@username or link"></div>'+
 '<label class="check"><input type="checkbox" id="accept" required> <span>'+(lang==="tr"?"Çekiliş şartlarını okudum ve kabul ediyorum.":"I have read and accept the giveaway requirements.")+'</span></label>'+
 '<button class="submit">'+(lang==="tr"?"KATILIMI GÖNDER":"SUBMIT ENTRY")+' →</button></form>';
 document.getElementById("modal").classList.remove("hidden");
 document.getElementById("entryForm").onsubmit=e=>submitEntry(e,g.id)
};

async function submitEntry(e,gid){
 e.preventDefault();
 const btn=e.target.querySelector("button");
 btn.disabled=true;btn.textContent=lang==="tr"?"GÖNDERİLİYOR…":"SUBMITTING…";
 const {data,error}=await sb.functions.invoke("submit-entry",{body:{
  giveaway_id:gid,minecraft_nick:document.getElementById("nick").value,
  contact_type:document.getElementById("ctype").value,contact_value:document.getElementById("contact").value,
  device_id:deviceId,accepted_requirements:document.getElementById("accept").checked
 }});
 if(error||data?.error){
  let detail=data?.error||error?.message||"Request failed";
  try{if(error?.context?.json){const body=await error.context.json();detail=body?.error||body?.message||detail}}catch{}
  if(lang==="tr"){
   detail=({
    "This Minecraft username has already entered this giveaway":"Bu Minecraft nicki bu çekilişe daha önce katılmış.",
    "This device has already entered this giveaway":"Bu cihaz bu çekilişe daha önce katılmış.",
    "You have already entered this giveaway":"Bu çekilişe daha önce katıldın.",
    "Giveaway is not accepting entries":"Bu çekiliş şu anda katılım kabul etmiyor.",
    "Giveaway is outside its entry period":"Çekilişin katılım süresi dışında.",
    "Invalid Minecraft username":"Geçersiz Minecraft nicki.",
    "Invalid contact information":"Geçersiz iletişim bilgisi.",
    "You must accept the giveaway requirements":"Çekiliş şartlarını kabul etmelisin."
   }[detail]||detail)
  }
  document.getElementById("modalContent").insertAdjacentHTML("beforeend",'<p style="color:var(--danger);font-weight:700">'+esc(detail)+'</p>');
  btn.disabled=false;btn.textContent=lang==="tr"?"KATILIMI GÖNDER":"SUBMIT ENTRY";return
 }
 document.getElementById("modalContent").innerHTML='<div class="success"><div class="big">✓</div><h2>'+(lang==="tr"?"Katılım alındı!":"Entry received!")+'</h2><p>'+(lang==="tr"?"Çekiliş sonucunu takip etmeyi unutma.":"Keep an eye on the giveaway for the result.")+'</p></div>';
 loadStats();
}

document.getElementById("close").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")document.getElementById("modal").classList.add("hidden")};

applyLang();
load();
loadStats();