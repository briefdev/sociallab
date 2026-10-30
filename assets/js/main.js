/* Social Lab — site interactions (no dependencies) */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Header shadow on scroll */
  var header = $(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Mega menus */
  $$(".nav-item[data-menu]").forEach(function (item) {
    var btn = $(".nav-link", item); var t;
    function open(v) { item.classList.toggle("is-open", v); btn.setAttribute("aria-expanded", v ? "true" : "false"); }
    btn.addEventListener("click", function (e) { e.preventDefault(); var v = !item.classList.contains("is-open"); if (item._hoverAt && Date.now() - item._hoverAt < 1500) { v = true; item._hoverAt = 0; } $$(".nav-item.is-open").forEach(function (o) { if (o !== item) { o.classList.remove("is-open"); $(".nav-link", o).setAttribute("aria-expanded", "false"); } }); open(v); });
    item.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) { clearTimeout(t); if (!item.classList.contains("is-open")) item._hoverAt = Date.now(); open(true); } });
    item.addEventListener("mouseleave", function () { if (window.matchMedia("(hover: hover)").matches) { t = setTimeout(function () { open(false); }, 140); } });
    item.addEventListener("keydown", function (e) { if (e.key === "Escape") { open(false); btn.focus(); } });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".nav-item")) $$(".nav-item.is-open").forEach(function (o) { o.classList.remove("is-open"); $(".nav-link", o).setAttribute("aria-expanded", "false"); }); });

  /* Mobile drawer */
  var drawer = $("#drawer");
  $$("[data-drawer]").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("data-drawer") === "open";
      drawer.hidden = !open; document.body.style.overflow = open ? "hidden" : "";
      $$("[data-drawer='open']").forEach(function (o) { o.setAttribute("aria-expanded", open ? "true" : "false"); });
      if (open) { var c = $("[data-drawer='close']", drawer); if (c) c.focus(); }
    });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && !drawer.hidden) { $("[data-drawer='close']", drawer).click(); } });

  /* Generic tabs: [data-tabs] contains [role=tab][aria-controls] */
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("[role='tab']", root).filter(function (t) { return t.closest("[data-tabs]") === root; });
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
      root.dispatchEvent(new CustomEvent("tabchange", { detail: { tab: tab } }));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); root.classList.add("is-paused"); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowLeft" || k === "ArrowDown") n = tabs[(i + 1) % tabs.length];
        if (k === "ArrowRight" || k === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    root._select = select; root._tabs = tabs;
  });

  /* Stepper autoplay (pauses on interaction / when off-screen) */
  $$(".stepper").forEach(function (st) {
    if (reduce || !st._tabs) return;
    var idx = 0, timer = null, visible = false;
    function next() { if (st.classList.contains("is-paused") || !visible) return; idx = (idx + 1) % st._tabs.length; st._select(st._tabs[idx]); }
    st.addEventListener("tabchange", function (e) { idx = st._tabs.indexOf(e.detail.tab); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.isIntersecting; }); }, { threshold: .3 }).observe(st);
    } else { visible = true; }
    timer = setInterval(next, 6000);
    st.addEventListener("mouseenter", function () { st.classList.add("is-paused"); });
  });

  /* Hero chat demo: scripted conversations per channel */
  var demo = $("[data-chat-demo]");
  if (demo) {
    var scripts = JSON.parse($("#chat-scripts").textContent);
    var box = $(".chat", demo), tag = $("[data-channel-tag]", demo), runId = 0;
    function render(key, animate) {
      var s = scripts[key]; if (!s) return; var my = ++runId;
      tag.innerHTML = s.tag; box.innerHTML = "";
      if (!animate || reduce) { s.msgs.forEach(function (m) { box.insertAdjacentHTML("beforeend", m); }); return; }
      var i = 0;
      (function step() {
        if (my !== runId || i >= s.msgs.length) return;
        var m = s.msgs[i]; var isAi = /class="msg (out|sys)/.test(m);
        if (isAi && i > 0) {
          box.insertAdjacentHTML("beforeend", '<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>');
          setTimeout(function () { if (my !== runId) return; var ty = $(".typing", box); if (ty) ty.remove(); box.insertAdjacentHTML("beforeend", m); i++; setTimeout(step, 700); }, 900);
        } else { box.insertAdjacentHTML("beforeend", m); i++; setTimeout(step, 650); }
      })();
    }
    var first = $("[role='tab'][aria-selected='true']", demo);
    render(first ? first.getAttribute("data-key") : Object.keys(scripts)[0], false);
    demo.addEventListener("tabchange", function (e) { render(e.detail.tab.getAttribute("data-key"), true); });
  }

  /* Reveal: only elements below the first screen start hidden */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove("pre"); io.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(function (el) { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el); } });
  }

  /* Pricing toggle */
  $$("[data-billing]").forEach(function (wrap) {
    var btns = $$("button[data-cycle]", wrap.querySelector(".price-toggle") || wrap);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-cycle");
        btns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        $$("[data-m]", wrap).forEach(function (el) { el.textContent = el.getAttribute(c === "y" ? "data-y" : "data-m"); });
        $$("[data-sub-m]", wrap).forEach(function (el) { el.textContent = el.getAttribute(c === "y" ? "data-sub-y" : "data-sub-m"); });
      });
    });
  });

  /* Case-study filters */
  $$("[data-filter-group]").forEach(function (g) {
    var target = document.getElementById(g.getAttribute("data-filter-group"));
    $$("button", g).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-filter");
        $$("button", g).forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
        $$("[data-cat]", target).forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); });
      });
    });
  });

  /* WhatsApp cost calculator */
  var calc = $("[data-calc]");
  if (calc) {
    var rates = JSON.parse($("#wa-rates").textContent);
    var fmt = function (n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    function run() {
      var m = rates[$("#calc-country").value]; var cur = $("#calc-cur").value;
      var c = cur === "SAR" && m.sar ? m.sar : m.usd; var fx = cur === "SAR" && !m.sar ? 3.75 : 1;
      var lines = [["marketing", "تسويقية"], ["utility", "خدمية (تحديثات الطلب)"], ["auth", "رموز التحقق"], ["service", "ردود خدمة العملاء"]];
      var total = 0, html = "";
      lines.forEach(function (l) {
        var v = +$("#calc-" + l[0]).value; $("#out-" + l[0]).textContent = v.toLocaleString("en-US");
        var billable = l[0] === "service" ? Math.max(0, v - 1000) : v;
        var cost = billable * c[l[0]] * fx; total += cost;
        var note = l[0] === "service" ? " <small>(أول 1,000 مجانية)</small>" : "";
        html += "<div><span>" + l[1] + " × " + billable.toLocaleString("en-US") + note + "</span><span>" + fmt(cost) + "</span></div>";
      });
      $("[data-calc-lines]").innerHTML = html;
      $("[data-calc-total]").textContent = fmt(total);
      $("[data-calc-cur]").textContent = cur === "SAR" ? "ر.س شهرياً" : "دولار شهرياً";
    }
    $$("input, select", calc).forEach(function (el) { el.addEventListener("input", run); el.addEventListener("change", run); });
    run();
  }

  /* Demo request form → opens WhatsApp with a prefilled message */
  var form = $("#demo-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var get = function (id) { return ($("#" + id).value || "").trim(); };
      var need = ["f-name", "f-company", "f-phone"]; var miss = need.filter(function (id) { return !get(id); });
      var err = $(".err", form);
      if (miss.length) { err.textContent = "أكمل الاسم واسم المنشأة ورقم الجوال حتى نتواصل معك."; $("#" + miss[0]).focus(); return; }
      err.textContent = "";
      var text = "مرحباً سوشل لاب، أبغى عرضاً مباشراً.\n" + "الاسم: " + get("f-name") + "\nالمنشأة: " + get("f-company") + "\nالقطاع: " + get("f-sector") + "\nالجوال: " + get("f-phone") + (get("f-msg") ? "\nملاحظات: " + get("f-msg") : "");
      var a = $("#wa-send"); a.href = "https://wa.me/966530901484?text=" + encodeURIComponent(text); a.hidden = false; a.focus();
      $(".form-done", form).hidden = false;
    });
  }

  /* Year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* Growth engine: cycle scenarios, light nodes along the path, draw chords */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.forEach.call(document.querySelectorAll("[data-engine]"), function (eng) {
    var cfg = JSON.parse(eng.getAttribute("data-engine"));
    var wrap = eng.parentNode, g = eng.querySelector(".chords"), ns = "http://www.w3.org/2000/svg";
    var capT = wrap.querySelector("[data-cap-t]"), capS = wrap.querySelector("[data-cap-s]"), dots = wrap.querySelectorAll(".dots button");
    var si = 0, step = 0, timer = null, visible = true, paused = false;
    function nodeEl(id) { return eng.querySelector('[data-node="' + id + '"]'); }
    function clear() { g.innerHTML = ""; Array.prototype.forEach.call(eng.querySelectorAll(".enode.on"), function (n) { n.classList.remove("on"); n.removeAttribute("data-step"); }); }
    // every step travels through the engine core: node → core, then core → next node (no criss-crossing)
    function spoke(id) {
      var p = cfg.pos[id];
      Array.prototype.forEach.call(g.querySelectorAll(".chord.on"), function (o) { o.classList.add("old"); });
      var el = document.createElementNS(ns, "line"); el.setAttribute("class", "chord");
      el.setAttribute("x1", 50); el.setAttribute("y1", 50); el.setAttribute("x2", p[0]); el.setAttribute("y2", p[1]); g.appendChild(el);
      requestAnimationFrame(function () { el.classList.add("on"); });
    }
    function chord(a, b) { spoke(b); }
    function show(s, k) {
      var sc = cfg.sc[s]; if (k === 0) clear();
      var id = sc.path[k]; var n = nodeEl(id); if (n) n.setAttribute("data-step", k + 1); if (k === 0) spoke(id); Array.prototype.forEach.call(eng.querySelectorAll(".enode.now"), function (x) { x.classList.remove("now"); }); if (n) n.classList.add("on", "now");
      if (k > 0) chord(sc.path[k - 1], id);
      if (capT) { capT.textContent = sc.title; capS.textContent = sc.steps[k] || ""; }
      Array.prototype.forEach.call(dots, function (d, i) { d.setAttribute("aria-pressed", i === s ? "true" : "false"); });
    }
    function full(s) { clear(); var sc = cfg.sc[s]; sc.path.forEach(function (id, k) { show(s, k); }); if (capS) capS.textContent = sc.steps[sc.steps.length - 1]; }
    function tick() {
      if (paused || !visible) return;
      var sc = cfg.sc[si]; step++;
      if (step >= sc.path.length + 1) { si = (si + 1) % cfg.sc.length; step = 0; }
      if (step < cfg.sc[si].path.length) show(si, step);
    }
    Array.prototype.forEach.call(dots, function (d, i) { d.addEventListener("click", function () { si = i; step = 0; show(si, 0); if (reduce) full(si); }); });
    eng.addEventListener("mouseenter", function () { paused = true; });
    eng.addEventListener("mouseleave", function () { paused = false; });
    if (reduce) { full(0); return; }
    show(0, 0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(eng);
    timer = setInterval(tick, 1050);
  });
})();

