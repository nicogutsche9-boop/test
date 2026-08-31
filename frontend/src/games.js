import * as THREE from "three";
import { api } from "./api.js";

export const games = [
  { id:"target", icon:"🎯", name:"Target Rush", desc:"30 Sekunden Targets treffen.", tag:"AIM", controls:"Maus / Touch" },
  { id:"collector", icon:"🪙", name:"Coin Collector", desc:"Coins in der Arena sammeln.", tag:"COLLECT", controls:"WASD / Pfeile / Touch" },
  { id:"dodge", icon:"🧱", name:"Dodge Cube", desc:"Hindernissen ausweichen.", tag:"DODGE", controls:"A/D / Pfeile / Touch" },
  { id:"reaction", icon:"⚡", name:"Reaction Test", desc:"So schnell wie möglich reagieren.", tag:"REFLEX", controls:"Tippen / Klicken" },
  { id:"runner", icon:"🚀", name:"Neon Runner", desc:"Springen und möglichst weit kommen.", tag:"RUN", controls:"Space / ↑ / Tippen" }
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
