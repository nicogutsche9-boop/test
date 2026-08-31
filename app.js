import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const GAMES = [
  {id:"target",icon:"🎯",name:"Target Rush",tag:"AIM",desc:"Triff so viele Neon-Targets wie möglich in 30 Sekunden."},
  {id:"collector",icon:"🪙",name:"Coin Collector",tag:"COLLECT",desc:"Sammle Coins in der Arena, bevor die Zeit abläuft."},
  {id:"dodge",icon:"🧱",name:"Dodge Cube",tag:"DODGE",desc:"Weiche fallenden Blöcken aus. Je länger du lebst, desto höher der Score."},
  {id:"reaction",icon:"⚡",name:"Reaction Test",tag:"REFLEX",desc:"Warte auf das Signal und reagiere so schnell du kannst."},
  {id:"runner",icon:"🚀",name:"Neon Runner",tag:"RUN",desc:"Springe über Hindernisse und sammle Meter für Meter Punkte."}
];

const ITEMS = [
 {id:"rookie",type:"skin",name:"Neon Rookie",price:0,rarity:"common",icon:"🤖"},
 {id:"cyber",type:"skin",name:"Cyber Violet",price:450,rarity:"rare",icon:"🟣"},
 {id:"solar",type:"skin",name:"Solar Gold",price:900,rarity:"epic",icon:"🟡"},
 {id:"void",type:"skin",name:"Void Walker",price:1600,rarity:"legendary",icon:"👾"},
 {id:"halo",type:"hat",name:"Neon Halo",price:300,rarity:"rare",icon:"😇"},
 {id:"crown",type:"hat",name:"Pixel Crown",price:750,rarity:"epic",icon:"👑"},
 {id:"visor",type:"hat",name:"Holo Visor",price:500,rarity:"rare",icon:"🥽"},
 {id:"spark",type:"trail",name:"Spark Trail",price:350,rarity:"common",icon:"✨"},
 {id:"fire",type:"trail",name:"Fire Trail",price:800,rarity:"epic",icon:"🔥"},
 {id:"rainbow",type:"trail",name:"Rainbow Trail",price:1200,rarity:"legendary",icon:"🌈"},
 {id:"stars",type:"effect",name:"Star Burst",price:600,rarity:"epic",icon:"💫"},
 {id:"heart",type:"effect",name:"Heart Pop",price:250,rarity:"common",icon:"💖"}
];

const PASS = [
 ["100 Coins","🪙",0],["Spark Trail","✨",100],["150 Coins","🪙",200],["Neon Halo","😇",300],["250 Coins","🪙",400],
 ["Cyber Violet","🟣",500],["300 Coins","🪙",600],["Star Burst","💫",700],["500 Coins","🪙",800],["Void Walker","👾",900]
];

function todayKey(){return new Date().toISOString().slice(0,10)}
const defaultState = {
 coins:500,xp:0,level:1,games:0,highscores:{},owned:["rookie"],equipped:{skin:"rookie",hat:null,trail:null,effect:null},
 challengesDate:todayKey(),challenges:[],passClaimed:[]
};
let state = load();
function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem("arcadeverse-save")||"{}")}}catch{return {...defaultState}}}
function save(){localStorage.setItem("arcadeverse-save",JSON.stringify(state));renderGlobal()}
function xpForLevel(l){return 500+(l-1)*100}
function addProgress(coins,xp){
 state.coins+=coins; state.xp+=xp;
 while(state.xp>=xpForLevel(state.level)){state.xp-=xpForLevel(state.level);state.level++; toast(`🎉 Level ${state.level}! + Bonus`); state.coins+=100}
 save();
}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("toast-show");clearTimeout(window._toast);window._toast=setTimeout(()=>el.classList.remove("toast-show"),2600)}
function renderGlobal(){
 document.querySelector("#coins").textContent=state.coins.toLocaleString("de-DE");
 document.querySelector("#level").textContent=`Lv. ${state.level}`;
 document.querySelector("#xpBar").style.width=`${Math.min(100,state.xp/xpForLevel(state.level)*100)}%`;
 document.querySelector("#homeSkin").textContent=ITEMS.find(x=>x.id===state.equipped.skin)?.name||"Neon Rookie";
 document.querySelector("#homeStats").textContent=`${state.games} Spiele · ${Object.keys(state.highscores).length} Highscores`;
}
function navigate(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id)); if(id==="home")renderHome(); if(id==="games")renderGames(); if(id==="pass")renderPass(); if(id==="shop")renderShop(); if(id==="profile")renderProfile(); window.scrollTo({top:0,behavior:"smooth"})}
document.addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v){e.preventDefault();navigate(v.dataset.view)}});

