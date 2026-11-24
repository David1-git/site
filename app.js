(() => {
  const html = document.documentElement;

  /* ---------- i18n dictionary ---------- */
  const i18n = {
    zh: {
      nav_focus: "方向",
      nav_terminal: "终端",
      nav_projects: "探索",
      nav_connect: "联系",
      status_text: "在线 · 探索多模态智能与简洁系统",
      hero_hi: "你好，我是",
      hero_sub:
        "一名关注 <strong>Multimodal AI</strong>、<strong>高效系统工程</strong> 与 <strong>优雅工具链</strong> 的构建者。在这里记录实验、构建小而美的工具，并把复杂问题拆解成清晰的现实。",
      hero_cta_term: "打开交互终端",
      card1_tag: "核心方向",
      card1_title: "让复杂模型与真实工程场景对齐",
      card1_desc:
        "专注于多模态理解与推理管线、端到端数据闭环以及轻量级自动化工具链。喜欢把前沿研究能力打磨成可复用、低延迟的生产级系统。",
      card2_tag: "数字坐标",
      stat_domain: "主域名",
      stat_tz: "所在时区",
      stat_focus: "当前关注",
      stat_focus_val: "Omni-MLLM & Agents",
      stat_deploy: "站点驱动",
      p1_tag: "工程信条",
      p1_title: "极简、可验证、零冗余",
      p1_desc: "倾向用最小代价解决核心问题：能静态托管就不上重型后端，能自动化验证就不靠人肉祈祷。",
      p2_tag: "AI 工作流",
      p2_title: "多模态评测与工具编排",
      p2_desc: "围绕视觉-语言推理、高质量标注与评估数据集构建可扩展的数据与推理基础设施。",
      p3_tag: "持续记录",
      p3_title: "数字花园正在生长",
      p3_desc: "这里目前是个人主页起点，后续会逐步接入技术随笔、实验笔记与开源项目索引。",
      conn_tag: "保持联系",
      conn_title: "欢迎交流想法与工程实践",
      conn_desc: "如果你对多模态 AI、自动化工作流或有趣的极客工具感兴趣，欢迎通过 GitHub 与我交流。",
      copy_url: "复制本站地址",
      copied: "已复制地址!",
      footer_note: "纯 HTML / CSS / Vanilla JS 构建 · 零第三方框架依赖",
    },
    en: {
      nav_focus: "Focus",
      nav_terminal: "Terminal",
      nav_projects: "Notes",
      nav_connect: "Connect",
      status_text: "Online · Building Multimodal AI & Clean Systems",
      hero_hi: "Hi, I'm",
      hero_sub:
        "Engineer &amp; builder focused on <strong>Multimodal AI</strong>, <strong>Systems Engineering</strong>, and <strong>pragmatic developer tooling</strong>. Turning research ideas into fast, reliable software.",
      hero_cta_term: "Launch Terminal",
      card1_tag: "Core Focus",
      card1_title: "Bridging foundation models & real systems",
      card1_desc:
        "Working across vision-language reasoning pipelines, high-signal data curation, and lightweight agentic tooling designed for clarity and speed.",
      card2_tag: "Coordinates",
      stat_domain: "Domain",
      stat_tz: "Timezone",
      stat_focus: "Exploring",
      stat_focus_val: "Omni-MLLM & Agents",
      stat_deploy: "Powered by",
      p1_tag: "Philosophy",
      p1_title: "Minimal, verifiable, zero bloat",
      p1_desc: "Prefer the simplest architecture that survives reality—static at the edge, automated checks everywhere.",
      p2_tag: "AI Systems",
      p2_title: "Evaluation & agent orchestration",
      p2_desc: "Crafting clean data pipelines and evaluation harnesses for multimodal reasoning and real-world apps.",
      p3_tag: "Digital Garden",
      p3_title: "More writing soon",
      p3_desc: "This edge-hosted homepage is just the entry point; notes and project write-ups are on the way.",
      conn_tag: "Get in Touch",
      conn_title: "Always open to sharp ideas",
      conn_desc: "Interested in multimodal intelligence, infra experiments, or building useful tools? Say hello on GitHub.",
      copy_url: "Copy Site URL",
      copied: "Copied!",
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

  /* ---------- Copy URL button ---------- */
  const copyBtn = document.getElementById("copy-domain");
  copyBtn?.addEventListener("click", async () => {
    const val = copyBtn.getAttribute("data-copy") || window.location.href;
    const span = copyBtn.querySelector("span");
    const lang = html.getAttribute("data-lang") || "zh";
    try {
      await navigator.clipboard.writeText(val);
      if (span) {
        span.textContent = i18n[lang].copied;
        setTimeout(() => {
          span.textContent = i18n[html.getAttribute("data-lang") || "zh"].copy_url;
        }, 1800);
      }
    } catch {
      window.prompt("Copy URL:", val);
    }
  });

  /* ---------- Interactive Terminal ---------- */
  const termBody = document.getElementById("terminal-body");
  const termForm = document.getElementById("terminal-form");
  const termInput = document.getElementById("terminal-input");

  const responses = {
    help: () => [
      "Available commands:",
      "  whoami   - About Runze Li",
      "  stack    - Core technical focus & tools",
      "  now      - What I am exploring lately",
      "  links    - Public endpoints",
      "  clear    - Clear terminal buffer",
    ],
    whoami: () => [
      "Runze Li (rzli)",
      "Domain   : https://www.rzli.org",
      "Location : Asia/Shanghai (UTC+8)",
      "Focus    : Multimodal AI, Evaluation Systems & Infra",
    ],
    stack: () => [
      "Languages : Python, TypeScript, Bash",
      "AI / Data : Multimodal LLMs, Async Inference, Data Curation",
      "Edge Web  : Pure HTML/CSS/JS -> GitHub -> Cloudflare Pages",
    ],
    now: () => [
      "[2026] Building clean multimodal pipelines & agentic workflows.",
      "[2026] Launched minimal edge homepage at www.rzli.org.",
    ],
    links: () => [
      "GitHub   : https://github.com/David1-git",
      "Homepage : https://www.rzli.org",
    ],
  };

  function appendLine(text, cls = "") {
    if (!termBody) return;
    const div = document.createElement("div");
    div.className = `term-line ${cls}`.trim();
    div.textContent = text;
    termBody.appendChild(div);
    termBody.scrollTop = termBody.scrollHeight;
  }

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "clear") {
      if (termBody) termBody.innerHTML = "";
      return;
    }
    appendLine(`visitor@rzli.org:~$ ${raw}`, "term-cmd");
    if (responses[cmd]) {
      responses[cmd]().forEach((line) => appendLine(line, "term-ok"));
    } else {
      appendLine(`command not found: ${cmd}. Try 'help'.`, "term-muted");
    }
  }

  // Initial terminal greeting
  appendLine("Welcome to rzli.org interactive shell. Type 'help' or click a command pill.", "term-muted");
  runCommand("whoami");

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
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas && !prefersReduced) {
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
