import * as THREE from "three";
import { api } from "./api.js";

export const games = [
  { id:"target", icon:"🎯", name:"Target Rush", desc:"30 Sekunden Targets treffen.", tag:"AIM", controls:"Maus / Touch" },
  { id:"collector", icon:"🪙", name:"Coin Collector", desc:"Coins in der Arena sammeln.", tag:"COLLECT", controls:"WASD / Pfeile / Touch" },
  { id:"dodge", icon:"🧱", name:"Dodge Cube", desc:"Hindernissen ausweichen.", tag:"DODGE", controls:"A/D / Pfeile / Touch" },
  { id:"reaction", icon:"⚡", name:"Reaction Test", desc:"So schnell wie möglich reagieren.", tag:"REFLEX", controls:"Tippen / Klicken" },
  { id:"runner", icon:"🚀", name:"Neon Runner", desc:"Springen und möglichst weit kommen.", tag:"RUN", controls:"Space / ↑ / Tippen" },
  { id:"memory", icon:"🧠", name:"Memory Blitz", desc:"Merke dir die Sequenz und wiederhole sie.", tag:"MEMORY", controls:"Tasten / Touch" },
  { id:"math", icon:"➗", name:"Math Rush", desc:"Löse so viele Rechenaufgaben wie möglich.", tag:"BRAIN", controls:"Tippen / Tastatur" },
  { id:"color", icon:"🎨", name:"Color Match", desc:"Tippe die richtige Farbe so schnell wie möglich.", tag:"REFLEX", controls:"Touch / Maus" },
  { id:"lane", icon:"🏎️", name:"Lane Switch", desc:"Wechsle die Spur und weiche Fahrzeugen aus.", tag:"DODGE", controls:"← / → / Touch" },
  { id:"stack", icon:"🧱", name:"Stack Master", desc:"Staple Blöcke möglichst perfekt.", tag:"SKILL", controls:"Tippen / Space" }
];

let cleanup = () => {};

export function startGame(id, stage, onFinish) {
  cleanup();
  stage.innerHTML = "";
  const scoreEl = document.querySelector("#score");
  const hint = document.querySelector("#hint");
  let ended = false;

  const finish = async (rawScore) => {
    if (ended) return;
    ended = true;
    cleanup();
    const score = Math.max(0, Math.floor(Number(rawScore) || 0));
    scoreEl.textContent = score;
    hint.textContent = "Score wird gespeichert…";
    try {
      const r = await api("/scores", {
        method: "POST",
        body: JSON.stringify({ gameId: id, score })
      });
      onFinish(r);
      hint.textContent = `Run beendet · +${r.coinsAwarded} Coins · +${r.xpAwarded} XP`;
    } catch (e) {
      hint.textContent = e.message;
    }
  };

  const game = games.find(g => g.id === id);
  if (!game) {
    hint.textContent = "Dieses Spiel existiert nicht.";
    return;
  }

  if (id === "target") return target(stage, scoreEl, hint, finish);
  if (id === "collector") return collector(stage, scoreEl, hint, finish);
  if (id === "dodge") return dodge(stage, scoreEl, hint, finish);
  if (id === "reaction") return reaction(stage, scoreEl, hint, finish);
  if (id === "runner") return runner(stage, scoreEl, hint, finish);
  if (id === "memory") return memory(stage, scoreEl, hint, finish);
  if (id === "math") return mathRush(stage, scoreEl, hint, finish);
  if (id === "color") return colorMatch(stage, scoreEl, hint, finish);
  if (id === "lane") return laneSwitch(stage, scoreEl, hint, finish);
  if (id === "stack") return stackMaster(stage, scoreEl, hint, finish);
}