function ensureChallenges(){
 if(state.challengesDate!==todayKey()||!state.challenges?.length){
  state.challengesDate=todayKey();
  const pool=[
   {id:"plays",icon:"🎮",text:"Spiele 3 Runden",goal:3,reward:150,val:0},
   {id:"score",icon:"🏆",text:"Erreiche 5.000 Punkte",goal:5000,reward:200,val:0},
   {id:"coins",icon:"🪙",text:"Verdiene 300 Coins",goal:300,reward:250,val:0},
   {id:"target",icon:"🎯",text:"Triff 25 Targets",goal:25,reward:175,val:0}
  ];
  state.challenges=pool.sort(()=>Math.random()-.5).slice(0,3);save();
 }
}
function updateChallenges(gameId,score,reward){
 ensureChallenges();
 state.challenges.forEach(c=>{
  if(c.id==="plays")c.val=Math.min(c.goal,c.val+1);
  if(c.id==="score")c.val=Math.min(c.goal,Math.max(c.val,score));
  if(c.id==="coins")c.val=Math.min(c.goal,c.val+reward);
  if(c.id==="target"&&gameId==="target")c.val=Math.min(c.goal,c.val+Math.floor(score/10));
  if(c.val>=c.goal&&!c.done){c.done=true;addProgress(c.reward,80);toast(`📅 Daily geschafft! +${c.reward} Coins`)}
 });save();
}
function challengeHTML(c){return `<div class="challenge glass"><span class="icon">${c.icon}</span><span class="reward">🪙 ${c.reward}</span><h3>${c.text}</h3><p>${c.val}/${c.goal}</p><div class="progress"><i style="width:${Math.min(100,c.val/c.goal*100)}%"></i></div></div>`}

function gameCard(g){return `<article class="game-card glass" data-game="${g.id}"><span class="tag">${g.tag}</span><div class="game-icon">${g.icon}</div><h3>${g.name}</h3><p>${g.desc}</p><button class="primary small">PLAY →</button></article>`}
function renderHome(){ensureChallenges();document.querySelector("#dailyHome").innerHTML=state.challenges.map(challengeHTML).join("");document.querySelector("#featuredGames").innerHTML=GAMES.slice(0,3).map(gameCard).join("");bindGameCards()}
function renderGames(){document.querySelector("#allGames").innerHTML=GAMES.map(gameCard).join("");bindGameCards()}
function bindGameCards(){document.querySelectorAll("[data-game]").forEach(el=>el.onclick=()=>startGame(el.dataset.game))}
function startGame(id){
 navigate("game"); currentGame=id; document.querySelector("#gameTitle").textContent=GAMES.find(g=>g.id===id).name;document.querySelector("#gameEyebrow").textContent=GAMES.find(g=>g.id===id).tag;document.querySelector("#gameHighscore").textContent=state.highscores[id]||0;document.querySelector("#gameScore").textContent="0";runGame(id)
}
let currentGame=null, cleanupGame=()=>{};
function runGame(id){cleanupGame();const stage=document.querySelector("#gameStage");stage.innerHTML="";document.querySelector("#gameReward").textContent="0";document.querySelector("#gameHint").textContent="Los geht's!";if(id==="target")gameTarget(stage);if(id==="collector")gameCollector(stage);if(id==="dodge")gameDodge(stage);if(id==="reaction")gameReaction(stage);if(id==="runner")gameRunner(stage)}
function finish(score,coins,xp){const old=state.highscores[currentGame]||0;if(score>old){state.highscores[currentGame]=score;toast("🏆 Neuer Highscore!")}state.games++;updateChallenges(currentGame,score,coins);addProgress(coins,xp);document.querySelector("#gameHighscore").textContent=state.highscores[currentGame]||0;document.querySelector("#gameReward").textContent=coins;document.querySelector("#gameHint").textContent=`Run beendet · +${coins} Coins · +${xp} XP`}

