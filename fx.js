/* fx.js - visual effects layer. Pure JS, zero dependencies.
 *
 * Loaded before app.js. Everything here is progressive enhancement:
 *   aurora    WebGL shader behind the page (skipped on weak devices)
 *   patch     simulated ViT attention heat-map in the hero (labelled "simulated")
 *   pipeline  data packets flowing through the pipeline strip
 *   tilt      pointer-driven 3D card tilt
 *   magnet    magnetic buttons
 *   terminal  history, tab completion, simulated top / nvidia-smi
 *
 * Performance tiers:
 *   - weak device (coarse pointer, narrow screen, <=2 GB RAM, <=2 cores) starts "low"
 *   - otherwise frame times are sampled for the first seconds; slow -> drops to "low"
 *   - prefers-reduced-motion disables animation entirely
 * Debug: append ?fx=high or ?fx=low to the URL to force a tier.
 */
(() => {
  "use strict";

  const html = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const forced = new URLSearchParams(location.search).get("fx");
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const nav = navigator;
  const weak =
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 720 ||
    (nav.deviceMemory && nav.deviceMemory <= 2) ||
    (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);

  /* ---------- shared state + scheduler ---------- */
  const lowCallbacks = [];
  const FX = {
    reduced,
    low: forced === "low" || (forced !== "high" && weak),
    reason: "",
    onLow(cb) {
      lowCallbacks.push(cb);
    },
    setLow(reason) {
      if (FX.low) return;
      FX.low = true;
      FX.reason = reason;
      html.classList.add("fx-low");
      lowCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (_) {
          /* a failing callback must not stop the others */
        }
      });
    },
  };
  window.RZ_FX = FX;
  if (FX.low) html.classList.add("fx-low");

  const modules = [];
  let rafId = 0;
  let lastFrame = 0;
  const perf = { start: 0, samples: [], done: forced === "high" || FX.low };

  function samplePerf(now, dt) {
    if (perf.done) return;
    if (!perf.start) perf.start = now;
    const elapsed = now - perf.start;
    if (elapsed < 1500) return; // warm-up: fonts, canvas allocation
    if (dt < 250) perf.samples.push(dt); // ignore tab-switch gaps
    if (elapsed > 5000 && perf.samples.length >= 60) {
      perf.done = true;
      const s = perf.samples.slice().sort((a, b) => a - b);
      const p50 = s[Math.floor(s.length / 2)];
      if (p50 > 26) FX.setLow("perf p50=" + p50.toFixed(1) + "ms");
    }
  }

  function loop(now) {
    rafId = 0;
    if (document.hidden) return;
    const dt = lastFrame ? now - lastFrame : 16.7;
    lastFrame = now;
    samplePerf(now, dt);
    for (const m of modules) {
      if (!m.active) continue;
      if (now - m.t < m.minDelta) continue;
      const mdt = m.t ? now - m.t : 16.7;
      m.t = now;
      m.step(now, Math.min(mdt, 64));
    }
    if (modules.some((m) => m.active)) rafId = requestAnimationFrame(loop);
  }

  function wake() {
    if (rafId || document.hidden || !modules.some((m) => m.active)) return;
    lastFrame = 0;
    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener("visibilitychange", wake);

  function register(mod) {
    mod.t = 0;
    mod.minDelta = mod.minDelta || 0;
    modules.push(mod);
    return mod;
  }

  /* ---------- Aurora (WebGL) ---------- */
  function initAurora(canvas) {
    let gl = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch (_) {
      gl = null;
    }
    if (!gl) return;

    const vsSrc = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
    const fsSrc = [
      "#ifdef GL_FRAGMENT_PRECISION_HIGH",
      "precision highp float;",
      "#else",
      "precision mediump float;",
      "#endif",
      "uniform vec2 u_res;",
      "uniform float u_time;",
      "uniform vec2 u_mouse;",
      "uniform float u_strength;",
      "uniform vec3 u_c1;",
      "uniform vec3 u_c2;",
      "uniform vec3 u_c3;",
      "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
      "float noise(vec2 p){",
      "  vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);",
      "  float a=hash(i);float b=hash(i+vec2(1.0,0.0));",
      "  float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));",
      "  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);",
      "}",
      "float fbm(vec2 p){",
      "  float v=0.0;float a=0.5;",
      "  for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=0.5;}",
      "  return v;",
      "}",
      "void main(){",
      "  vec2 uv=gl_FragCoord.xy/u_res;",
      "  uv.y=1.0-uv.y;",
      "  float asp=u_res.x/u_res.y;",
      "  vec2 p=vec2(uv.x*asp,uv.y);",
      "  float t=u_time*0.05;",
      "  vec2 q=vec2(fbm(p*1.5+vec2(0.0,t)),fbm(p*1.5+vec2(5.2,1.3)-t));",
      "  vec2 r=vec2(fbm(p*1.3+2.0*q+vec2(1.7,9.2)+0.7*t),fbm(p*1.3+2.0*q+vec2(8.3,2.8)-0.6*t));",
      "  float f=fbm(p*1.1+2.2*r);",
      "  float ribbon=smoothstep(0.30,0.82,f);",
      "  float vfade=smoothstep(0.0,0.10,uv.y)*(1.0-smoothstep(0.38,0.95,uv.y));",
      "  vec3 col=mix(u_c1,u_c2,clamp(f*1.5,0.0,1.0));",
      "  col=mix(col,u_c3,clamp(length(q)-0.35,0.0,1.0));",
      "  vec2 m=vec2(u_mouse.x*asp,u_mouse.y);",
      "  float d=distance(p,m);",
      "  float halo=exp(-d*d*7.0)*0.30;",
      "  float a=(ribbon*vfade*0.55+halo)*u_strength;",
      "  gl_FragColor=vec4(col*a,a);",
      "}",
    ].join("\n");

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[fx] shader compile failed:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("[fx] shader link failed:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uni = (n) => gl.getUniformLocation(prog, n);
    const uRes = uni("u_res");
    const uTime = uni("u_time");
    const uMouse = uni("u_mouse");
    const uStr = uni("u_strength");
    const uC1 = uni("u_c1");
    const uC2 = uni("u_c2");
    const uC3 = uni("u_c3");

    const DARK = { c1: [0.22, 0.74, 0.97], c2: [0.51, 0.55, 0.97], c3: [0.75, 0.52, 0.99], s: 1.0 };
    const LIGHT = { c1: [0.01, 0.52, 0.78], c2: [0.31, 0.27, 0.9], c3: [0.58, 0.2, 0.92], s: 0.34 };

    // The aurora is soft, so render at half resolution and let CSS upscale it.
    function resize() {
      const w = Math.max(2, Math.floor(window.innerWidth * 0.5));
      const h = Math.max(2, Math.floor(window.innerHeight * 0.5));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    const mouse = { tx: 0.5, ty: 0.3, x: 0.5, y: 0.3 };
    window.addEventListener(
      "pointermove",
      (e) => {
        mouse.tx = e.clientX / window.innerWidth;
        mouse.ty = e.clientY / window.innerHeight;
      },
      { passive: true }
    );

    let live = false;
    const mod = register({
      active: true,
      minDelta: 33, // ~30 fps
      step(now) {
        const pal = html.getAttribute("data-theme") === "light" ? LIGHT : DARK;
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
        gl.uniform1f(uTime, now / 1000);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uStr, pal.s);
        gl.uniform3fv(uC1, pal.c1);
        gl.uniform3fv(uC2, pal.c2);
        gl.uniform3fv(uC3, pal.c3);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!live) {
          live = true;
          canvas.classList.add("is-live");
        }
      },
    });

    const stop = () => {
      mod.active = false;
      canvas.classList.remove("is-live");
    };
    FX.onLow(stop);
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      stop();
    });
    wake();
  }

  /* ---------- Hero patch grid: simulated ViT attention ---------- */
  const STOPS = [
    [0.0, 56, 189, 248],
    [0.45, 129, 140, 248],
    [0.75, 192, 132, 252],
    [1.0, 244, 114, 182],
  ];
  function heat(v) {
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const a = STOPS[i - 1];
        const b = STOPS[i];
        const t = (v - a[0]) / (b[0] - a[0]);
        return [
          Math.round(a[1] + (b[1] - a[1]) * t),
          Math.round(a[2] + (b[2] - a[2]) * t),
          Math.round(a[3] + (b[3] - a[3]) * t),
        ];
      }
    }
    return [244, 114, 182];
  }
  const LEVELS = 24;
  const palette = { dark: [], light: [] };
  for (let l = 0; l < LEVELS; l++) {
    const v = (l + 0.5) / LEVELS;
    const c = heat(v);
    palette.dark.push("rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.08 + v * 0.62).toFixed(3) + ")");
    palette.light.push("rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.1 + v * 0.55).toFixed(3) + ")");
  }

  function initPatchGrid(canvas) {
    const ctx = canvas.getContext("2d");
    const wrap = canvas.parentElement;
    const cap = document.querySelector(".hero__viz-cap");
    const gap = 3;
    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let cell = 26;
    let offX = 0;
    let offY = 0;
    let vals = new Float32Array(0);
    let seeds = new Float32Array(0);
    let capT = 0;
    const mouse = { x: -9999, y: -9999, on: false };
    const heads = [
      { fx: 0.00031, fy: 0.00043, px: 0.0, py: 1.3, w: 1.0, s: 1.0, cx: 0, cy: 0, inv: 1 },
      { fx: 0.00047, fy: 0.00029, px: 2.1, py: 0.4, w: 0.8, s: 0.8, cx: 0, cy: 0, inv: 1 },
      { fx: 0.00023, fy: 0.00057, px: 4.2, py: 2.7, w: 0.65, s: 1.2, cx: 0, cy: 0, inv: 1 },
    ];
    const canRound = typeof ctx.roundRect === "function";

    function layout() {
      const r = wrap.getBoundingClientRect();
      W = Math.floor(r.width);
      H = Math.floor(r.height);
      if (W < 40 || H < 40) {
        cols = 0;
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, FX.low ? 1 : 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = FX.low ? 34 : W < 520 ? 22 : 26;
      cols = Math.max(1, Math.floor(W / cell));
      rows = Math.max(1, Math.floor(H / cell));
      offX = (W - cols * cell) / 2;
      offY = (H - rows * cell) / 2;
      vals = new Float32Array(cols * rows);
      seeds = new Float32Array(cols * rows);
      for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    }

    const mod = register({
      active: false,
      minDelta: FX.low ? 50 : 0,
      step(now, dt) {
        if (!cols) return;
        const rect = canvas.getBoundingClientRect();
        const mx = mouse.x - rect.left;
        const my = mouse.y - rect.top;
        const pal = html.getAttribute("data-theme") === "light" ? palette.light : palette.dark;
        const dark = pal === palette.dark;
        const k = 1 - Math.exp(-dt / 150);
        const sig = cell * 3.1;
        const sigM = cell * 3.6;
        const invM = 1 / (2 * sigM * sigM);
        for (const hd of heads) {
          hd.cx = W * (0.5 + 0.42 * Math.sin(now * hd.fx + hd.px));
          hd.cy = H * (0.5 + 0.4 * Math.sin(now * hd.fy + hd.py));
          hd.inv = 1 / (2 * sig * sig * hd.s * hd.s);
        }

        ctx.clearRect(0, 0, W, H);

        // faint patch outlines, one path for all cells
        const size = cell - gap;
        ctx.beginPath();
        for (let j = 0; j < rows; j++) {
          for (let i = 0; i < cols; i++) {
            ctx.rect(offX + i * cell + gap / 2, offY + j * cell + gap / 2, size, size);
          }
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = dark ? "rgba(148,163,184,0.09)" : "rgba(15,23,42,0.07)";
        ctx.stroke();

        let best = 0;
        let bestIdx = -1;
        for (let j = 0; j < rows; j++) {
          const cy = offY + (j + 0.5) * cell;
          for (let i = 0; i < cols; i++) {
            const idx = j * cols + i;
            const cx = offX + (i + 0.5) * cell;
            let a = 0.06 + 0.05 * Math.sin(now * 0.0011 + seeds[idx] * 6.2832);
            for (const hd of heads) {
              const dx = cx - hd.cx;
              const dy = cy - hd.cy;
              a += hd.w * Math.exp(-(dx * dx + dy * dy) * hd.inv);
            }
            if (mouse.on) {
              const dx = cx - mx;
              const dy = cy - my;
              a += 1.1 * Math.exp(-(dx * dx + dy * dy) * invM);
            }
            if (a > 1) a = 1;
            vals[idx] += (a - vals[idx]) * k;
            const v = vals[idx];
            if (v > best) {
              best = v;
              bestIdx = idx;
            }
            if (v < 0.04) continue;
            ctx.fillStyle = pal[Math.min(LEVELS - 1, (v * LEVELS) | 0)];
            const x = offX + i * cell + gap / 2;
            const y = offY + j * cell + gap / 2;
            if (canRound && !FX.low) {
              ctx.beginPath();
              ctx.roundRect(x, y, size, size, 4);
              ctx.fill();
            } else {
              ctx.fillRect(x, y, size, size);
            }
          }
        }

        if (bestIdx >= 0) {
          const bi = bestIdx % cols;
          const bj = Math.floor(bestIdx / cols);
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = dark ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.65)";
          ctx.strokeRect(offX + bi * cell + gap / 2 - 1, offY + bj * cell + gap / 2 - 1, size + 2, size + 2);
          if (cap && now - capT > 250) {
            capT = now;
            cap.textContent =
              "simulated attention · L7/H3 · top-1 patch (" + bj + "," + bi + ") · " + best.toFixed(2);
          }
        }
      },
    });

    function staticDraw() {
      for (let n = 0; n < 10; n++) mod.step(2000 + n * 120, 200);
    }

    layout();
    if (cap && reduced) cap.textContent = "simulated attention · static";

    if ("ResizeObserver" in window) {
      let pending = 0;
      new ResizeObserver(() => {
        if (pending) return;
        pending = requestAnimationFrame(() => {
          pending = 0;
          layout();
          if (reduced) staticDraw();
        });
      }).observe(wrap);
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.on = e.pointerType !== "touch";
      },
      { passive: true }
    );
    document.documentElement.addEventListener("mouseleave", () => {
      mouse.on = false;
    });

    FX.onLow(() => {
      mod.minDelta = 50;
      layout();
    });

    if (reduced) {
      staticDraw();
      return;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          mod.active = entries[0].isIntersecting;
          wake();
        },
        { threshold: 0 }
      ).observe(wrap);
    } else {
      mod.active = true;
      wake();
    }
  }

  /* ---------- Pipeline: data packets flowing through the strip ---------- */
  function initPipeline() {
    const pipe = document.querySelector(".pipeline");
    if (!pipe || reduced) return;
    const nodes = Array.from(pipe.querySelectorAll(".pipeline__node"));
    if (nodes.length < 2) return;

    const packet = document.createElement("i");
    packet.className = "pipeline__packet";
    packet.setAttribute("aria-hidden", "true");
    pipe.appendChild(packet);

    let visible = false;
    let running = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function point(el, side) {
      const pr = pipe.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = side === "right" ? r.right : side === "left" ? r.left : r.left + r.width / 2;
      return { x: x - pr.left - pipe.clientLeft, y: r.top - pr.top - pipe.clientTop + r.height / 2 };
    }

    function activate(node) {
      node.classList.add("is-active");
      setTimeout(() => node.classList.remove("is-active"), 720);
    }

    async function cycle() {
      running = true;
      while (visible && !document.hidden) {
        for (let i = 0; i < nodes.length && visible; i++) {
          activate(nodes[i]);
          if (i === nodes.length - 1) break;
          const a = point(nodes[i], "right");
          const b = point(nodes[i + 1], "left");
          const wrapped = Math.abs(a.y - b.y) > 8; // nodes wrapped onto another row
          if (wrapped || window.innerWidth <= 640) {
            await sleep(430);
            continue;
          }
          packet.style.opacity = "1";
          const anim = packet.animate(
            [
              { transform: "translate(" + a.x + "px," + a.y + "px)" },
              { transform: "translate(" + b.x + "px," + b.y + "px)" },
            ],
            { duration: 520, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }
          );
          await anim.finished.catch(() => {});
        }
        packet.style.opacity = "0";
        await sleep(1500);
      }
      running = false;
    }

    function kick() {
      if (!running && visible && !document.hidden) cycle();
    }
    document.addEventListener("visibilitychange", kick);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          kick();
        },
        { threshold: 0.2 }
      ).observe(pipe);
    }
  }

  /* ---------- 3D tilt on cards ---------- */
  function initTilt() {
    if (reduced || !finePointer) return;
    document.querySelectorAll(".card").forEach((card) => {
      if (card.id === "terminal") return; // keep the typing surface still
      let raf = 0;
      let ex = 0;
      let ey = 0;
      card.addEventListener("pointerenter", () => {
        // wait until the scroll-reveal has finished so the two transforms never fight
        if (card.classList.contains("is-visible")) card.classList.add("tilt-ready");
      });
      card.addEventListener(
        "pointermove",
        (e) => {
          if (!card.classList.contains("tilt-ready")) return;
          ex = e.clientX;
          ey = e.clientY;
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            const r = card.getBoundingClientRect();
            const amp = clamp(2800 / r.width, 1.5, 5); // wide cards tilt less
            const nx = (ex - r.left) / r.width - 0.5;
            const ny = (ey - r.top) / r.height - 0.5;
            card.style.setProperty("--ry", (nx * amp * 2).toFixed(2) + "deg");
            card.style.setProperty("--rx", (-ny * amp * 2).toFixed(2) + "deg");
          });
        },
        { passive: true }
      );
      card.addEventListener("pointerleave", () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnet() {
    if (reduced || !finePointer) return;
    const btns = Array.from(document.querySelectorAll(".btn"));
    if (!btns.length) return;
    let raf = 0;
    let px = -9999;
    let py = -9999;

    function apply() {
      raf = 0;
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        const dx = px - (r.left + r.width / 2);
        const dy = py - (r.top + r.height / 2);
        const reach = Math.max(r.width, r.height) * 0.5 + 56;
        let tx = 0;
        let ty = 0;
        if (Math.hypot(dx, dy) < reach) {
          tx = clamp(dx * 0.28, -10, 10);
          ty = clamp(dy * 0.28, -8, 8);
        }
        b.style.setProperty("--bx", tx.toFixed(1) + "px");
        b.style.setProperty("--by", ty.toFixed(1) + "px");
      }
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        px = e.clientX;
        py = e.clientY;
        if (!raf) raf = requestAnimationFrame(apply);
      },
      { passive: true }
    );
    document.documentElement.addEventListener("mouseleave", () => {
      px = -9999;
      py = -9999;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }

  /* ---------- Terminal extras ---------- */
  function initTerminal() {
    // app.js runs after this file and publishes window.RZ_TERM; resolve it lazily at event time
    // so these capture-phase listeners are registered before app.js attaches its own.
    const T = new Proxy({}, { get: (_, k) => window.RZ_TERM && window.RZ_TERM[k] });
    const card = document.getElementById("terminal");
    const form = document.getElementById("terminal-form");
    const input = document.getElementById("terminal-input");
    if (!card || !form || !input) return;

    const NAMES = ["help", "whoami", "stack", "now", "links", "theme", "top", "nvidia-smi", "history", "date", "echo", "sudo", "lang", "clear"];
    const EXTRAS = new Set(["theme", "top", "nvidia-smi", "history", "date", "echo", "sudo"]);
    const hist = [];
    let pos = 0;

    function record(text) {
      if (hist[hist.length - 1] !== text) hist.push(text);
      pos = hist.length;
    }

    const bar = (pct, width) => {
      const n = Math.round((pct / 100) * width);
      return "\u2588".repeat(n) + "\u2591".repeat(width - n);
    };
    const pad = (v, n) => String(v).padStart(n);

    function simulate(kind, token) {
      const zh = T.lang() === "zh";
      T.appendLine(zh ? "[演示] 以下为模拟输出，不是真实遥测" : "[demo] simulated output, not real telemetry", "term-muted");
      const frames = 3;
      for (let f = 0; f < frames; f++) {
        window.setTimeout(() => {
          if (!T.isCurrent(token)) return;
          if (kind === "top") {
            T.appendLine("  PID   CPU%  MEM%  CMD            [" + (f + 1) + "/" + frames + "]", "term-muted");
            ["vit-encoder", "batch-sched", "kv-cache-gc", "agent-loop"].forEach((name, i) => {
              const cpu = Math.random() * 55 + 5;
              const mem = Math.random() * 18 + 4;
              T.appendLine("  " + pad(2100 + i * 37, 4) + "  " + pad(cpu.toFixed(1), 4) + "  " + pad(mem.toFixed(1), 4) + "  " + name, "term-ok");
            });
          } else {
            for (let g = 0; g < 2; g++) {
              const util = Math.round(Math.random() * 45 + 40);
              const mem = Math.random() * 30 + 30;
              T.appendLine("  GPU" + g + "  [" + bar(util, 10) + "] " + pad(util, 3) + "%   mem " + mem.toFixed(1) + "/80 GB", "term-ok");
            }
          }
        }, 380 + f * 520);
      }
    }

    function runExtra(text) {
      const [name, ...args] = text.split(/\s+/);
      const cmd = name.toLowerCase();
      const zh = T.lang() === "zh";
      const token = T.nextToken();
      T.appendLine("visitor@www:~$ " + text, "term-cmd");
      if (cmd === "theme") {
        const arg = (args[0] || "").toLowerCase();
        const next = arg === "dark" || arg === "light" ? arg : html.getAttribute("data-theme") === "dark" ? "light" : "dark";
        T.applyTheme(next);
        T.appendLine("theme -> " + next, "term-ok");
      } else if (cmd === "top" || cmd === "nvidia-smi") {
        simulate(cmd, token);
      } else if (cmd === "history") {
        hist.forEach((h, i) => T.appendLine(pad(i + 1, 3) + "  " + h, "term-muted"));
      } else if (cmd === "date") {
        const s = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", dateStyle: "full", timeStyle: "medium" }).format(new Date());
        T.appendLine(s + " (CST)", "term-ok");
      } else if (cmd === "echo") {
        T.appendLine(args.join(" "), "term-ok");
      } else if (cmd === "sudo") {
        T.appendLine(zh ? "rzli 不在 sudoers 文件中。此事件将被记录。" : "rzli is not in the sudoers file. This incident will be reported.", "term-muted");
      }
    }

    // Capture phase: runs before the handlers in app.js, so extras never reach the built-in parser.
    form.addEventListener(
      "submit",
      (e) => {
        const text = input.value.trim();
        if (!text) return;
        record(text);
        if (EXTRAS.has(text.split(/\s+/)[0].toLowerCase())) {
          e.preventDefault();
          e.stopImmediatePropagation();
          input.value = "";
          runExtra(text);
        }
      },
      true
    );

    card.addEventListener(
      "click",
      (e) => {
        const pill = e.target.closest && e.target.closest(".cmd-pill");
        if (!pill) return;
        const cmd = (pill.getAttribute("data-cmd") || "").toLowerCase();
        record(cmd);
        if (EXTRAS.has(cmd)) {
          e.stopPropagation();
          runExtra(cmd);
        }
      },
      true
    );

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        if (!hist.length) return;
        e.preventDefault();
        pos = Math.max(0, pos - 1);
        input.value = hist[pos] || "";
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        pos = Math.min(hist.length, pos + 1);
        input.value = hist[pos] || "";
      } else if (e.key === "Tab") {
        const v = input.value.trimStart().toLowerCase();
        if (!v || v.includes(" ")) return; // empty input: let Tab move focus as usual
        e.preventDefault();
        const hits = NAMES.filter((n) => n.startsWith(v));
        if (hits.length === 1) {
          input.value = hits[0] + " ";
        } else if (hits.length > 1) {
          let p = hits[0];
          for (const h of hits) while (!h.startsWith(p)) p = p.slice(0, -1);
          input.value = p;
          T.appendLine(hits.join("  "), "term-muted");
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        T.clear();
      }
    });
  }

  /* ---------- boot ---------- */
  const glCanvas = document.getElementById("gl-canvas");
  if (glCanvas && !reduced && !FX.low) initAurora(glCanvas);
  const patchCanvas = document.getElementById("patch-canvas");
  if (patchCanvas) initPatchGrid(patchCanvas);
  initPipeline();
  initTilt();
  initMagnet();
  initTerminal();
  wake();
})();