/* Scenes: play entrance when visible; replay when a tab/step reveals one */
(function () {
  var sel = ".scene, .cluster";
  function play(el) { el.classList.remove("play"); void el.offsetWidth; el.classList.add("play"); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { play(en.target); io.unobserve(en.target); } }); }, { threshold: .25 });
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (s) { io.observe(s); });
  } else { Array.prototype.forEach.call(document.querySelectorAll(sel), function (s) { s.classList.add("play"); }); }
  document.addEventListener("tabchange", function (e) {
    var t = e.detail && e.detail.tab; if (!t) return;
    var p = document.getElementById(t.getAttribute("aria-controls")); if (!p) return;
    Array.prototype.forEach.call(p.querySelectorAll(sel), play);
  }, true);
})();

/* Playground: visitor plays the customer */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var D = reduce ? 0 : 1;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-pg]"), function (pg) {
    var S = JSON.parse(pg.querySelector("script[type='application/json']").textContent);
    var stage = pg.querySelector(".pg-stage"), chips = pg.querySelector(".pg-chips"), form = pg.querySelector(".pg-form"), input = form && form.querySelector("input");
    var mRev = pg.querySelector('[data-m="rev"]'), mTime = pg.querySelector('[data-m="time"]');
    var rev = 0, time = 0, busy = false, started = false, run = 0;
    function scroll() { stage.scrollTop = stage.scrollHeight; }
    function add(html) { stage.insertAdjacentHTML("beforeend", html); scroll(); }
    function bump(el, v, suffix) {
      if (!el) return; var from = +el.getAttribute("data-v") || 0; el.setAttribute("data-v", v);
      var t0 = performance.now(), dur = reduce ? 1 : 700;
      (function f(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (v - from) * p).toLocaleString("en-US"); if (p < 1) requestAnimationFrame(f); })(t0);
      el.classList.add("bump"); setTimeout(function () { el.classList.remove("bump"); }, 320);
    }
    function msgHTML(m) {
      if (m[0] === "ai") return '<div class="msg out ai" data-label="' + esc(S.agent) + '">' + m[1] + "</div>";
      if (m[0] === "card") return '<div class="msg card in"><i class="thumb' + (m[4] ? " beige" : "") + '"></i><div><b>' + esc(m[1]) + "</b><small>" + esc(m[2]) + "</small>" + (m[3] ? '<div class="btns"><span>' + esc(m[3]) + "</span></div>" : "") + "</div></div>";
      if (m[0] === "sys") return '<div class="msg sys">' + (S.icons[m[2] || "ok"] || "") + esc(m[1]) + "</div>";
      return "";
    }
    function evHTML(e) { return '<div class="pg-ev">' + (S.icons[e[0]] || "") + "<span><i>داخل المحرك · </i>" + esc(e[1]) + "</span></div>"; }
    function setChips(list) {
      chips.innerHTML = "";
      (list || []).forEach(function (c, i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "pg-chip" + (i === 0 ? " primary" : ""); b.textContent = c[0];
        b.addEventListener("click", function () { if (c[1] === "__reset") reset(); else say(c[0], c[1]); }); chips.appendChild(b);
      });
    }
    function play(id, my) {
      var n = S.nodes[id]; if (!n) return; busy = true; setChips([]);
      var seq = [];
      (n.bot || []).forEach(function (m) { seq.push({ t: "typing" }); seq.push({ t: "msg", m: m }); });
      (n.ev || []).forEach(function (e) { seq.push({ t: "ev", e: e }); });
      var i = 0;
      (function step() {
        if (my !== run) return;
        if (i >= seq.length) {
          if (n.rev) { rev += n.rev; bump(mRev, rev); } if (n.time) { time += n.time; bump(mTime, time); }
          busy = false;
          if (n.end) { add('<div class="pg-done"><b>' + esc(n.end) + '</b><span>جرّب مسار ثاني أو اكتب سؤالك</span></div>'); setChips(S.restart || []); }
          else setChips(n.ch);
          return;
        }
        var s = seq[i++];
        if (s.t === "typing") { add('<div class="typing" aria-hidden="true"><i></i><i></i><i></i></div>'); setTimeout(function () { if (my !== run) return; var ty = stage.querySelector(".typing"); if (ty) ty.remove(); step(); }, 650 * D); }
        else if (s.t === "msg") { add(msgHTML(s.m)); setTimeout(step, 380 * D); }
        else { add(evHTML(s.e)); setTimeout(step, 420 * D); }
      })();
    }
    function say(text, next) {
      if (busy) return;
      add('<div class="msg in">' + (S.chIcon ? '<span class="chi">' + S.chIcon + "</span>" : "") + esc(text) + "</div>");
      var my = run; setTimeout(function () { play(next, my); }, 250 * D);
    }
    function match(text) {
      var t = text.replace(/[؟?!.،]/g, " ");
      for (var i = 0; i < (S.kw || []).length; i++) { var k = S.kw[i]; for (var j = 0; j < k[0].length; j++) if (t.indexOf(k[0][j]) > -1) return k[1]; }
      return S.fallback;
    }
    function reset() { run++; rev = 0; time = 0; stage.innerHTML = ""; if (mRev) { mRev.setAttribute("data-v", 0); mRev.textContent = "0"; } if (mTime) { mTime.setAttribute("data-v", 0); mTime.textContent = "0"; } busy = false; play(S.start, run); }
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); var v = (input.value || "").trim(); if (!v || busy) return; input.value = ""; say(v, match(v)); });
    var rb = pg.querySelector(".pg-reset"); if (rb) rb.addEventListener("click", reset);
    function start() { if (started) return; started = true; play(S.start, run); }
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { start(); io.disconnect(); } }, { threshold: .3 }); io.observe(pg); } else start();
  });
})();

