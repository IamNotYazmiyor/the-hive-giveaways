const SUPABASE_URL="https://adgfwvqndgwdllnjtbcc.supabase.co";
const SUPABASE_KEY="sb_publishable_ZgCi1NpFMv9KcDGdZlEfdg_0aHBMs7J";
let accessToken=sessionStorage.getItem("hive_admin_access");
let state={giveaways:[],entries:[],winners:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const msg=(text,ok=false,id="msg")=>{const e=$(id);if(e){e.className="msg "+(ok?"ok":"err");e.textContent=text||""}};
function toast(t){const e=document.createElement("div");e.className="toast-admin";e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
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
function addReqRow(value=""){const row=document.createElement("div");row.className="req-row";row.innerHTML='<input class="req-input" maxlength="200" placeholder="Example: Follow @IamNotYazmiyor on YouTube"><button type="button" class="a-btn danger remove-req">×</button>';row.querySelector(".req-input").value=value;row.querySelector(".remove-req").onclick=()=>row.remove();$("reqList").appendChild(row)}
function openEditor(g=null){
 $("modalTitle").textContent=g?"Edit giveaway":"New giveaway";$("gid").value=g?.id||"";
 $("title").value=g?.title||"";$("prize").value=g?.prize_name||"";$("slug").value=g?.slug||"";
 $("description").value=g?.description||"";$("imageUrl").value=g?.prize_image_url||"";
 $("starts").value=isoLocal(g?.starts_at||new Date());$("ends").value=isoLocal(g?.ends_at||new Date(Date.now()+7*86400000));
 $("status").value=g?.status||"draft";$("published").checked=!!g?.published;$("winnerCount").value=g?.winner_count||1;
 reqRows(Array.isArray(g?.requirements)?g.requirements:[]);msg("","","formMsg");$("modal").classList.remove("hidden");
}
function closeEditor(){$("modal").classList.add("hidden")}
function render(){
 const gs=state.giveaways||[], es=state.entries||[], ws=state.winners||[];
 $("gnum").textContent=gs.length;$("liveNum").textContent=gs.filter(g=>g.status==="live"&&g.published).length;$("enum").textContent=es.length;$("wNum").textContent=ws.length;
 const countBy={};es.forEach(e=>countBy[e.giveaway_id]=(countBy[e.giveaway_id]||0)+1);
 $("grow").innerHTML=gs.map(g=>{const locked=g.draw_locked||ws.some(w=>w.giveaway_id===g.id);return '<tr><td><b>'+esc(g.title)+'</b><br><small class="muted">'+esc(g.prize_name)+'</small></td><td><span class="pill '+esc(g.status)+'">'+esc(g.status)+'</span>'+(g.published?'':' <span class="muted">hidden</span>')+'</td><td>'+new Date(g.starts_at).toLocaleString()+'<br>→ '+new Date(g.ends_at).toLocaleString()+'</td><td>'+countBy[g.id]+'</td><td><div class="row-actions"><button class="a-btn edit" data-id="'+g.id+'">EDIT</button>'+(!locked&&g.status!=="cancelled"?'<button class="a-btn primary draw" data-id="'+g.id+'">DRAW</button>':'')+(g.status!=="cancelled"?'<button class="a-btn danger archive" data-id="'+g.id+'">ARCHIVE</button>':'')+'</div></td></tr>'}).join("")||'<tr><td colspan="5" class="empty-state">No giveaways yet. Create your first event.</td></tr>';
 $("erow").innerHTML=es.map(e=>{const g=gs.find(x=>x.id===e.giveaway_id);return '<tr><td><b>'+esc(e.minecraft_nick)+'</b></td><td>'+esc(e.contact_type)+': '+esc(e.contact_value)+'</td><td>'+esc(g?.title||e.giveaway_id)+'</td><td><span class="pill '+(e.status==="valid"?"live":"disqualified")+'">'+esc(e.status)+'</span>'+(e.disqualify_reason?'<br><small class="muted">'+esc(e.disqualify_reason)+'</small>':'')+'</td><td>'+new Date(e.created_at).toLocaleString()+'</td><td><div class="row-actions">'+(e.status==="valid"?'<button class="a-btn danger dq" data-id="'+e.id+'">DISQUALIFY</button>':'<button class="a-btn valid" data-id="'+e.id+'">RESTORE</button>')+'</div></td></tr>'}).join("")||'<tr><td colspan="6" class="empty-state">No entries yet.</td></tr>';
 const latest=ws.slice(0,12);$("winners").innerHTML=latest.map(w=>{const e=es.find(x=>x.id===w.entry_id),g=gs.find(x=>x.id===w.giveaway_id);return '<div class="winner"><b>#'+w.position+' '+esc(e?.minecraft_nick||"Unknown")+'</b><br><span class="muted">'+esc(g?.title||"Giveaway")+'</span></div>'}).join("")||'<div class="empty-state">No winners drawn yet.</div>';
}
async function load(){
 try{const d=await api("list");state={giveaways:d?.giveaways||[],entries:d?.entries||[],winners:d?.winners||[]};$("loginBox").classList.add("hidden");$("panel").classList.remove("hidden");render()}
 catch(e){if(/session|expired|authentication/i.test(e.message)){accessToken=null;sessionStorage.removeItem("hive_admin_access");$("panel").classList.add("hidden");$("loginBox").classList.remove("hidden")}msg(e.message)}
}
async function loginNow(){
 const email=$("email").value.trim(),password=$("password").value,b=$("loginBtn");if(!email||!password){msg("Enter your email and password.");return}
 b.disabled=true;b.textContent="SIGNING IN…";msg("");
 try{
  const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},body:JSON.stringify({email,password})});
  const j=await r.json();if(!r.ok)throw new Error(j.error_description||j.msg||"Invalid login credentials");
  if(!j.access_token)throw new Error("Login succeeded but no access token was returned.");
  accessToken=j.access_token;sessionStorage.setItem("hive_admin_access",accessToken);await load();toast("Admin access verified");
 }catch(e){accessToken=null;sessionStorage.removeItem("hive_admin_access");msg(e.message||"Sign in failed.")}finally{b.disabled=false;b.textContent="SIGN IN →"}
}
async function saveGiveaway(ev){
 ev.preventDefault();const id=$("gid").value;const payload={title:$("title").value.trim(),prize_name:$("prize").value.trim(),slug:$("slug").value.trim()||slugify($("title").value),description:$("description").value.trim(),prize_image_url:$("imageUrl").value.trim(),starts_at:new Date($("starts").value).toISOString(),ends_at:new Date($("ends").value).toISOString(),published:$("published").checked,status:$("status").value,winner_count:Number($("winnerCount").value||1),requirements:[...document.querySelectorAll(".req-input")].map(x=>x.value.trim()).filter(Boolean)};
 if(!payload.title||!payload.prize_name){msg("Title and prize are required.");return}
 if(new Date(payload.ends_at)<=new Date(payload.starts_at)){msg("End time must be after start time.");return}
 const button=ev.target.querySelector('button[type="submit"]');button.disabled=true;msg("Saving…",true,"formMsg");
 try{await api(id?"update":"create",id?{id,...payload}:{...payload});closeEditor();await load();toast(id?"Giveaway updated":"Giveaway created")}
 catch(e){msg(e.message,false,"formMsg")}finally{button.disabled=false}
}
async function archive(id){if(!confirm("Archive this giveaway? It will disappear from the public site."))return;try{await api("archive",{id});await load();toast("Giveaway archived")}catch(e){toast(e.message)}}
async function draw(id){const g=state.giveaways.find(x=>x.id===id);if(!g)return;const n=state.entries.filter(e=>e.giveaway_id===id&&e.status==="valid").length;if(!n)return toast("There are no valid entries.");if(!confirm('Draw '+g.winner_count+' winner(s) from '+n+' valid entries? This cannot be undone.'))return;try{const winners=await api("draw",{id});await load();toast("Winner draw completed")}catch(e){toast(e.message)}}
async function entryStatus(id,status){const reason=status==="disqualified"?(prompt("Reason for disqualification:")||"Admin action"):null;try{await api("entry_status",{id,status,reason});await load();toast(status==="valid"?"Entry restored":"Entry disqualified")}catch(e){toast(e.message)}}
document.addEventListener("DOMContentLoaded",()=>{
 $("loginBtn").onclick=loginNow;$("password").onkeydown=e=>{if(e.key==="Enter")loginNow()};
 $("logoutBtn").onclick=()=>{accessToken=null;sessionStorage.removeItem("hive_admin_access");location.reload()};
 $("newBtn").onclick=()=>openEditor();$("refreshBtn").onclick=()=>load();$("modalClose").onclick=closeEditor;$("cancelForm").onclick=closeEditor;$("addReq").onclick=()=>addReqRow();$("giveawayForm").onsubmit=saveGiveaway;
 $("title").oninput=()=>{if(!$("gid").value&&!$("slug").dataset.touched)$("slug").value=slugify($("title").value)};$("slug").oninput=()=>{$("slug").dataset.touched="1"};
 document.addEventListener("click",e=>{const id=e.target.dataset.id;if(!id)return;if(e.target.classList.contains("edit"))openEditor(state.giveaways.find(g=>g.id===id));if(e.target.classList.contains("archive"))archive(id);if(e.target.classList.contains("draw"))draw(id);if(e.target.classList.contains("dq"))entryStatus(id,"disqualified");if(e.target.classList.contains("valid"))entryStatus(id,"valid")});
 $("enBtn").onclick=()=>{localStorage.setItem("lang","en")};$("trBtn").onclick=()=>{localStorage.setItem("lang","tr")};
 if(accessToken)load();
});