function target(stage, scoreEl, hint, finish) {
  let score = 0, seconds = 30, alive = true;
  const spawn = () => {
    if (!alive) return;
    const x = document.createElement("button");
    x.className = "target";
    x.type = "button";
    x.setAttribute("aria-label", "Target treffen");
    x.style.left = `${5 + Math.random() * 88}%`;
    x.style.top = `${5 + Math.random() * 80}%`;
    x.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!alive) return;
      score += 100;
      scoreEl.textContent = score;
      x.remove();
      spawn();
    });
    stage.append(x);
  };
  spawn();
  const timer = setInterval(() => {
    seconds--;
    hint.textContent = `${seconds}s · Targets anklicken oder antippen`;
    if (seconds <= 0) {
      alive = false;
      finish(score);
    }
  }, 1000);
  cleanup = () => {
    alive = false;
    clearInterval(timer);
    stage.querySelectorAll(".target").forEach(x => x.remove());
  };
}

function movementKeys() {
  const keys = Object.create(null);
  const down = e => {
    const key = String(e.key || "").toLowerCase();
    keys[key] = true;
  };
  const up = e => {
    const key = String(e.key || "").toLowerCase();
    keys[key] = false;
  };
  addEventListener("keydown", down);
  addEventListener("keyup", up);
  return {
    keys,
    destroy() {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    }
  };
}

function swipeController(stage, callback) {
  let start = null;
  const down = e => {
    const t = e.changedTouches?.[0];
    if (t) start = { x:t.clientX, y:t.clientY };
  };
  const up = e => {
    if (!start) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.hypot(dx, dy) >= 18) {
      callback(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    }
    start = null;
  };
  stage.addEventListener("touchstart", down, { passive:true });
  stage.addEventListener("touchend", up, { passive:true });
  return () => {
    stage.removeEventListener("touchstart", down);
    stage.removeEventListener("touchend", up);
  };
}

function collector(stage, scoreEl, hint, finish) {
  let score = 0, seconds = 30, x = 50, y = 50, alive = true;
  const p = document.createElement("div");
  p.className = "player";
  stage.append(p);

  const movement = movementKeys();
  const removeSwipe = swipeController(stage, dir => {
    if (dir === "left") x -= 7;
    if (dir === "right") x += 7;
    if (dir === "up") y -= 7;
    if (dir === "down") y += 7;
  });

  function spawn() {
    if (!alive) return;
    const c = document.createElement("div");
    c.className = "coin";
    c.textContent = "C";
    c.style.left = `${5 + Math.random() * 90}%`;
    c.style.top = `${5 + Math.random() * 85}%`;
    c.dataset.x = parseFloat(c.style.left);
    c.dataset.y = parseFloat(c.style.top);
    stage.append(c);
  }
  for (let i=0; i<8; i++) spawn();
  const sp = setInterval(spawn, 900);

  const loop = setInterval(() => {
    const k = movement.keys;
    if (k.w || k.arrowup) y -= 1.7;
    if (k.s || k.arrowdown) y += 1.7;
    if (k.a || k.arrowleft) x -= 1.7;
    if (k.d || k.arrowright) x += 1.7;
    x = Math.max(3, Math.min(94, x));
    y = Math.max(3, Math.min(91, y));
    p.style.left = `${x}%`;
    p.style.top = `${y}%`;
    stage.querySelectorAll(".coin").forEach(c => {
      if (Math.abs(Number(c.dataset.x) - x) < 4 && Math.abs(Number(c.dataset.y) - y) < 5) {
        score += 100;
        c.remove();
        scoreEl.textContent = score;
      }
    });
  }, 40);

  const timer = setInterval(() => {
    seconds--;
    hint.textContent = `${seconds}s · WASD / Pfeile · auf Mobile wischen oder Buttons nutzen`;
    if (seconds <= 0) finish(score);
  }, 1000);

  cleanup = () => {
    alive = false;
    clearInterval(sp); clearInterval(loop); clearInterval(timer);
    movement.destroy(); removeSwipe;
    removeSwipe();
    stage.innerHTML = "";
  };
}