/* Integrations orbit: logos join the orbit one by one */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  Array.prototype.forEach.call(document.querySelectorAll("[data-orbit]"), function (o) {
    var items = o.querySelectorAll(".orbit-item"), cap = o.parentNode.querySelector(".orbit-cap"), nEl = cap && cap.querySelector(".n"), nameEl = cap && cap.querySelector("[data-name]");
    if (reduce) { Array.prototype.forEach.call(items, function (it) { it.classList.add("on"); }); if (nEl) nEl.textContent = items.length; return; }
    var i = 0, vis = false, timer;
    function tick() {
      if (!vis) return;
      if (i < items.length) {
        var it = items[i], im = it.querySelector("img"); if (im && !im.complete) return; it.classList.add("on", "flash"); setTimeout(function () { it.classList.remove("flash"); }, 700);
        o.classList.remove("pulse"); void o.offsetWidth; o.classList.add("pulse");
        if (nameEl) nameEl.textContent = it.getAttribute("data-name"); if (nEl) nEl.textContent = i + 1; i++;
      } else { clearInterval(timer); if (nameEl) nameEl.textContent = "كل أدواتك"; }
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(o); else vis = true;
    timer = setInterval(tick, 420);
  });
})();

/* Live AI voice-call demo: phone → OTP (WhatsApp via Social Lab) → outbound AI call (ElevenLabs).
   Backend contract (see voice-demo-server):
     POST {api}/otp/send   {country, phone}        → {ok, masked, resend_in}
     POST {api}/otp/verify {phone_e164, code}       → {ok, token}
     POST {api}/call       {token}                  → {ok, seconds, from}
   Errors: {ok:false, error:"rate_limited"|"invalid_phone"|"bad_code"|"expired"|"busy"|"server", retry_after?}
   With no data-api the widget runs in preview mode (no SMS, no call). */
