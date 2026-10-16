const SUPABASE_URL="https://adgfwvqndgwdllnjtbcc.supabase.co";
const SUPABASE_KEY="sb_publishable_ZgCi1NpFMv9KcDGdZlEfdg_0aHBMs7J";
let accessToken=sessionStorage.getItem("hive_admin_access");
let adminLang=localStorage.getItem("admin_lang")||"tr";
let state={giveaways:[],entries:[],winners:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const adminTextMap={
 "No authenticated session.":"Oturum açılmamış.",
 "Admin operation failed (":"Yönetici işlemi başarısız (",
 "Title and prize are required.":"Başlık ve ödül alanları zorunludur.",
 "End time must be after start time.":"Bitiş zamanı başlangıç zamanından sonra olmalıdır.",
 "Saving…":"Kaydediliyor…","Giveaway updated":"Çekiliş güncellendi","Giveaway created":"Çekiliş oluşturuldu",
 "Archive this giveaway? It will disappear from the public site.":"Bu çekiliş arşivlensin mi? Herkese açık siteden kaldırılacak.",
 "Giveaway archived":"Çekiliş arşivlendi","There are no valid entries.":"Geçerli katılım bulunmuyor.",
 "Draw winner(s) from ":" kişiden kazanan belirle","This cannot be undone.":"Bu işlem geri alınamaz.",
 "Winner draw completed":"Kazananlar belirlendi","Reason for disqualification:":"Elenme nedenini yazın:",
 "Entry restored":"Katılım yeniden geçerli yapıldı","Entry disqualified":"Katılım elendi",
 "Enter your email and password.":"E-posta ve şifreni gir.",
 "SIGNING IN…":"GİRİŞ YAPILIYOR…","Admin access verified":"Yönetici girişi doğrulandı",
 "Sign in failed.":"Giriş başarısız.","Login succeeded but no access token was returned.":"Giriş yapıldı ancak erişim anahtarı alınamadı.",
 "Invalid login credentials":"E-posta veya şifre hatalı.","Admin access required":"Yönetici erişimi gerekli. Supabase admins tablosundaki kullanıcı yetkisini kontrol et.","permission denied for table admins":"admins tablosuna erişim reddedildi. Yönetici kontrolünü Edge Function üzerinden yap; tabloya herkese açık izin verme.","invalid input syntax for type uuid: \"undefined\"":"Kayıt kimliği alınamadı. Sayfayı yenileyip tekrar dene.","Server error":"Sunucu hatası. Supabase Edge Function günlüklerini kontrol et.","Invalid or expired session":"Oturumun süresi dolmuş. Yeniden giriş yap."
};
function localizeAdminText(value){
 if(adminLang!=="tr"||!value)return value;
 if(adminTextMap[value])return adminTextMap[value];
 if(value.startsWith("Admin operation failed ("))return "Yönetici işlemi başarısız ("+value.slice("Admin operation failed (".length);
 if(value.startsWith("Draw "))return value.replace(/^Draw (\d+) winner\(s\) from (\d+) valid entries\? This cannot be undone\.$/,"$1 kazananı $2 geçerli katılım arasından belirlemek istiyor musun? Bu işlem geri alınamaz.");
 if(value.startsWith("Invalid login"))return "E-posta veya şifre hatalı.";
 if(value.startsWith("Email rate limit"))return "E-posta deneme sınırına ulaşıldı. Bir süre sonra tekrar dene.";
 if(value.toLowerCase().includes("permission denied for table admins"))return "Yönetici doğrulaması için veritabanı izni eksik. Güvenli yönetici kontrolü yapılandırılmalı.";
 if(value.toLowerCase().includes("invalid input syntax for type uuid"))return "Geçersiz kayıt kimliği. Sayfayı yenileyip tekrar dene.";
 if(value.includes("Edge Function returned a non-2xx status code"))return "Sunucu işlemi reddetti. Hata ayrıntısı alınamadı; Supabase günlükleri kontrol edilmeli.";
 return value;
}
const msg=(text,ok=false,id="msg")=>{const e=$(id);if(e){e.className="msg "+(ok?"ok":"err");e.textContent=localizeAdminText(text||"")}};
function toast(t){const e=document.createElement("div");e.className="toast-admin";e.textContent=localizeAdminText(t);document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
async function api(action,payload={}){
 if(!accessToken) throw new Error("No authenticated session.");
 const r=await fetch(SUPABASE_URL+"/functions/v1/admin-api",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+accessToken},body:JSON.stringify({action,...payload})});
 const raw=await r.text();let j={};try{j=JSON.parse(raw)}catch{}
 if(!r.ok) throw new Error(j.error||"Admin operation failed ("+r.status+")");
 return j.data;
}
function isoLocal(s){const d=new Date(s);if(Number.isNaN(d.getTime()))return "";const p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"T"+p(d.getHours())+":"+p(d.getMinutes())}
function slugify(s){return String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,100)}
function reqRows(items=[]){$("reqList").innerHTML="";(items.length?items:[""]).forEach(addReqRow)}
function addReqRow(value=""){const row=document.createElement("div");row.className="req-row";row.innerHTML='<input class="req-input" maxlength="200" placeholder="Example: Follow @IamNotYazmiyor on YouTube"><button type="button" class="a-btn danger remove-req" title="Remove requirement">×</button>';row.querySelector(".req-input").value=value;row.querySelector(".remove-req").onclick=()=>row.remove();$("reqList").appendChild(row)}
function openEditor(g=null){
 $("modalTitle").textContent=g?"Edit giveaway":"New giveaway";$("gid").value=g?.id||"";
 $("title").value=g?.title||"";$("prize").value=g?.prize_name||"";$("slug").value=g?.slug||"";
 $("description").value=g?.description||"";$("imageUrl").value=g?.prize_image_url||"";
 $("starts").value=isoLocal(g?.starts_at||new Date());$("ends").value=isoLocal(g?.ends_at||new Date(Date.now()+7*86400000));
 $("status").value=g?.status||"draft";$("published").checked=!!g?.published;$("winnerCount").value=g?.winner_count||1;$("category").value=g?.category||"other";$("featured").checked=!!g?.featured;
 reqRows(Array.isArray(g?.requirements)?g.requirements:[]);msg("","","formMsg");$("modal").classList.remove("hidden");refreshImagePreview();
}
function closeEditor(){$("modal").classList.add("hidden")}
function refreshImagePreview(){
 const wrap=$("imagePreviewWrap"),img=$("imagePreview"),label=$("imagePreviewLabel"),raw=$("imageUrl")?.value.trim()||"";
 if(!wrap||!img||!label)return;
 wrap.classList.add("hidden");wrap.classList.remove("image-error");img.removeAttribute("src");
 if(!raw)return;
 let u;try{u=new URL(raw);if(!["http:","https:"].includes(u.protocol))throw new Error("Invalid protocol")}catch{wrap.classList.remove("hidden");wrap.classList.add("image-error");label.textContent=adminLang==="tr"?"Geçerli bir http(s) görsel bağlantısı gir.":"Enter a valid http(s) image URL.";return}
 wrap.classList.remove("hidden");label.textContent=adminLang==="tr"?"Görsel önizlemesi yükleniyor…":"Loading image preview…";
 img.onload=()=>{wrap.classList.remove("image-error");label.textContent=adminLang==="tr"?"Ödül görseli önizlemesi":"Prize image preview"};
 img.onerror=()=>{wrap.classList.add("image-error");label.textContent=adminLang==="tr"?"Görsel yüklenemedi; bağlantıyı kontrol et.":"Image could not load; check the URL."};
 img.src=u.href;
}
function showWinnerCelebration(g,result){
 const rows=Array.isArray(result)?result:(Array.isArray(result?.winners)?result.winners:Array.isArray(result?.data?.winners)?result.data.winners:[]);
 const markup=rows.length?rows.map((w,i)=>{const entry=state.entries.find(e=>e.id===w.entry_id);const nick=w.minecraft_nick||w.nick||w.username||entry?.minecraft_nick||"Winner";const position=w.position||w.rank||i+1;return '<div class="winner-celebration-person"><strong>♛ '+esc(nick)+'</strong><span>'+(adminLang==="tr"?"Kazanan #":"Winner #")+esc(position)+'</span></div>'}).join(""):'<p>'+(adminLang==="tr"?"Kazananlar başarıyla kaydedildi. Sonuçlar herkese açık sitede yayınlanacak.":"Winners were saved successfully. Results will appear on the public site.")+'</p>';
 const overlay=document.createElement("div");overlay.className="winner-celebration";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.innerHTML='<div class="winner-celebration-card"><div class="winner-celebration-icon">🏆</div><div class="eyebrow">'+(adminLang==="tr"?"ÇEKİLİŞ SONUCU":"GIVEAWAY RESULTS")+'</div><h2>'+(adminLang==="tr"?"Kazananlar belli oldu!":"We have our winners!")+'</h2><p>'+esc(g.title)+'</p><div class="winner-celebration-list">'+markup+'</div><button type="button" class="winner-celebration-close">'+(adminLang==="tr"?"TAMAM":"DONE")+'</button></div>';
 const close=()=>overlay.remove();overlay.querySelector("button").onclick=close;overlay.addEventListener("click",e=>{if(e.target===overlay)close()});document.addEventListener("keydown",function onKey(e){if(e.key==="Escape"){close();document.removeEventListener("keydown",onKey)}});document.body.appendChild(overlay);
}
function render(){
 const gs=state.giveaways||[], es=state.entries||[], ws=state.winners||[];
 $("gnum").textContent=gs.length;$("liveNum").textContent=gs.filter(g=>g.status==="live"&&g.published).length;$("enum").textContent=es.length;$("wNum").textContent=ws.length;
 const countBy={};es.forEach(e=>countBy[e.giveaway_id]=(countBy[e.giveaway_id]||0)+1);const locale=adminLang==="tr"?"tr-TR":"en-US";
 $("grow").innerHTML=gs.map(g=>{const locked=g.draw_locked||ws.some(w=>w.giveaway_id===g.id);return '<tr><td><b>'+esc(g.title)+'</b><br><small class="muted">'+esc(g.prize_name)+'</small></td><td><span class="pill '+esc(g.status)+'">'+esc(g.status)+'</span>'+(g.published?'':' <span class="muted">hidden</span>')+'</td><td>'+new Date(g.starts_at).toLocaleString(locale)+'<br>→ '+new Date(g.ends_at).toLocaleString(locale)+'</td><td>'+(countBy[g.id]||0)+'</td><td><div class="row-actions"><button class="a-btn edit" data-id="'+g.id+'">EDIT</button>'+(!locked&&g.status!=="cancelled"?'<button class="a-btn primary draw" data-id="'+g.id+'">DRAW</button>':'')+(g.status!=="cancelled"?'<button class="a-btn danger archive" data-id="'+g.id+'">ARCHIVE</button>':'')+'</div></td></tr>'}).join("")||'<tr><td colspan="5" class="empty-state">No giveaways yet. Create your first event.</td></tr>';
 $("erow").innerHTML=es.map(e=>{const g=gs.find(x=>x.id===e.giveaway_id);return '<tr><td><b>'+esc(e.minecraft_nick)+'</b></td><td>'+esc(e.contact_type)+': '+esc(e.contact_value)+'</td><td>'+esc(g?.title||e.giveaway_id)+'</td><td><span class="pill '+(e.status==="valid"?"live":"disqualified")+'">'+esc(e.status)+'</span>'+(e.disqualify_reason?'<br><small class="muted">'+esc(e.disqualify_reason)+'</small>':'')+'</td><td>'+new Date(e.created_at).toLocaleString(locale)+'</td><td><div class="row-actions">'+(e.status==="valid"?'<button class="a-btn danger dq" data-id="'+e.id+'">DISQUALIFY</button>':'<button class="a-btn valid" data-id="'+e.id+'">RESTORE</button>')+'</div></td></tr>'}).join("")||'<tr><td colspan="6" class="empty-state">No entries yet.</td></tr>';
 const latest=ws.slice(0,12);$("winners").innerHTML=latest.map(w=>{const e=es.find(x=>x.id===w.entry_id),g=gs.find(x=>x.id===w.giveaway_id);return '<div class="winner"><b>#'+w.position+' '+esc(e?.minecraft_nick||"Unknown")+'</b><br><span class="muted">'+esc(g?.title||"Giveaway")+'</span></div>'}).join("")||'<div class="empty-state">No winners drawn yet.</div>';
 applyAdminLanguage();
}
async function load(){
 try{const d=await api("list");state={giveaways:d?.giveaways||[],entries:d?.entries||[],winners:d?.winners||[]};$("loginBox").classList.add("hidden");$("panel").classList.remove("hidden");render()}
 catch(e){if(/session|expired|authentication/i.test(e.message)){accessToken=null;sessionStorage.removeItem("hive_admin_access");$("panel").classList.add("hidden");$("loginBox").classList.remove("hidden")}msg(e.message)}
}
async function loginNow(){
 const email=$("email").value.trim(),password=$("password").value,b=$("loginBtn");if(!email||!password){msg(adminLang==="tr"?"E-posta ve şifreni gir.":"Enter your email and password.");return}
 b.disabled=true;b.textContent=adminLang==="tr"?"GİRİŞ YAPILIYOR…":"SIGNING IN…";msg("");
 try{
  const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify({email,password})});
  const j=await r.json();if(!r.ok)throw new Error(j.error_description||j.msg||"Invalid login credentials");
  if(!j.access_token)throw new Error("Login succeeded but no access token was returned.");
  accessToken=j.access_token;sessionStorage.setItem("hive_admin_access",accessToken);await load();toast(adminLang==="tr"?"Yönetici girişi doğrulandı":"Admin access verified");
 }catch(e){accessToken=null;sessionStorage.removeItem("hive_admin_access");msg(e.message||"Sign in failed.")}finally{b.disabled=false;b.textContent=adminLang==="tr"?"GİRİŞ YAP →":"SIGN IN →"}
}
async function saveGiveaway(ev){
 ev.preventDefault();const id=$("gid").value;const payload={title:$("title").value.trim(),prize_name:$("prize").value.trim(),slug:$("slug").value.trim()||slugify($("title").value),description:$("description").value.trim(),prize_image_url:$("imageUrl").value.trim(),starts_at:new Date($("starts").value).toISOString(),ends_at:new Date($("ends").value).toISOString(),published:$("published").checked,status:$("status").value,winner_count:Number($("winnerCount").value||1),category:$("category").value,featured:$("featured").checked,requirements:[...document.querySelectorAll(".req-input")].map(x=>x.value.trim()).filter(Boolean)};
 if(!payload.title||!payload.prize_name){msg("Title and prize are required.");return}
 if(new Date(payload.ends_at)<=new Date(payload.starts_at)){msg("End time must be after start time.");return}
 const button=ev.target.querySelector('button[type="submit"]');button.disabled=true;msg(adminLang==="tr"?"Kaydediliyor…":"Saving…",true,"formMsg");
 try{await api(id?"update":"create",id?{id,...payload}:{...payload});closeEditor();await load();toast(adminLang==="tr"?(id?"Çekiliş güncellendi":"Çekiliş oluşturuldu"):(id?"Giveaway updated":"Giveaway created"))}
 catch(e){msg(e.message,false,"formMsg")}finally{button.disabled=false}
}
async function archive(id){if(!confirm(adminLang==="tr"?"Bu çekiliş arşivlensin mi? Herkese açık siteden kaldırılacak.":"Archive this giveaway? It will disappear from the public site."))return;try{await api("archive",{id});await load();toast("Giveaway archived")}catch(e){toast(e.message)}}
async function draw(id){
 const g=state.giveaways.find(x=>x.id===id);if(!g)return;
 const n=state.entries.filter(e=>e.giveaway_id===id&&e.status==="valid").length;
 if(!n)return toast("There are no valid entries.");
 const confirmText=adminLang==="tr"?n+" geçerli katılım arasından "+g.winner_count+" kazanan belirlensin mi? Bu işlem geri alınamaz.":"Draw "+g.winner_count+" winner(s) from "+n+" valid entries? This cannot be undone.";
 if(!confirm(confirmText))return;
 try{const result=await api("draw",{id});await load();showWinnerCelebration(g,result);toast(adminLang==="tr"?"Kazananlar belirlendi":"Winner draw completed")}
 catch(e){toast(e.message)}
}
async function entryStatus(id,status){const reason=status==="disqualified"?(prompt(adminLang==="tr"?"Elenme nedenini yazın:":"Reason for disqualification:")||(adminLang==="tr"?"Yönetici işlemi":"Admin action")):null;try{await api("entry_status",{id,status,reason});await load();toast(status==="valid"?"Entry restored":"Entry disqualified")}catch(e){toast(e.message)}}
function applyAdminLanguage(){
 const tr=adminLang==="tr",set=(q,v)=>document.querySelectorAll(q).forEach(e=>e.textContent=v);
 const q=(id,v)=>{const e=$(id);if(e)e.textContent=v};
 q("enBtn","EN");q("trBtn","TR");q("newBtn",tr?"+ ÇEKİLİŞ OLUŞTUR":"+ NEW GIVEAWAY");q("refreshBtn",tr?"YENİLE":"REFRESH");q("logoutBtn",tr?"ÇIKIŞ YAP":"LOG OUT");q("loginBtn",tr?"GİRİŞ YAP →":"SIGN IN →");
 const x=document.querySelector("#loginBox .eyebrow");if(x)x.textContent=tr?"ÖZEL YÖNETİCİ ALANI":"PRIVATE ADMIN AREA";
 const h=document.querySelector("#loginBox h1");if(h)h.textContent=tr?"YÖNETİCİ GİRİŞİ":"ADMIN LOGIN";
 const p=document.querySelector("#loginBox .muted");if(p)p.textContent=tr?"Yetkili hesapla giriş yap.":"Sign in with an authorized account.";
 const ls=document.querySelectorAll("#loginBox .field label");if(ls[0])ls[0].textContent=tr?"E-posta":"Email";if(ls[1])ls[1].textContent=tr?"Şifre":"Password";
 const ae=document.querySelector(".admin-title .eyebrow");if(ae)ae.textContent=tr?"KONTROL MERKEZİ":"CONTROL CENTER";const ah=document.querySelector(".admin-title h1");if(ah)ah.textContent=tr?"ÇEKİLİŞ YÖNETİMİ":"GIVEAWAY ADMIN";const ap=document.querySelector(".admin-title p");if(ap)ap.textContent=tr?"Çekilişleri oluştur, katılımları yönet ve kazananları belirle.":"Create events, manage entries and draw winners.";
 const sl=document.querySelectorAll(".stat small"),sv=tr?["TOPLAM ÇEKİLİŞ","AKTİF","TOPLAM KATILIM","KAZANANLAR"]:["TOTAL GIVEAWAYS","LIVE","TOTAL ENTRIES","WINNERS"];sl.forEach((e,i)=>e.textContent=sv[i]);
 const ph=document.querySelectorAll(".panel-box h2");if(ph[0])ph[0].textContent=tr?"Çekilişler":"Giveaways";if(ph[1])ph[1].textContent=tr?"Son kazananlar":"Latest winners";if(ph[2])ph[2].textContent=tr?"Katılımlar":"Entries";
 const th=document.querySelectorAll(".admin-table thead th"),tv=tr?["Çekiliş","Durum","Zaman","Katılım","İşlemler","Nick","İletişim","Çekiliş","Durum","Oluşturuldu","İşlemler"]:["Giveaway","Status","Schedule","Entries","Actions","Nick","Contact","Giveaway","Status","Created","Actions"];th.forEach((e,i)=>{if(tv[i])e.textContent=tv[i]});
 set(".edit",tr?"DÜZENLE":"EDIT");set(".draw",tr?"KAZANAN BELİRLE":"DRAW");set(".archive",tr?"ARŞİVLE":"ARCHIVE");set(".dq",tr?"ELE":"DISQUALIFY");set(".valid",tr?"GERİ YÜKLE":"RESTORE");
 const sm={draft:tr?"taslak":"draft",live:tr?"aktif":"live",ended:tr?"bitti":"ended",cancelled:tr?"iptal":"cancelled",valid:tr?"geçerli":"valid",disqualified:tr?"elenmiş":"disqualified"};document.querySelectorAll(".pill").forEach(e=>{const k=e.textContent.trim();if(sm[k])e.textContent=sm[k]});
 document.querySelectorAll(".empty-state").forEach(e=>{if(e.closest("#winners"))e.textContent=tr?"Henüz kazanan belirlenmedi.":"No winners drawn yet.";else if(e.closest("#erow"))e.textContent=tr?"Henüz katılım yok.":"No entries yet.";else e.textContent=tr?"Henüz çekiliş yok. İlk çekilişini oluştur.":"No giveaways yet. Create your first event."});
 const nb=document.querySelector(".nav nav a");if(nb)nb.textContent=tr?"Siteyi Gör":"View site";
 document.getElementById("enBtn")?.classList.toggle("active",!tr);document.getElementById("trBtn")?.classList.toggle("active",tr);
 if($("modal")&&!$("modal").classList.contains("hidden"))applyEditorLanguage();
}
function applyEditorLanguage(){
 const tr=adminLang==="tr",m=$("modalTitle");if(m)m.textContent=$("gid").value?(tr?"Çekilişi düzenle":"Edit giveaway"):(tr?"Yeni çekiliş":"New giveaway");
 const e=document.querySelector("#modal .eyebrow");if(e)e.textContent=tr?"ÇEKİLİŞ DÜZENLEYİCİ":"GIVEAWAY EDITOR";
 const labels=document.querySelectorAll("#giveawayForm .field>label:not(.checkline)"),v=tr?["Başlık","Ödül adı","Kısa ad","Kazanan sayısı","Kategori","Öne çıkan çekiliş","Açıklama","Ödül görseli URL'si (isteğe bağlı)","Başlangıç","Bitiş","Durum","Görünürlük","Katılım şartları"]:["Title","Prize name","Slug","Winner count","Category","Featured giveaway","Description","Prize image URL (optional)","Starts","Ends","Status","Visibility","Requirements"];labels.forEach((e,i)=>{if(v[i])e.textContent=v[i]});
 const pub=document.querySelector("#published")?.parentElement;if(pub)pub.lastChild.textContent=" "+(tr?"Web sitesinde yayınla":"Publish on website");const feat=document.querySelector("#featured")?.parentElement;if(feat)feat.lastChild.textContent=" "+(tr?"Ana sayfada öne çıkar":"Highlight on the homepage");const cat=$("category");if(cat){const labels=tr?["Minecoins","Rütbeler","Kozmetikler","Diğer"]:["Minecoins","Ranks","Cosmetics","Other"];[...cat.options].forEach((o,i)=>o.textContent=labels[i]||o.textContent)}if($("addReq"))$("addReq").textContent=tr?"+ Şart ekle":"+ Add requirement";if($("cancelForm"))$("cancelForm").textContent=tr?"İPTAL":"CANCEL";const save=document.querySelector('#giveawayForm button[type="submit"]');if(save)save.textContent=tr?"ÇEKİLİŞİ KAYDET":"SAVE GIVEAWAY";document.querySelectorAll(".req-input").forEach(e=>e.placeholder=tr?"Örnek: @IamNotYazmiyor YouTube kanalını takip et":"Example: Follow @IamNotYazmiyor on YouTube");
 const st=$("status");if(st){const a=tr?["Taslak","Aktif","Bitti","İptal"]:["Draft","Live","Ended","Cancelled"];[...st.options].forEach((o,i)=>o.textContent=a[i]||o.textContent)}
}
document.addEventListener("DOMContentLoaded",()=>{
 $("loginBtn").onclick=loginNow;$("password").onkeydown=e=>{if(e.key==="Enter")loginNow()};
 $("logoutBtn").onclick=()=>{accessToken=null;sessionStorage.removeItem("hive_admin_access");location.reload()};
 $("newBtn").onclick=()=>openEditor();$("refreshBtn").onclick=()=>load();$("modalClose").onclick=closeEditor;$("cancelForm").onclick=closeEditor;$("addReq").onclick=()=>addReqRow();$("giveawayForm").onsubmit=saveGiveaway;
 $("title").oninput=()=>{if(!$("gid").value&&!$("slug").dataset.touched)$("slug").value=slugify($("title").value)};$("imageUrl").oninput=refreshImagePreview;$("slug").oninput=()=>{$("slug").dataset.touched="1"};
 document.addEventListener("click",e=>{const id=e.target.dataset.id;if(!id)return;if(e.target.classList.contains("edit"))openEditor(state.giveaways.find(g=>g.id===id));if(e.target.classList.contains("archive"))archive(id);if(e.target.classList.contains("draw"))draw(id);if(e.target.classList.contains("dq"))entryStatus(id,"disqualified");if(e.target.classList.contains("valid"))entryStatus(id,"valid")});
 $("enBtn").onclick=()=>{adminLang="en";localStorage.setItem("admin_lang","en");applyAdminLanguage();render()};$("trBtn").onclick=()=>{adminLang="tr";localStorage.setItem("admin_lang","tr");applyAdminLanguage();render()};
 applyAdminLanguage();if(accessToken)load();
});