function dodge(stage, scoreEl, hint, finish) {
  let score = 0, seconds = 30, x = 50, alive = true;
  const p = document.createElement("div");
  p.className = "player";
  stage.append(p);

  const movement = movementKeys();
  const removeSwipe = swipeController(stage, dir => {
    if (dir === "left") x -= 8;
    if (dir === "right") x += 8;
  });

  const moveLoop = setInterval(() => {
    const k = movement.keys;
    if (k.a || k.arrowleft) x -= 1.8;
    if (k.d || k.arrowright) x += 1.8;
    x = Math.max(4, Math.min(96, x));
    p.style.left = `${x}%`;
  }, 30);

  const obstacles = new Set();
  const sp = setInterval(() => {
    if (!alive) return;
    const o = document.createElement("div");
    o.className = "fall";
    o.style.left = `${5 + Math.random() * 90}%`;
    stage.append(o);
    obstacles.add(o);
    let y = -45;
    const fall = setInterval(() => {
      if (!alive || !o.isConnected) {
        clearInterval(fall);
        obstacles.delete(o);
        return;
      }
      y += 4.2;
      o.style.top = `${y}px`;
      if (y > stage.clientHeight + 50) {
        o.remove();
        obstacles.delete(o);
        clearInterval(fall);
        score += 100;
        scoreEl.textContent = score;
        return;
      }
      const a = p.getBoundingClientRect(), b = o.getBoundingClientRect();
      if (!(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)) {
        clearInterval(fall);
        alive = false;
        finish(score);
      }
    }, 25);
  }, 650);

  const timer = setInterval(() => {
    seconds--;
    hint.textContent = `${seconds}s · Links/Rechts ausweichen`;
    if (seconds <= 0) finish(score);
  }, 1000);

  cleanup = () => {
    alive = false;
    clearInterval(sp); clearInterval(moveLoop); clearInterval(timer);
    movement.destroy(); removeSwipe();
    obstacles.forEach(o => o.remove());
    stage.innerHTML = "";
  };
}

function reaction(stage, scoreEl, hint, finish) {
  let armed = false, done = false;
  const s = document.createElement("button");
  s.type = "button";
  s.className = "reaction";
  s.innerHTML = "<b>Warte…</b><small>Nicht zu früh klicken</small>";
  stage.append(s);

  const wait = setTimeout(() => {
    armed = true;
    s.classList.add("go");
    s.innerHTML = "<b>JETZT!</b>";
    s.dataset.start = String(performance.now());
    hint.textContent = "JETZT klicken / tippen!";
  }, 1200 + Math.random() * 2500);

  const click = () => {
    if (done) return;
    done = true;
    if (!armed) {
      s.innerHTML = "<b>Zu früh!</b><small>Starte eine neue Runde.</small>";
      hint.textContent = "Zu früh geklickt.";
      setTimeout(() => finish(0), 450);
      return;
    }
    const ms = Math.round(performance.now() - Number(s.dataset.start));
    const score = Math.max(100, 5000 - ms * 5);
    scoreEl.textContent = score;
    finish(score);
  };
  s.addEventListener("pointerdown", click);

  cleanup = () => {
    clearTimeout(wait);
    s.removeEventListener("pointerdown", click);
    s.remove();
  };
}