function gameTarget(stage){
 let score=0,time=30,running=true,timer;
 const spawn=()=>{if(!running)return;stage.querySelectorAll(".target").forEach(x=>x.remove());const t=document.createElement("div");t.className="target";t.style.left=(5+Math.random()*85)+"%";t.style.top=(5+Math.random()*80)+"%";t.onclick=()=>{score+=100;document.querySelector("#gameScore").textContent=score;t.remove();spawn()};stage.appendChild(t)};
 spawn();timer=setInterval(()=>{time--;document.querySelector("#gameHint").textContent=`${time}s · Klicke die Targets!`;if(time<=0){running=false;clearInterval(timer);stage.querySelectorAll(".target").forEach(x=>x.remove());finish(score,Math.max(25,Math.floor(score/80)),Math.floor(score/12))}},1000);cleanupGame=()=>{running=false;clearInterval(timer)}
}
function gameCollector(stage){
 let score=0,time=30,running=true,timer,spawnTimer;
 const player=document.createElement("div");player.className="arena-player";stage.appendChild(player);let x=50,y=50;const keys={};
 const key=e=>{keys[e.key.toLowerCase()]=true};const up=e=>{keys[e.key.toLowerCase()]=false};window.addEventListener("keydown",key);window.addEventListener("keyup",up);
 function spawn(){if(!running)return;const c=document.createElement("div");c.className="coin";c.textContent="C";c.style.left=(5+Math.random()*90)+"%";c.style.top=(5+Math.random()*85)+"%";c.dataset.x=parseFloat(c.style.left);c.dataset.y=parseFloat(c.style.top);stage.appendChild(c)}
 for(let i=0;i<8;i++)spawn();spawnTimer=setInterval(spawn,900);
 const loop=setInterval(()=>{if(keys.w||keys.arrowup)y-=1.5;if(keys.s||keys.arrowdown)y+=1.5;if(keys.a||keys.arrowleft)x-=1.5;if(keys.d||keys.arrowright)x+=1.5;x=Math.max(3,Math.min(94,x));y=Math.max(3,Math.min(91,y));player.style.left=x+"%";player.style.top=y+"%";stage.querySelectorAll(".coin").forEach(c=>{if(Math.abs(parseFloat(c.dataset.x)-x)<4&&Math.abs(parseFloat(c.dataset.y)-y)<5){score+=100;c.remove();document.querySelector("#gameScore").textContent=score}})},40);
 timer=setInterval(()=>{time--;document.querySelector("#gameHint").textContent=`${time}s · WASD / Pfeile · Coins: ${score/100}`;if(time<=0){running=false;clearInterval(timer);clearInterval(loop);clearInterval(spawnTimer);finish(score,Math.max(40,score/20),Math.floor(score/10))}},1000);
 cleanupGame=()=>{running=false;clearInterval(timer);clearInterval(loop);clearInterval(spawnTimer);window.removeEventListener("keydown",key);window.removeEventListener("keyup",up)}
}
function gameDodge(stage){
 let score=0,running=true,time=0;const p=document.createElement("div");p.className="arena-player";stage.appendChild(p);let x=50;const key=e=>{if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")x-=5;if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")x+=5;x=Math.max(4,Math.min(96,x));p.style.left=x+"%"};window.addEventListener("keydown",key);
 const spawn=setInterval(()=>{if(!running)return;const o=document.createElement("div");o.className="fall";let ox=5+Math.random()*90;o.style.left=ox+"%";o.style.top="-40px";stage.appendChild(o);let y=-40;const fall=setInterval(()=>{if(!running){clearInterval(fall);return}y+=4;o.style.top=y+"px";if(y>stage.clientHeight){clearInterval(fall);o.remove();score+=100;document.querySelector("#gameScore").textContent=score}const pr=p.getBoundingClientRect(),or=o.getBoundingClientRect();if(!(pr.right<or.left||pr.left>or.right||pr.bottom<or.top||pr.top>or.bottom)){running=false;clearInterval(fall);clearInterval(spawn);finish(score,Math.max(35,Math.floor(score/150)),Math.floor(score/18))}},25)},650);
 const timer=setInterval(()=>{time++;document.querySelector("#gameHint").textContent=`${time}s · Weiche aus!`},1000);cleanupGame=()=>{running=false;clearInterval(spawn);clearInterval(timer);window.removeEventListener("keydown",key)}
}
function gameReaction(stage){
 const s=document.createElement("div");s.className="reaction-screen";s.innerHTML="<div>Warte auf GRÜN…<br><small style='color:#9ba1bd'>Klick erst beim Signal</small></div>";stage.appendChild(s);let start=0,armed=false,done=false;const delay=1000+Math.random()*3500;const timer=setTimeout(()=>{armed=true;start=performance.now();s.classList.add("go");s.innerHTML="<div>⚡ JETZT KLICKEN!</div>"},delay);s.onclick=()=>{if(done)return;if(!armed){clearTimeout(timer);done=true;s.innerHTML="<div>Zu früh!<br><small>← Zurück zu Games und erneut versuchen</small></div>";return}done=true;const ms=Math.round(performance.now()-start),score=Math.max(100,5000-ms*5);s.innerHTML=`<div>${ms} ms<br><small>Sehr gut!</small></div>`;document.querySelector("#gameScore").textContent=score;finish(score,Math.max(50,Math.floor((1000-ms)/10)),Math.max(20,Math.floor(score/20)))};cleanupGame=()=>clearTimeout(timer)
}
function gameRunner(stage){
 let score=0,running=true,jump=false,vy=0,time=0;const r=document.createElement("div");r.className="runner";stage.appendChild(r);const floor=document.createElement("div");floor.className="runner-floor";stage.appendChild(floor);const key=e=>{if((e.key===" "||e.key==="ArrowUp"||e.key.toLowerCase()==="w")&&!jump){jump=true;vy=-13}};window.addEventListener("keydown",key);let obs=[];
 const spawn=setInterval(()=>{if(!running)return;const o=document.createElement("div");o.className="runner-obstacle";o.style.left="100%";stage.appendChild(o);obs.push({el:o,x:100});},1200);
 const loop=setInterval(()=>{if(!running)return;vy+=.65;let bottom=parseFloat(getComputedStyle(r).bottom)+vy;if(bottom<=60){bottom=60;vy=0;jump=false}r.style.bottom=bottom+"px";obs.forEach((o,i)=>{o.x-=.8;o.el.style.left=o.x+"%";if(o.x<-10){o.el.remove();obs.splice(i,1);score+=100;document.querySelector("#gameScore").textContent=score}const a=r.getBoundingClientRect(),b=o.el.getBoundingClientRect();if(!(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom)){running=false;clearInterval(loop);clearInterval(spawn);finish(score,Math.max(30,Math.floor(score/150)),Math.floor(score/15))}})},25);
 const timer=setInterval(()=>{time++;document.querySelector("#gameHint").textContent=`${time}s · SPACE / ↑ zum Springen`},1000);cleanupGame=()=>{running=false;clearInterval(loop);clearInterval(spawn);clearInterval(timer);window.removeEventListener("keydown",key)}
}

