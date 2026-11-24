(() => {
  const html = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- i18n dictionary ---------- */
  const i18n = {
    zh: {
      nav_focus: "方向",
      nav_terminal: "终端",
      nav_method: "方法",
      status_text: "在线 · 多模态大模型 / Agent 编排 / 推理压缩",
      hero_hi: "你好，我是",
      hero_sub:
        "多模态大模型：<strong>场景理解</strong>、<strong>推理压缩</strong>、<strong>生成与决策</strong>。视觉编码器到批调度服务一路打通，把研究模型压进真实延迟。",
      hero_cta_term: "打开交互终端",
      hero_cta_matrix: "看能力矩阵",
      card1_tag: "核心方向",
      card1_title: "从权重到线上：多模态大模型的全链路工程",
      card1_desc:
        "视觉编码器选型与模态对齐、指令微调的数据配比与去重、Agent 规划与工具调用协议、推理侧批调度与 KV Cache 管理——四段各有各的失败模式。我把四段接成一条可回归的链路，而不是在单点刷分。",
      card2_tag: "能力矩阵",
      mx1: "建模层",
      mx2: "Agent 层",
      mx3: "推理层",
      mx4: "工程层",
      p1_tag: "工程信条",
      p1_title: "极简、可验证、零冗余",
      p1_desc: "本站即样本：纯 HTML/CSS/JS，Cloudflare Pages 边缘托管，零框架零构建。任何优化先落指标，再动模型。",
      p2_tag: "评测先行",
      p2_title: "评测先于模型",
      p2_desc:
        "换一版权重、改一个 prompt，先跑定版评测集与回归门禁。多模态评测的坑在口径——分辨率、帧采样、prompt 模板不一致，榜单就没有意义。",
      p3_tag: "当前主线",
      p3_title: "正在啃的四件事",
      th1_k: "场景理解",
      th1_v: "开放词表检测 · 时序事件定位 · 区域级描述与场景图",
      th2_k: "推理压缩",
      th2_v: "量化 · 视觉 token 剪枝 · KV 压缩与投机解码",
      th3_k: "决策模型",
      th3_v: "级联判定 · 置信度校准 · 证据 grounding 与人在回路",
      th4_k: "图像 / 视频生成",
      th4_v: "DiT / flow matching 可控生成 · 时序一致性 · 步数蒸馏",
      footer_note: "纯 HTML / CSS / Vanilla JS 构建 · 零第三方框架依赖",
    },
    en: {
      nav_focus: "Focus",
      nav_terminal: "Terminal",
      nav_method: "Practice",
      status_text: "Online · Multimodal LLMs / Agent Orchestration / Inference Compression",
      hero_hi: "Hi, I'm",
      hero_sub:
        "Multimodal LLMs: <strong>scene understanding</strong>, <strong>inference compression</strong>, <strong>generation &amp; decision</strong>. Vision encoder all the way to batched serving — research models compressed into real latency.",
      hero_cta_term: "Launch Terminal",
      hero_cta_matrix: "Capability Matrix",
      card1_tag: "Core Focus",
      card1_title: "From Checkpoint to Production: Full-Stack Multimodal Engineering",
      card1_desc:
        "Encoder selection and modality alignment, instruction-tuning data mixing and dedup, agent planning and tool-calling protocol, batched serving with KV-cache management — four stages, four distinct failure modes. I wire them into one regression-gated chain instead of chasing single-point scores.",
      card2_tag: "Capability Matrix",
      mx1: "Modeling tier",
      mx2: "Agent tier",
      mx3: "Serving tier",
      mx4: "System tier",
      p1_tag: "Philosophy",
      p1_title: "Minimal, verifiable, zero bloat",
      p1_desc:
        "This page is the sample: pure HTML/CSS/JS on Cloudflare Pages, no framework, no build step. Every optimization lands a metric first, then touches the model.",
      p2_tag: "Eval First",
      p2_title: "Evaluation before modeling",
      p2_desc:
        "New checkpoint or new prompt — run the frozen eval set and regression gate first. Multimodal evals break on protocol: resolution, frame sampling and prompt templates must match, or the leaderboard is noise.",
      p3_tag: "Active",
      p3_title: "Four threads right now",
      th1_k: "Scene understanding",
      th1_v: "open-vocab detection · temporal event grounding · region captioning · scene graphs",
      th2_k: "Inference compression",
      th2_v: "quantization · visual-token pruning · KV eviction · speculative decoding",
      th3_k: "Decision models",
      th3_v: "cascade decisions · confidence calibration · evidence grounding · human-in-the-loop",
      th4_k: "Image / video generation",
      th4_v: "DiT / flow matching control · temporal consistency · step distillation",
      footer_note: "Handcrafted with pure HTML, CSS & Vanilla JS · Zero dependencies",
    },
  };

  function applyLang(lang) {
    html.setAttribute("data-lang", lang);
    html.lang = lang === "zh" ? "zh-CN" : "en";
    localStorage.setItem("rzli_lang", lang);
    const label = document.getElementById("lang-label");
    if (label) label.textContent = lang === "zh" ? "EN" : "中";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (i18n[lang] && i18n[lang][key]) {
        el.innerHTML = i18n[lang][key];
      }
    });
  }

  const savedLang = localStorage.getItem("rzli_lang") || "zh";
  applyLang(savedLang);

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    const next = html.getAttribute("data-lang") === "zh" ? "en" : "zh";
    applyLang(next);
  });

  /* ---------- Theme toggle ---------- */
  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    localStorage.setItem("rzli_theme", theme);
  }
  const savedTheme = localStorage.getItem("rzli_theme") || "dark";
  applyTheme(savedTheme);

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  /* ---------- Live Beijing Clock ---------- */
  const clockEl = document.getElementById("live-clock");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function updateClock() {
    if (!clockEl) return;
    try {
      const str = new Intl.DateTimeFormat("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());
      clockEl.textContent = `${str} CST`;
    } catch {
      clockEl.textContent = new Date().toLocaleTimeString();
    }
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.querySelector(".scroll-progress span");
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  /* ---------- Pointer aura (cursor-follow light) ---------- */
  const aura = document.querySelector(".cursor-aura");
  if (aura && !reduced) {
    let queued = false;
    let px = window.innerWidth / 2;
    let py = window.innerHeight * 0.28;

    const paint = () => {
      aura.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
      queued = false;
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        px = e.clientX;
        py = e.clientY;
        if (!queued) {
          queued = true;
          requestAnimationFrame(paint);
        }
      },
      { passive: true }
    );
    paint();
  }

  /* ---------- Spotlight border/surface glow ---------- */
  document.querySelectorAll(".spotlight").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  /* ---------- Scroll Reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Hero name decode ---------- */
  const nameEl = document.querySelector(".gradient-text");
  if (nameEl && !reduced) {
    const target = nameEl.textContent;
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789·/<>";
    const start = performance.now();
    const duration = 1500;
    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const solved = Math.floor(t * target.length);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (target[i] === " ") {
          out += " ";
        } else if (i < solved) {
          out += target[i];
        } else {
          out += glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      }
      nameEl.textContent = out;
      if (t < 1) requestAnimationFrame(frame);
      else nameEl.textContent = target;
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Terminal shell ---------- */
  const termBody = document.getElementById("terminal-body");
  const termForm = document.getElementById("terminal-form");
  const termInput = document.getElementById("terminal-input");

  const shellText = {
    en: {
      banner: "rzli.org interactive shell · lang=en. Type 'help' or 'lang zh' to switch.",
      switched: "Shell language -> en.",
      langUsage: "usage: lang en | lang zh",
      notFound: "command not found: ",
      tryHelp: ". Try 'help'.",
      commands: [
        "Available commands:",
        "  whoami   - identity & focus",
        "  stack    - modeling / agents / serving / systems",
        "  now      - active threads",
        "  links    - public endpoints",
        "  lang     - lang en | lang zh",
        "  clear    - clear buffer",
      ],
      whoami: [
        "Runze Li (rzli)",
        "Domain : https://www.rzli.org",
        "Focus  : Multimodal LLM · Scene Understanding · Inference Compression · Decision & Generation",
        "Path   : Vision-Encoder -> SFT/LoRA -> Planner-Executor -> Batched Serving",
      ],
      stack: [
        "Modeling : Video Temporal, Chart/Doc Parsing, V-L Alignment, SFT/LoRA/DPO",
        "Agents   : Planner-Executor, Tool Routing, Memory Compression, Trajectory Eval",
        "Serving  : Dynamic Batching, KV Reuse, Quantization, Speculative Decode, Edge Deploy",
        "Systems  : Async Pipelines, Eval Harness, Regression Gates, Cost Observability",
        "Web      : Pure HTML/CSS/JS -> Cloudflare Pages",
      ],
      now: [
        "[scene]    open-vocab detection · temporal event grounding · region captioning",
        "[compress] quantization · visual-token pruning · KV eviction · spec decode",
        "[decide]   cascade decision · confidence calibration · evidence grounding",
        "[gen]      DiT / flow matching · temporal consistency · step distillation",
      ],
      links: ["Homepage : https://www.rzli.org"],
    },
    zh: {
      banner: "rzli.org 交互终端 · 语言=中文。输入 'help' 或 'lang en' 切换英文。",
      switched: "终端语言 -> 中文。",
      langUsage: "用法：lang en | lang zh",
      notFound: "未找到命令：",
      tryHelp: "。输入 'help' 查看可用命令。",
      commands: [
        "可用命令：",
        "  whoami   - 身份与方向",
        "  stack    - 建模 / Agent / 推理 / 工程",
        "  now      - 当前主线",
        "  links    - 公开入口",
        "  lang     - lang en | lang zh",
        "  clear    - 清空缓冲区",
      ],
      whoami: [
        "Runze Li (rzli)",
        "域名 : https://www.rzli.org",
        "方向 : 多模态大模型 · 场景理解 · 推理压缩 · 决策与生成",
        "链路 : 视觉编码器 -> SFT/LoRA -> Planner-Executor -> 批调度服务",
      ],
      stack: [
        "建模 : 视频时序理解, 图表/文档解析, 视觉-语言对齐, SFT/LoRA/DPO",
        "Agent: Planner-Executor, 工具路由, 记忆压缩, 轨迹评测",
        "推理 : 动态批调度, KV 复用, 量化, 投机解码, 端侧部署",
        "工程 : 异步管线, 评测框架, 回归门禁, 成本可观测",
        "Web  : 纯 HTML/CSS/JS -> Cloudflare Pages",
      ],
      now: [
        "[理解] 开放词表检测 · 时序事件定位 · 区域级描述",
        "[压缩] 量化 · 视觉 token 剪枝 · KV 淘汰 · 投机解码",
        "[决策] 级联判定 · 置信度校准 · 证据 grounding",
        "[生成] DiT / flow matching · 时序一致性 · 步数蒸馏",
      ],
      links: ["主页 : https://www.rzli.org"],
    },
  };

  let termLang = localStorage.getItem("rzli_term_lang") || "en";

  function appendLine(text, cls = "") {
    if (!termBody) return;
    const div = document.createElement("div");
    div.className = `term-line ${cls}`.trim();
    div.textContent = text;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }

  /* Typewriter queue: lines appear one by one, cancellable */
  let queueToken = 0;
  function typeLines(lines, cls, token) {
    lines.forEach((line, i) => {
      window.setTimeout(() => {
        if (token !== queueToken) return;
        appendLine(line, cls);
      }, i * 42);
    });
  }

  const responses = {
    help: (t) => t.commands,
    whoami: (t) => t.whoami,
    stack: (t) => t.stack,
    now: (t) => t.now,
    links: (t) => t.links,
  };

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    if (cmd === "clear") {
      queueToken++;
      if (termBody) termBody.innerHTML = "";
      return;
    }

    const t = shellText[termLang];
    queueToken++;
    const token = queueToken;
    appendLine(`visitor@rzli.org:~$ ${raw}`, "term-cmd");

    if (cmd.startsWith("lang")) {
      const arg = cmd.split(/\s+/)[1];
      if (arg === "zh" || arg === "en") {
        termLang = arg;
        localStorage.setItem("rzli_term_lang", arg);
        window.setTimeout(() => {
          if (token !== queueToken) return;
          appendLine(shellText[termLang].switched, "term-ok");
        }, 42);
      } else {
        window.setTimeout(() => {
          if (token !== queueToken) return;
          appendLine(t.langUsage, "term-muted");
        }, 42);
      }
      return;
    }

    if (responses[cmd]) {
      typeLines(responses[cmd](t), "term-ok", token);
    } else {
      window.setTimeout(() => {
        if (token !== queueToken) return;
        appendLine(`${t.notFound}${cmd}${t.tryHelp}`, "term-muted");
      }, 42);
    }
  }

  // Initial greeting
  typeLines([shellText[termLang].banner], "term-muted", queueToken);
  window.setTimeout(() => runCommand("whoami"), 120);

  termForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!termInput) return;
    runCommand(termInput.value);
    termInput.value = "";
  });

  document.querySelectorAll(".cmd-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.getAttribute("data-cmd") || "";
      runCommand(cmd);
    });
  });

  /* ---------- Interactive Neural Particle Canvas ---------- */
  const canvas = document.getElementById("neural-canvas");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(Math.floor((width * height) / 22000), 75);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: Math.random() * 1.6 + 0.9,
      }));
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("pointerleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    resize();

    function frame() {
      ctx.clearRect(0, 0, width, height);
      const isDark = html.getAttribute("data-theme") !== "light";
      const dotColor = isDark ? "rgba(125, 211, 252, 0.55)" : "rgba(79, 70, 229, 0.42)";
      const lineRGB = isDark ? "129, 140, 248" : "79, 70, 229";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dxm = mouse.x - p.x;
        const dym = mouse.y - p.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 170 && dm > 1) {
          p.x += (dxm / dm) * 0.35;
          p.y += (dym / dm) * 0.35;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * (isDark ? 0.22 : 0.14);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${lineRGB}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }
})();