function runner(stage, scoreEl, hint, finish) {
  // Simple, deterministic endless runner: DOM-only, no dependency on stage height.
  // This avoids the previous collision/bottom-position issues on mobile and desktop.
  let alive = true;
  let score = 0;
  let speed = 0.55;
  let playerY = 0;
  let velocity = 0;
  let grounded = true;
  let spawnMs = 1250;
  let lastTime = performance.now();
  let spawnClock = 0;
  const obstacles = [];

  stage.classList.add("runnerStage");

  const player = document.createElement("div");
  player.className = "runner";
  player.setAttribute("aria-label", "Spieler");
  stage.append(player);

  const ground = document.createElement("div");
  ground.className = "floor";
  stage.append(ground);

  const jump = (e) => {
    if (e) e.preventDefault?.();
    if (alive && grounded) {
      grounded = false;
      velocity = 0.85;
    }
  };

  const keydown = (e) => {
    const k = String(e.key || "").toLowerCase();
    if (k === " " || k === "arrowup" || k === "w") jump(e);
  };
  addEventListener("keydown", keydown);

  // Tap anywhere in the game area to jump.
  stage.addEventListener("pointerdown", jump);

  const createObstacle = () => {
    const el = document.createElement("div");
    el.className = "obstacle";
    el.setAttribute("aria-hidden", "true");
    stage.append(el);
    obstacles.push({ el, x: 102 });
  };

  const hit = (a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const pad = 5;
    return !(
      ar.right - pad < br.left ||
      ar.left + pad > br.right ||
      ar.bottom - pad < br.top ||
      ar.top + pad > br.bottom
    );
  };

  const frame = (now) => {
    if (!alive) return;

    const dt = Math.min(40, now - lastTime);
    lastTime = now;
    spawnClock += dt;

    // Gradually increase difficulty.
    speed = Math.min(1.15, speed + dt * 0.000006);
    spawnMs = Math.max(650, 1250 - score * 0.35);

    if (spawnClock >= spawnMs) {
      spawnClock = 0;
      createObstacle();
    }

    // Physics. Values are in CSS pixels per millisecond-ish and kept small
    // enough to behave consistently at 60/120Hz.
    velocity -= 0.0030 * dt;
    playerY += velocity * dt;
    if (playerY <= 0) {
      playerY = 0;
      velocity = 0;
      grounded = true;
    }
    player.style.transform = `translateY(${-playerY}px)`;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed * dt * 0.10;
      o.el.style.left = `${o.x}%`;

      if (hit(player, o.el)) {
        alive = false;
        finish(score);
        return;
      }

      if (o.x < -15) {
        o.el.remove();
        obstacles.splice(i, 1);
        score += 100;
        scoreEl.textContent = score;
      }
    }

    hint.textContent = `Score ${score} · SPACE / ↑ / W / Tippen zum Springen`;
    requestAnimationFrame(frame);
  };

  const raf = requestAnimationFrame(frame);

  cleanup = () => {
    alive = false;
    cancelAnimationFrame(raf);
    removeEventListener("keydown", keydown);
    stage.removeEventListener("pointerdown", jump);
    obstacles.forEach(o => o.el.remove());
    stage.classList.remove("runnerStage");
    stage.innerHTML = "";
  };
}


function buttonGrid(stage, count=4) {
  const grid=document.createElement("div");
  grid.className="miniGrid";
  for(let i=0;i<count;i++){
    const b=document.createElement("button");
    b.type="button"; b.className="miniBtn"; b.dataset.index=String(i);
    grid.append(b);
  }
  stage.append(grid);
  return grid;
}

function memory(stage, scoreEl, hint, finish) {
  let alive=true, round=0, input=0, sequence=[], timeout=null;
  const grid=buttonGrid(stage,4);
  const colors=["A","B","C","D"];
  const nextRound=()=>{
    if(!alive)return;
    round++;
    input=0;
    sequence.push(Math.floor(Math.random()*4));
    hint.textContent=`Runde ${round} · Merke dir die Sequenz`;
    const show=async()=>{
      for(let i=0;i<sequence.length;i++){
        if(!alive)return;
        const b=grid.children[sequence[i]];
        b.classList.add("flash");
        await new Promise(r=>timeout=setTimeout(r,260));
        b.classList.remove("flash");
        await new Promise(r=>timeout=setTimeout(r,120));
      }
      if(alive) hint.textContent="Jetzt wiederholen!";
    };
    show();
  };
  const click=e=>{
    if(!alive || e.currentTarget.classList.contains("flash"))return;
    const idx=Number(e.currentTarget.dataset.index);
    if(idx!==sequence[input]){
      finish((round-1)*250);
      return;
    }
    input++;
    scoreEl.textContent=String(round*250);
    if(input===sequence.length) setTimeout(nextRound,300);
  };
  [...grid.children].forEach((b,i)=>{b.textContent=colors[i];b.addEventListener("pointerdown",click)});
  nextRound();
  cleanup=()=>{alive=false;clearTimeout(timeout);[...grid.children].forEach(b=>b.replaceWith(b.cloneNode(true)));stage.innerHTML=""};
}

