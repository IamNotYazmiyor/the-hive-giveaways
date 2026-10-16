const SUPABASE_URL="https://adgfwvqndgwdllnjtbcc.supabase.co";
const SUPABASE_KEY="sb_publishable_ZgCi1NpFMv9KcDGdZlEfdg_0aHBMs7J";
let accessToken=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function msg(t,ok=false){const e=$("msg");if(e){e.className="msg "+(ok?"ok":"err");e.textContent=t||""}}

async function callAdmin(){
  if(!accessToken) throw new Error("No authenticated session.");
  const r=await fetch(SUPABASE_URL+"/functions/v1/admin-api",{
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+accessToken},
    body:JSON.stringify({action:"list"})
  });
  const raw=await r.text(); let j={}; try{j=JSON.parse(raw)}catch{}
  if(!r.ok) throw new Error(j.error||"Admin access denied ("+r.status+")");
  return j;
}

async function loginNow(){
  const email=$("email").value.trim(),password=$("password").value,b=$("loginBtn");
  if(!email||!password){msg("Please enter your email and password.");return}
  b.disabled=true;b.textContent="SIGNING IN…";msg("");
  try{
    const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY},
      body:JSON.stringify({email,password})
    });
    const j=await r.json();
    if(!r.ok) throw new Error(j.error_description||j.msg||"Invalid login credentials");
    if(!j.access_token) throw new Error("Login succeeded but no access token was returned.");
    accessToken=j.access_token;
    sessionStorage.setItem("hive_admin_access",accessToken);
    const data=await callAdmin();
    $("loginBox").classList.add("hidden");$("panel").classList.remove("hidden");
    const giveaways=data.giveaways||[],entries=data.entries||[];
    $("gnum").textContent=giveaways.length;$("enum").textContent=entries.length;
    $("grow").innerHTML=giveaways.map(g=>{
      const n=entries.filter(e=>e.giveaway_id===g.id).length;
      return "<tr><td><b>"+esc(g.title)+"</b><br><small>"+esc(g.prize_name)+"</small></td><td>"+esc(g.status)+"</td><td>"+(g.ends_at?new Date(g.ends_at).toLocaleString():"—")+"</td><td>"+n+"</td></tr>";
    }).join("")||"<tr><td colspan='4'>No giveaways yet.</td></tr>";
    $("erow").innerHTML=entries.map(e=>"<tr><td><b>"+esc(e.minecraft_nick)+"</b></td><td>"+esc(e.contact_type)+": "+esc(e.contact_value)+"</td><td>"+esc(e.status)+"</td><td>"+(e.created_at?new Date(e.created_at).toLocaleString():"—")+"</td></tr>").join("")||"<tr><td colspan='4'>No entries yet.</td></tr>";
  }catch(e){
    accessToken=null;sessionStorage.removeItem("hive_admin_access");msg(e.message||"Sign in failed.");
  }finally{b.disabled=false;b.textContent="SIGN IN →"}
}
async function logoutNow(){accessToken=null;sessionStorage.removeItem("hive_admin_access");location.reload()}
document.addEventListener("DOMContentLoaded",()=>{
  $("loginBtn").addEventListener("click",loginNow);
  $("password").addEventListener("keydown",e=>{if(e.key==="Enter")loginNow()});
  $("logoutBtn").addEventListener("click",logoutNow);
  const saved=sessionStorage.getItem("hive_admin_access");
  if(saved){accessToken=saved;callAdmin().then(data=>{
    $("loginBox").classList.add("hidden");$("panel").classList.remove("hidden");
    const giveaways=data.giveaways||[],entries=data.entries||[];
    $("gnum").textContent=giveaways.length;$("enum").textContent=entries.length;
  }).catch(()=>{accessToken=null;sessionStorage.removeItem("hive_admin_access")})}
});