function renderPass(){
 const xpPct=state.xp/xpForLevel(state.level)*100;document.querySelector("#passBar").style.width=xpPct+"%";document.querySelector("#passProgressText").textContent=`Level ${state.level} · ${Math.floor(xpPct)}%`;
 document.querySelector("#passGrid").innerHTML=PASS.map((p,i)=>{const unlocked=state.level>=Math.ceil((i+1)*1);const claimed=state.passClaimed.includes(i);return `<div class="pass-item glass ${unlocked?"":"locked"} ${claimed?"claimed":""}"><div class="pass-level">TIER ${String(i+1).padStart(2,"0")}</div><div class="pass-reward">${p[1]}</div><div class="pass-name">${p[0]}</div>${unlocked&&!claimed?`<button class="claim" data-claim="${i}">CLAIM</button>`:claimed?`<small class="claim">✓ CLAIMED</small>`:"<small class='claim'>🔒 LOCKED</small>"}</div>`}).join("");
 document.querySelectorAll("[data-claim]").forEach(b=>b.onclick=()=>claimPass(+b.dataset.claim))
}
function claimPass(i){if(state.passClaimed.includes(i)||state.level<i+1)return;state.passClaimed.push(i);const p=PASS[i],item=ITEMS.find(x=>x.name===p[0]);if(item){state.owned.push(item.id)}else{const n=parseInt(p[0]);state.coins+=n}save();renderPass();renderShop();toast(`🎁 ${p[0]} freigeschaltet!`)}
function renderShop(filter="all"){
 const grid=document.querySelector("#shopGrid");grid.innerHTML=ITEMS.filter(i=>filter==="all"||i.type===filter).map(i=>{const owned=state.owned.includes(i.id),eq=state.equipped[i.type]===i.id;return `<div class="shop-item glass"><div class="item-art">${i.icon}</div><div class="item-info"><div class="rarity">${i.rarity}</div><h3>${i.name}</h3><small>${i.type}</small><button class="buy ${eq?"equipped":owned?"owned":""}" data-item="${i.id}">${eq?"✓ Ausgerüstet":owned?"Ausrüsten":`🪙 ${i.price.toLocaleString("de-DE")}`}</button></div></div>`}).join("");
 document.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>buyOrEquip(b.dataset.item))
}
function buyOrEquip(id){const i=ITEMS.find(x=>x.id===id);if(!state.owned.includes(id)){if(state.coins<i.price){toast("Nicht genug Coins.");return}state.coins-=i.price;state.owned.push(id);toast(`✨ ${i.name} gekauft!`)}state.equipped[i.type]=id;save();renderShop(document.querySelector(".shop-tabs .active")?.dataset.filter||"all")}
function renderProfile(){
 document.querySelector("#statCoins").textContent=state.coins.toLocaleString("de-DE");document.querySelector("#statGames").textContent=state.games;document.querySelector("#statHighscores").textContent=Object.keys(state.highscores).length;document.querySelector("#statCosmetics").textContent=state.owned.length;document.querySelector("#profileLevel").textContent=`Level ${state.level} · ${state.xp} XP`;
 const rows=GAMES.map(g=>({g,score:state.highscores[g.id]||0})).sort((a,b)=>b.score-a.score);document.querySelector("#leaderboard").innerHTML=rows.map((r,i)=>`<div class="leader-row"><b>${i+1}</b><span>${r.g.icon} ${r.g.name}</span><strong>${r.score.toLocaleString("de-DE")}</strong><small>Best Score</small></div>`).join("");
}
document.querySelectorAll(".shop-tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".shop-tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderShop(b.dataset.filter)});
document.querySelector("#resetBtn").onclick=()=>{if(confirm("Wirklich den gesamten Fortschritt löschen?")){localStorage.removeItem("arcadeverse-save");state=load();ensureChallenges();renderGlobal();renderProfile();toast("Fortschritt gelöscht.")}};
ensureChallenges();renderGlobal();renderHome();

const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,100);camera.position.z=8;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);document.querySelector("#bg3d").appendChild(renderer.domElement);
const group=new THREE.Group();scene.add(group);
const geo=new THREE.IcosahedronGeometry(.9,1);for(let i=0;i<35;i++){const m=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.72+Math.random()*.2,.8,.55),transparent:true,opacity:.15+Math.random()*.22,wireframe:Math.random()>.55});const mesh=new THREE.Mesh(geo,m);mesh.position.set((Math.random()-.5)*20,(Math.random()-.5)*12,(Math.random()-.5)*8);mesh.scale.setScalar(.15+Math.random()*.8);mesh.userData={speed:.001+Math.random()*.003};group.add(mesh)}
scene.add(new THREE.AmbientLight(0xffffff,1.3));const light=new THREE.PointLight(0x8d6cff,30,30);light.position.set(0,3,5);scene.add(light);
function animate(){requestAnimationFrame(animate);group.rotation.y+=.0008;group.children.forEach(m=>{m.rotation.x+=m.userData.speed;m.rotation.z+=m.userData.speed*.7});renderer.render(scene,camera)}animate();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