function mathRush(stage, scoreEl, hint, finish) {
  let alive=true, score=0, left=15, current=null;
  const question=document.createElement("div"); question.className="question";
  const answers=buttonGrid(stage,4); stage.prepend(question);
  const make=()=>{
    const a=5+Math.floor(Math.random()*16), b=2+Math.floor(Math.random()*12);
    const op=Math.random()>.5?"+":"-";
    current=op==="+"?a+b:a-b;
    question.textContent=`${a} ${op} ${b} = ?`;
    const vals=new Set([current]);
    while(vals.size<4) vals.add(current+Math.floor(Math.random()*15)-7);
    [...answers.children].forEach((x,i)=>{x.textContent=String([...vals][i])});
  };
  const click=e=>{
    if(!alive)return;
    if(Number(e.currentTarget.textContent)===current){score+=100;scoreEl.textContent=String(score);make()}
    else {score=Math.max(0,score-50);scoreEl.textContent=String(score)}
  };
  [...answers.children].forEach(b=>b.addEventListener("pointerdown",click));
  const timer=setInterval(()=>{left--;hint.textContent=`${left}s · richtige Antwort wählen`;if(left<=0)finish(score)},1000);
  make();
  cleanup=()=>{alive=false;clearInterval(timer);stage.innerHTML=""};
}

function colorMatch(stage, scoreEl, hint, finish) {
  let alive=true, score=0, rounds=0, started=performance.now(), target="";
  const box=document.createElement("div");box.className="colorGame";stage.append(box);
  const palette=[
    ["ROT","red"],["BLAU","blue"],["GRÜN","green"],["GELB","gold"]
  ];
  const make=()=>{
    rounds++;
    if(rounds>20){finish(score);return}
    target=palette[Math.floor(Math.random()*palette.length)][0];
    box.innerHTML=`<h2>${target}</h2><div class="colorChoices"></div>`;
    const choices=box.querySelector(".colorChoices");
    palette.forEach(([name,css])=>{
      const b=document.createElement("button");b.type="button";b.className="colorChoice";b.textContent=name;b.style.background=css;b.style.color=css==="gold"?"#111":"white";
      b.addEventListener("pointerdown",()=>{
        if(!alive)return;
        const elapsed=performance.now()-started; const gain=name===target?Math.max(50,500-Math.floor(elapsed/4)):0;
        if(name===target){score+=gain;scoreEl.textContent=String(score);started=performance.now();make()}else hint.textContent="Falsch – weiter!";
      });
      choices.append(b);
    });
    hint.textContent="Tippe die angezeigte Farbe";
  };
  make();
  cleanup=()=>{alive=false;stage.innerHTML=""};
}

function laneSwitch(stage, scoreEl, hint, finish) {
  let alive=true, score=0, lane=1, speed=.22, last=performance.now(), spawn=0;
  const board=document.createElement("div");board.className="laneBoard";stage.append(board);
  const player=document.createElement("div");player.className="lanePlayer";board.append(player);
  const obstacles=[];
  const setLane=n=>{lane=Math.max(0,Math.min(2,n));player.style.left=`${lane*33.333+16.666}%`};
  setLane(1);
  const move=e=>{const k=String(e.key||"").toLowerCase();if(k==="arrowleft"||k==="a")setLane(lane-1);if(k==="arrowright"||k==="d")setLane(lane+1)};
  addEventListener("keydown",move);
  const sw=swipeController(stage,d=>{if(d==="left")setLane(lane-1);if(d==="right")setLane(lane+1)});
  const add=()=>{const o=document.createElement("div");o.className="laneObstacle";const l=Math.floor(Math.random()*3);o.dataset.lane=String(l);o.style.left=`${l*33.333+16.666}%`;o.style.top="-12%";board.append(o);obstacles.push({el:o,y:-12,lane:l})};
  const raf=(now)=>{
    if(!alive)return;
    const dt=Math.min(40,now-last);last=now;spawn+=dt;
    if(spawn>Math.max(500,1050-score/500)){spawn=0;add()}
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];o.y+=speed*dt;o.el.style.top=`${o.y}%`;
      if(o.y>105){o.el.remove();obstacles.splice(i,1);score+=100;scoreEl.textContent=String(score);continue}
      const a=player.getBoundingClientRect(),b=o.el.getBoundingClientRect();
      if(o.lane===lane && !(a.right<b.left||a.left>b.right||a.bottom<b.top||a.top>b.bottom)){finish(score);return}
    }
    speed=Math.min(.48,speed+dt*.000002);hint.textContent=`Score ${score} · Spur wechseln`;
    requestAnimationFrame(raf);
  };
  const id=requestAnimationFrame(raf);
  cleanup=()=>{alive=false;cancelAnimationFrame(id);removeEventListener("keydown",move);sw();obstacles.forEach(o=>o.el.remove());stage.innerHTML=""};
}

