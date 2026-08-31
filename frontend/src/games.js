import * as THREE from "three";
import {api} from "./api.js";

export const games=[
{id:"target",icon:"🎯",name:"Target Rush",desc:"30 Sekunden Targets treffen.",tag:"AIM"},
{id:"collector",icon:"🪙",name:"Coin Collector",desc:"Coins in der 3D-Arena sammeln.",tag:"COLLECT"},
{id:"dodge",icon:"🧱",name:"Dodge Cube",desc:"Hindernissen ausweichen.",tag:"DODGE"},
{id:"reaction",icon:"⚡",name:"Reaction Test",desc:"So schnell wie möglich reagieren.",tag:"REFLEX"},
{id:"runner",icon:"🚀",name:"Neon Runner",desc:"Springen und möglichst weit kommen.",tag:"RUN"}];

let cleanup=()=>{};
export function startGame(id,stage,onFinish){
 cleanup();stage.innerHTML="";
 const scoreEl=document.querySelector("#score"),hint=document.querySelector("#hint");
 const finish=async score=>{cleanup();score=Math.floor(score);scoreEl.textContent=score;hint.textContent="Score wird gespeichert…";try{const r=await api("/scores",{method:"POST",body:JSON.stringify({gameId:id,score})});onFinish(r);hint.textContent=`Run beendet · +${r.coinsAwarded} Coins · +${r.xpAwarded} XP`;}catch(e){hint.textContent=e.message}};
 if(id==="target")return target(stage,scoreEl,hint,finish);
 if(id==="collector")return collector(stage,scoreEl,hint,finish);
 if(id==="dodge")return dodge(stage,scoreEl,hint,finish);
 if(id==="reaction")return reaction(stage,scoreEl,hint,finish);
 runner(stage,scoreEl,hint,finish);
}
function target(stage,scoreEl,hint,finish){
 let score=0,t=30,alive=true;const spawn=()=>{if(!alive)return;const x=document.createElement("button");x.className="target";x.style.left=5+Math.random()*88+"%";x.style.top=5+Math.random()*80+"%";x.onclick=()=>{score+=100;scoreEl.textContent=score;x.remove();spawn()};stage.append(x)};spawn();
 const timer=setInterval(()=>{hint.textContent=`${t--}s · Targets anklicken`;if(t<0){alive=false;finish(score)}},1000);cleanup=()=>{alive=false;clearInterval(timer)}
}
function collector(stage,scoreEl,hint,finish){
 let score=0,t=30,x=50,y=50,alive=true;const p=document.createElement("div");p.className="player";stage.append(p);
 const keys={};const kd=e=>keys[e.key.toLowerCase()]=1,ku=e=>keys[e.key.toLowerCase()]=0;addEventListener("keydown",kd);addEventListener("keyup",ku);
 function spawn(){if(!alive)return;const c=document.createElement("div");c.className="coin";c.textContent="C";c.style.left=5+Math.random()*90+"%";c.style.top=5+Math.random()*85+"%";c.dataset.x=parseFloat(c.style.left);c.dataset.y=parseFloat(c.style.top);stage.append(c)}
 for(let i=0;i<8;i++)spawn();const sp=setInterval(spawn,900),loop=setInterval(()=>{if(keys.w||keys.arrowup)y-=1.5;if(keys.s||keys.arrowdown)y+=1.5;if(keys.a||keys.arrowleft)x-=1.5;if(keys.d||keys.arrowright)x+=1.5;x=Math.max(3,Math.min(94,x));y=Math.max(3,Math.min(91,y));p.style.left=x+"%";p.style.top=y+"%";stage.querySelectorAll(".coin").forEach(c=>{if(Math.abs(c.dataset.x-x)<4&&Math.abs(c.dataset.y-y)<5){score+=100;c.remove();scoreEl.textContent=score}})},40);
 const timer=setInterval(()=>{hint.textContent=`${t--}s · WASD / Pfeile`;if(t<0){alive=false;finish(score)}},1000);cleanup=()=>{alive=false;clearInterval(sp);clearInterval(loop);clearInterval(timer);removeEventListener("keydown",kd);removeEventListener("keyup",ku)}
}
function dodge(stage,scoreEl,hint,finish){
 let score=0,t=0,x=50,alive=true;const p=document.createElement("div");p.className="player";stage.append(p);const kd=e=>{if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")x-=5;if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")x+=5;x=Math.max(4,Math.min(96,x));p.style.left=x+"%"};addEventListener("keydown",kd);
 const sp=setInterval(()=>{const o=document.createElement("div");o.className="fall";o.style.left=5+Math.random()*90+"%";stage.append(o);let y=-40;const f=setInterval(()=>{if(!alive){clearInterval(f);return}y+=4;o.style.top=y+"px";if(y>stage.clientHeight){o.remove();clearInterval(f);score+=100;scoreEl.textContent=score}const a=p.getBoundingClientRect(),b=o.getBoundingClientRect();if(!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom)){alive=false;clearInterval(f);finish(score)}},25)},650);
 const timer=setInterval(()=>hint.textContent=`${t++}s · Ausweichen`,1000);cleanup=()=>{alive=false;clearInterval(sp);clearInterval(timer);removeEventListener("keydown",kd)}
}
function reaction(stage,scoreEl,hint,finish){
 let armed=false,done=false;const s=document.createElement("button");s.className="reaction";s.innerHTML="<b>Warte…</b><small>Nicht zu früh klicken</small>";stage.append(s);const wait=setTimeout(()=>{armed=true;s.classList.add("go");s.innerHTML="<b>JETZT!</b>";s.dataset.start=performance.now()},1200+Math.random()*2500);s.onclick=()=>{if(done)return;done=true;if(!armed){s.innerHTML="<b>Zu früh!</b>";return}const ms=Math.round(performance.now()-Number(s.dataset.start));const score=Math.max(100,5000-ms*5);scoreEl.textContent=score;finish(score)};cleanup=()=>clearTimeout(wait)
}
function runner(stage,scoreEl,hint,finish){
 let score=0,alive=true,jump=false,vy=0;const r=document.createElement("div");r.className="runner";stage.append(r);const floor=document.createElement("div");floor.className="floor";stage.append(floor);const kd=e=>{if((e.key===" "||e.key==="ArrowUp")&&!jump){jump=true;vy=-13}};addEventListener("keydown",kd);const obs=[];const sp=setInterval(()=>{const o=document.createElement("div");o.className="obstacle";o.style.left="100%";stage.append(o);obs.push({el:o,x:100})},1200);const loop=setInterval(()=>{vy+=.65;let b=parseFloat(getComputedStyle(r).bottom)+vy;if(b<=45){b=45;vy=0;jump=false}r.style.bottom=b+"px";obs.forEach((o,i)=>{o.x-=.8;o.el.style.left=o.x+"%";if(o.x<-10){o.el.remove();obs.splice(i,1);score+=100;scoreEl.textContent=score}const a=r.getBoundingClientRect(),c=o.el.getBoundingClientRect();if(!(a.right<c.left||a.left>c.right||a.bottom<c.top||a.top>c.bottom)){alive=false;finish(score)}})},25);const timer=setInterval(()=>hint.textContent=`Score ${score} · SPACE / ↑ springen`,1000);cleanup=()=>{alive=false;clearInterval(sp);clearInterval(loop);clearInterval(timer);removeEventListener("keydown",kd)}
}

export function init3D(){
 const el=document.querySelector("#bg3d"),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);camera.position.z=8;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);el.append(renderer.domElement);
 const group=new THREE.Group();scene.add(group);const geo=new THREE.IcosahedronGeometry(.8,1);
 for(let i=0;i<30;i++){const m=new THREE.MeshBasicMaterial({wireframe:Math.random()>.5,transparent:true,opacity:.15});const x=new THREE.Mesh(geo,m);x.position.set((Math.random()-.5)*22,(Math.random()-.5)*14,(Math.random()-.5)*10);x.scale.setScalar(.15+Math.random());group.add(x)}
 function loop(){requestAnimationFrame(loop);group.rotation.y+=.0008;group.children.forEach(x=>{x.rotation.x+=.002;x.rotation.z+=.001});renderer.render(scene,camera)}loop();addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}
