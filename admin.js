const URL="https://adgfwvqndgwdllnjtbcc.supabase.co",KEY="sb_publishable_ZgCi1NpFMv9KcDGdZlEfdg_0aHBMs7J";
const sb=window.supabase.createClient(URL,KEY);let G=[],E=[],W=[];
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":">","\"":"&quot;","'":"&#39;"}[c]));
function fmt(x){return new Date(x).toLocaleString()}
async function check(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){$("loginView").hidden=false;$("appView").hidden=true;return false}
  const {data:a,error}=await sb.from("admins").select("user_id,display_name").eq("user_id",session.user.id).maybeSingle();
  if(error||!a){
    $("loginView").hidden=true;$("appView").hidden=false;$("bootstrap").hidden=false;
    $("bootstrap").innerHTML=`<b>Admin authorization is not active.</b><br>Your Auth user exists, but it is not in <code>public.admins</code>. Add your user UUID <code>${esc(session.user.id)}</code> in Supabase SQL Editor, then refresh.`;
    return false;
  }
  const {data:aal}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal?.currentLevel!=="aal2"){
    $("loginView").hidden=true;$("appView").hidden=false;$("bootstrap").hidden=false;
    $("bootstrap").innerHTML=`<b>Two-factor authentication is required.</b><br>This admin panel stays locked until this account reaches AAL2 with a verified authenticator app.<br><button class="smallbtn primary" id="mfaBtn" style="margin-top:12px">SET UP / VERIFY 2FA</button><div id="mfaBox"></div>`;
    $("mfaBtn").onclick=startMFA;
    return false;
  }
  $("loginView").hidden=true;$("appView").hidden=false;$("bootstrap").hidden=true;return true;
}
async function startMFA(){
  const box=$("mfaBox");box.innerHTML=`<p class="muted">Checking authenticator…</p>`;
  const factors=await sb.auth.mfa.listFactors();
  const active=[...(factors.data?.totp||[])].find(x=>x.status==="verified");
  if(active){
    const ch=await sb.auth.mfa.challenge({factorId:active.id});
    box.innerHTML=`<div class="field"><label>Authenticator code</label><input id="mfaCode" inputmode="numeric" maxlength="6"></div><button class="smallbtn primary" id="verifyMfa">VERIFY</button><p id="mfaMsg" class="danger"></p>`;
    $("verifyMfa").onclick=async()=>{const v=await sb.auth.mfa.verify({factorId:active.id,challengeId:ch.data.id,code:$("mfaCode").value.trim()});if(v.error){$("mfaMsg").textContent=v.error.message}else{await sb.auth.refreshSession();load()}};
    return;
  }
  const e=await sb.auth.mfa.enroll({factorType:"totp",friendlyName:"Yazmiyor Admin"});
  if(e.error){box.innerHTML=`<p class="danger">${esc(e.error.message)}</p>`;return}
  box.innerHTML=`<p class="muted">Scan this QR with Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP app.</p><img style="width:220px;background:white;padding:10px" src="${esc(e.data.totp.qr_code)}"><div class="field"><label>6-digit code</label><input id="mfaCode" inputmode="numeric" maxlength="6"></div><button class="smallbtn primary" id="verifyMfa">ENABLE 2FA</button><p id="mfaMsg" class="danger"></p>`;
  $("verifyMfa").onclick=async()=>{const ch=await sb.auth.mfa.challenge({factorId:e.data.id});const v=await sb.auth.mfa.verify({factorId:e.data.id,challengeId:ch.data.id,code:$("mfaCode").value.trim()});if(v.error){$("mfaMsg").textContent=v.error.message}else{await sb.auth.refreshSession();load()}};
}
async function load(){
  if(!(await check())) return;
  const [g,e,w]=await Promise.all([
    sb.from("giveaways").select("*").order("created_at",{ascending:false}),
    sb.from("entries").select("*").order("created_at",{ascending:false}),
    sb.from("winners").select("*").order("position")
  ]);
  if(g.error||e.error||w.error){ alert("Could not load admin data."); return; }
  G=g.data||[]; E=e.data||[]; W=w.data||[];
  $("gCount").textContent=G.length; $("eCount").textContent=E.length;
  $("giveawayRows").innerHTML=G.map(x=>{
    const n=E.filter(e=>e.giveaway_id===x.id).length;
    return `<tr><td><b>${esc(x.title)}</b><br><span class="muted">${esc(x.prize_name)}</span></td>
      <td>${esc(x.status)}</td><td>${fmt(x.ends_at)}</td><td>${n}</td><td>
      ${x.status==="live"?`<button class="smallbtn" onclick="endG('${x.id}')">End</button>`:""}
      ${x.status==="ended"&&!x.draw_locked?`<button class="smallbtn primary" onclick="draw('${x.id}')">Draw</button>`:""}
      ${x.draw_locked?'<span class="muted">Draw locked</span>':""}</td></tr>`;
  }).join("");
  $("entryRows").innerHTML=E.map(x=>{
    const g=G.find(y=>y.id===x.giveaway_id);
    return `<tr><td><b>${esc(x.minecraft_nick)}</b></td><td>${esc(x.contact_type)}<br>${esc(x.contact_value)}</td>
      <td>${esc(g?.title||"—")}</td><td class="${x.status==="disqualified"?"danger":""}">${esc(x.status)}
      ${x.disqualify_reason?`<br><span class="muted">${esc(x.disqualify_reason)}</span>`:""}</td>
      <td>${fmt(x.created_at)}</td><td>${x.status==="valid"?`<button class="smallbtn" onclick="dq('${x.id}')">Disqualify</button>`:""}</td></tr>`;
  }).join("");
}
window.endG=async id=>{if(!confirm("End this giveaway now?"))return;const {error}=await sb.from("giveaways").update({status:"ended"}).eq("id",id);if(error)alert(error.message);else load()}
window.dq=async id=>{const reason=prompt("Reason for disqualification:");if(!reason)return;const {error}=await sb.from("entries").update({status:"disqualified",disqualify_reason:reason.slice(0,500)}).eq("id",id);if(error)alert(error.message);else load()}
window.draw=async id=>{if(!confirm("Run the draw? This will lock the giveaway."))return;const g=G.find(x=>x.id===id);if(!g)return;const {data:lock,error:le}=await sb.from("giveaways").update({draw_locked:true,drawn_at:new Date().toISOString()}).eq("id",id).eq("draw_locked",false).select("id,winner_count").maybeSingle();if(le||!lock){alert("Draw is already locked or could not be locked.");return}let pool=E.filter(x=>x.giveaway_id===id&&x.status==="valid");for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}let picked=pool.slice(0,Math.min(g.winner_count,pool.length));if(!picked.length){await sb.from("giveaways").update({draw_locked:false}).eq("id",id);alert("No valid entries.");return}const {error}=await sb.from("winners").insert(picked.map((x,i)=>({giveaway_id:id,entry_id:x.id,position:i+1})));if(error){await sb.from("giveaways").update({draw_locked:false}).eq("id",id);alert(error.message);return}alert("Winners: "+picked.map((x,i)=>`${i+1}. ${x.minecraft_nick}`).join("\\n"));load()}
$("login").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});$("loginMsg").textContent=error?error.message:"";if(!error)load()}
$("logout").onclick=()=>sb.auth.signOut().then(()=>location.reload());$("refresh").onclick=load;
$("newBtn").onclick=()=>{$("modal").classList.remove("hidden");$("mcontent").innerHTML=`<form class="form" id="newForm"><div class="eyebrow">NEW EVENT</div><h2>Create giveaway</h2><div class="admin-grid"><div class="field"><label>Title</label><input id="nt" required maxlength="120"></div><div class="field"><label>Prize</label><input id="np" required maxlength="200"></div></div><div class="field"><label>Description</label><input id="nd" maxlength="4000"></div><div class="admin-grid"><div class="field"><label>Starts</label><input id="ns" type="datetime-local"></div><div class="field"><label>Ends</label><input id="ne" type="datetime-local" required></div></div><div class="field"><label>Prize image URL (optional)</label><input id="ni" placeholder="https://..."></div><div class="field"><label>Requirements — one per line</label><textarea id="nr" rows="5" style="width:100%;padding:13px;background:#0b0f12;border:1px solid var(--line);color:var(--text)"></textarea></div><div class="admin-grid"><div class="field"><label>Winner count</label><input id="nw" type="number" min="1" max="100" value="1"></div><div class="field"><label>Publish immediately</label><select id="npu"><option value="true">Yes — Live</option><option value="false">No — Draft</option></select></div></div><button class="submit">CREATE GIVEAWAY →</button></form>`;$("newForm").onsubmit=async e=>{e.preventDefault();const p={title:$("nt").value,prize_name:$("np").value,description:$("nd").value,starts_at:$("ns").value?new Date($("ns").value).toISOString():new Date().toISOString(),ends_at:new Date($("ne").value).toISOString(),prize_image_url:$("ni").value||null,requirements:$("nr").value.split("\\n").map(x=>x.trim()).filter(Boolean),winner_count:Number($("nw").value),published:$("npu").value==="true"};const {error}=await sb.from("giveaways").insert({slug:crypto.randomUUID().slice(0,8),...p,status:p.published?"live":"draft"});if(error)alert(error.message);else{$("modal").classList.add("hidden");load()}}};
$("mclose").onclick=()=>$("modal").classList.add("hidden");$("modal").onclick=e=>{if(e.target.id==="modal")$("modal").classList.add("hidden")};check();