function stackMaster(stage, scoreEl, hint, finish) {
  let alive=true, score=0, x=0, dir=1, width=46, level=0, placed=[];
  const board=document.createElement("div");board.className="stackBoard";stage.append(board);
  const base=document.createElement("div");base.className="stackBlock";base.style.width=width+"%";base.style.left=(50-width/2)+"%";base.style.bottom="8%";board.append(base);placed.push({left:50-width/2,width});
  let current=document.createElement("div");current.className="stackBlock moving";board.append(current);
  const drop=()=>{
    if(!alive)return;
    const center=x+50;
    const left=center-width/2;
    const prev=placed[placed.length-1];
    const overlap=Math.max(0,Math.min(left+width,prev.left+prev.width)-Math.max(left,prev.left));
    if(overlap<8){finish(score);return}
    width=overlap;
    level++;score+=100+level*10;scoreEl.textContent=String(score);
    const block=document.createElement("div");block.className="stackBlock";block.style.width=width+"%";block.style.left=(Math.max(0,Math.min(100-width,Math.max(left,prev.left))))+"%";block.style.bottom=(8+level*7)+"%";board.append(block);
    placed.push({left:parseFloat(block.style.left),width});
    current.remove();current=document.createElement("div");current.className="stackBlock moving";board.append(current);
    x=0;dir=1;
    if(level>=10)finish(score);
  };
  const key=e=>{if(e.key===" "||e.key==="Enter"||e.type==="pointerdown"){e.preventDefault();drop()}};
  addEventListener("keydown",key);stage.addEventListener("pointerdown",key);
  let raf=0,last=performance.now();
  const loop=now=>{const dt=now-last;last=now;x+=dir*dt*.045;if(x>50-width/2||x<-(50-width/2)){dir*=-1;x+=dir*dt*.045}current.style.width=width+"%";current.style.left=`calc(50% + ${x-width/2}%)`;current.style.bottom=`${8+(level+1)*7}%`;hint.textContent=`Level ${level+1} · Tippen / Space zum Stapeln`;raf=requestAnimationFrame(loop)};
  raf=requestAnimationFrame(loop);
  cleanup=()=>{alive=false;cancelAnimationFrame(raf);removeEventListener("keydown",key);stage.removeEventListener("pointerdown",key);stage.innerHTML=""};
}

export function init3D() {
  const el = document.querySelector("#bg3d");
  if (!el) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 100);
  camera.position.z = 8;
  const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  el.append(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);
  const geo = new THREE.IcosahedronGeometry(.8, 1);
  for (let i=0; i<30; i++) {
    const m = new THREE.MeshBasicMaterial({ wireframe:Math.random()>.5, transparent:true, opacity:.15 });
    const x = new THREE.Mesh(geo, m);
    x.position.set((Math.random()-.5)*22, (Math.random()-.5)*14, (Math.random()-.5)*10);
    x.scale.setScalar(.15 + Math.random());
    group.add(x);
  }
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    group.rotation.y += .0008;
    group.children.forEach(x => {
      x.rotation.x += .002;
      x.rotation.z += .001;
    });
    renderer.render(scene, camera);
  };
  loop();
  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  };
  addEventListener("resize", resize);
}