(function () {
  var root = document.querySelector("[data-voice]"); if (!root) return;
  var api = (root.getAttribute("data-api") || "").replace(/\/$/, ""), preview = !api;
  var SECS = +root.getAttribute("data-seconds") || 180, LIMIT = +root.getAttribute("data-limit") || 2;
  var vw = root.querySelector(".vw"), cc = JSON.parse(root.querySelector(".vw-cc").textContent);
  var all = cc.gcc.concat(cc.rest), cur = cc.gcc[0], phoneE164 = "", token = "";
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var steps = { phone: $(".vw-phone"), otp: $(".vw-otp"), call: $(".vw-call") };
  if (preview) $(".vw-preview").hidden = false;
  var MSG = { rate_limited: "وصلت الحد: " + LIMIT + " مكالمات كل 24 ساعة. جرّب بعدين 🙏", invalid_phone: "تأكد من رقم الجوال.", bad_code: "الرمز غير صحيح، جرّب مرة ثانية.",
    expired: "انتهت صلاحية الرمز، أرسلنا لك رمز جديد؟ اضغط إعادة الإرسال.", busy: "الخطوط مشغولة الحين، جرّب بعد دقيقة.", server: "صار خطأ بسيط، جرّب مرة ثانية." };
  function show(name) { Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== name; }); vw.setAttribute("data-state", name); }
  function err(step, code) { var e = $(".vw-err", steps[step]); e.textContent = code ? (MSG[code] || MSG.server) : ""; e.hidden = !code; }
  function busy(step, on) { var b = $(".vw-go", steps[step]); if (b) { b.disabled = on; b.style.opacity = on ? .7 : 1; } }
  function post(path, body) {
    if (preview) return new Promise(function (res) { setTimeout(function () { res(fake(path, body)); }, 700); });
    return fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "omit" })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "server" }; }); })
      .catch(function () { return { ok: false, error: "server" }; });
  }
  function fake(path, b) {
    if (path === "/otp/send") return { ok: true, masked: "+" + cur[2] + " •••• " + b.phone.slice(-3), resend_in: 60 };
    if (path === "/otp/verify") return /^\d{4}$/.test(b.code) ? { ok: true, token: "preview" } : { ok: false, error: "bad_code" };
    return { ok: true, seconds: SECS };
  }
  /* --- country picker --- */
  var btn = $(".cc-btn"), pop = $(".cc-pop"), list = $(".cc-list"), q = $(".cc-search input");
  function opt(r) { return '<li role="option" data-iso="' + r[0] + '" aria-selected="' + (r[0] === cur[0]) + '"><span>' + r[4] + "</span><span>" + r[1] + "</span><small>+" + r[2] + "</small></li>"; }
  function render(term) {
    term = (term || "").trim().toLowerCase().replace(/^\+/, "");
    var m = function (r) { return !term || r[1].indexOf(term) > -1 || r[3].toLowerCase().indexOf(term) > -1 || String(r[2]).indexOf(term) === 0; };
    var g = cc.gcc.filter(m), o = cc.rest.filter(m), h = "";
    if (g.length) h += '<li class="grp" role="presentation">دول الخليج</li>' + g.map(opt).join("");
    if (g.length && o.length) h += '<li class="sep" role="presentation"></li>';
    if (o.length) h += (term ? "" : '<li class="grp" role="presentation">كل الدول</li>') + o.map(opt).join("");
    list.innerHTML = h || '<li class="none">ما لقينا دولة بهالاسم</li>';
  }
  function toggle(open) { pop.hidden = !open; btn.setAttribute("aria-expanded", open); if (open) { q.value = ""; render(); setTimeout(function () { q.focus(); }, 30); } }
  btn.addEventListener("click", function () { toggle(pop.hidden); });
  q.addEventListener("input", function () { render(q.value); });
  q.addEventListener("keydown", function (e) { if (e.key === "Escape") { toggle(false); btn.focus(); } if (e.key === "Enter") { e.preventDefault(); var f = list.querySelector("[role=option]"); if (f) f.click(); } });
  list.addEventListener("click", function (e) {
    var li = e.target.closest("[role=option]"); if (!li) return;
    cur = all.filter(function (r) { return r[0] === li.getAttribute("data-iso"); })[0];
    $(".cc-flag").textContent = cur[4]; $(".cc-dial").textContent = "+" + cur[2];
    $(".vw-tel").placeholder = cur[0] === "SA" ? "5X XXX XXXX" : "رقم الجوال"; toggle(false); $(".vw-tel").focus();
  });
  document.addEventListener("click", function (e) { if (!pop.hidden && !e.target.closest(".cc")) toggle(false); });
  /* --- step 1: phone --- */
  var tel = $(".vw-tel");
  tel.addEventListener("input", function () { tel.value = tel.value.replace(/[^\d\s]/g, ""); err("phone"); });
  var resendT;
  function startResend(s) {
    var b = $(".vw-resend"), sp = b.querySelector("span"); b.disabled = true; clearInterval(resendT);
    resendT = setInterval(function () { s--; sp.textContent = s > 0 ? "(" + s + ")" : ""; if (s <= 0) { clearInterval(resendT); b.disabled = false; } }, 1000); sp.textContent = "(" + s + ")";
  }
  function sendOtp() {
    var digits = tel.value.replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 6 || digits.length > 13) { err("phone", "invalid_phone"); return; }
    if (cur[0] === "SA" && !/^5\d{8}$/.test(digits)) { err("phone", "invalid_phone"); return; }
    busy("phone", true);
    post("/otp/send", { country: cur[0], phone: digits }).then(function (r) {
      busy("phone", false);
      if (!r.ok) { err("phone", r.error); return; }
      phoneE164 = "+" + cur[2] + digits; $(".vw-num").textContent = r.masked || phoneE164;
      show("otp"); err("otp"); otps.forEach(function (i) { i.value = ""; }); otps[0].focus(); startResend(r.resend_in || 60);
    });
  }
  steps.phone.addEventListener("submit", function (e) { e.preventDefault(); sendOtp(); });
  /* --- step 2: OTP --- */
  var otps = Array.prototype.slice.call(root.querySelectorAll(".otp input"));
  otps.forEach(function (inp, i) {
    inp.addEventListener("input", function () {
      var v = inp.value.replace(/\D/g, "");
      if (v.length > 1) { v.split("").slice(0, 4 - i).forEach(function (d, k) { otps[i + k].value = d; }); (otps[Math.min(3, i + v.length)]).focus(); }
      else { inp.value = v; if (v && i < 3) otps[i + 1].focus(); }
      if (otps.every(function (x) { return x.value; })) verify();
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !inp.value && i) otps[i - 1].focus(); });
  });
  function verify() {
    var code = otps.map(function (x) { return x.value; }).join(""); if (code.length < 4) return;
    busy("otp", true); err("otp");
    post("/otp/verify", { phone_e164: phoneE164, code: code }).then(function (r) {
      if (!r.ok) { busy("otp", false); err("otp", r.error); otps.forEach(function (x) { x.value = ""; }); otps[0].focus(); return; }
      token = r.token; return post("/call", { token: token }).then(function (c) {
        busy("otp", false);
        if (!c.ok) { err("otp", c.error); return; }
        startCall(c.seconds || SECS);
      });
    });
  }
  steps.otp.addEventListener("submit", function (e) { e.preventDefault(); verify(); });
  $(".vw-resend").addEventListener("click", function () { show("phone"); sendOtp(); });
  $(".vw-back").addEventListener("click", function () { clearInterval(resendT); show("phone"); tel.focus(); });
  /* --- step 3: live call --- */
  var callT;
  function startCall(s) {
    show("call"); root.setAttribute("data-live", ""); var t = $(".vw-timer"), ct = $(".vw-ct"), cs = $(".vw-cs"), left = s, ringing = 12;
    ct.textContent = "جوالك بيرن الحين…"; cs.textContent = preview ? "في النسخة النهائية يتصل عليك الوكيل فعلياً" : "رد على المكالمة وابدأ تكلم الوكيل";
    var fmt = function (n) { return ("0" + Math.floor(n / 60)).slice(-2) + ":" + ("0" + n % 60).slice(-2); }; t.textContent = fmt(left);
    clearInterval(callT); callT = setInterval(function () {
      if (ringing > 0) { ringing--; if (!ringing) { ct.textContent = "المكالمة شغالة 🎧"; cs.textContent = "اسأله عن سوشل لاب، الأسعار، أو كيف يخدم نشاطك"; } return; }
      left--; t.textContent = fmt(Math.max(0, left));
      if (left <= 0) { clearInterval(callT); root.removeAttribute("data-live"); ct.textContent = "انتهت المكالمة، وش رأيك؟"; cs.textContent = "تقدر تشغّل نفس الوكيل لعملائك اليوم."; }
    }, 1000);
  }
  $(".vw-again").addEventListener("click", function () { clearInterval(callT); root.removeAttribute("data-live"); tel.value = ""; show("phone"); tel.focus(); });
})();

/* Contact speed-dial: one circle → WhatsApp, booking, live chat */
(function () {
  var fab = document.querySelector("[data-fab]"); if (!fab) return;
  var btn = fab.querySelector(".fab-main");
  function set(open) { fab.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); }
  btn.addEventListener("click", function (e) { e.stopPropagation(); set(!fab.classList.contains("open")); });
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-fab]")) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  // Live chat: hand off to the Social Lab website widget once it is installed (window.SocialLabChat.open()).
  fab.querySelector("[data-chat]").addEventListener("click", function () {
    set(false);
    if (window.SocialLabChat && typeof window.SocialLabChat.open === "function") { window.SocialLabChat.open(); return; }
    document.dispatchEvent(new CustomEvent("sociallab:chat-open"));
    if (!window.SocialLabChat) window.open(fab.querySelector('a[href*="wa.me"]').href, "_blank", "noopener"); // fallback until the widget is wired
  });
})();
