(function () {
  // ---------- Settings you can change ----------
  const POPULAR = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Perplexity", "Midjourney", "Canva", "ElevenLabs", "Runway", "Cursor", "Lovable", "Suno"];
  const PAGE_SIZE = 32;
  const CAT_ICONS = {
    chat: "💬", research: "🔎", writing: "✍️", image: "🖼️", video: "🎬", audio: "🎙️", music: "🎵",
    design: "🎨", "3d": "🧊", slides: "📊", apps: "🧩", code: "💻", build: "⚙️", auto: "🤖",
    email: "📧", marketing: "📣", social: "📱", seo: "📈", sales: "🤝", support: "🎧", ecommerce: "🛍️",
    data: "📉", education: "🎓", careers: "💼", finance: "💰", legal: "⚖️", translation: "🌐",
    home: "🏠", travel: "✈️", lifestyle: "👗", access: "♿",
    productivity: "🗓️", learn: "📚", util: "🧰"
  };

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  };
  const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catName = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
  const hue = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const highlight = (text, term) => {
    const safe = esc(text);
    if (!term) return safe;
    const re = new RegExp("(" + esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  };
  const logoHTML = (t) => {
    const d = domainOf(t.url);
    return `<span class="logo" data-letter="${esc(t.name.charAt(0).toUpperCase())}" data-hue="${hue(t.name)}">
      <img src="https://www.google.com/s2/favicons?domain=${d}&sz=128" alt="" loading="lazy" width="30" height="30">
    </span>`;
  };
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.1 4.5c2 0 3.4 1.1 4.9 2.9 1.5-1.8 2.9-2.9 4.9-2.9 3.5 0 5.6 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';

  function wireLogos(root) {
    root.querySelectorAll(".logo img").forEach((img) => {
      const fail = () => {
        const box = img.parentElement;
        if (!box) return;
        box.classList.add("letter");
        box.style.background = `linear-gradient(135deg, hsl(${box.dataset.hue} 70% 55%), hsl(${(+box.dataset.hue + 40) % 360} 70% 45%))`;
        box.textContent = box.dataset.letter;
      };
      img.addEventListener("error", fail, { once: true });
      img.addEventListener("load", () => { if (img.naturalWidth && img.naturalWidth < 20) fail(); }, { once: true });
    });
  }

  const state = {
    q: "", cat: "all", price: "all", sort: "rec",
    savedOnly: false, shown: PAGE_SIZE,
    saved: new Set(store.get("saved", []))
  };

  const freeCount = TOOLS.filter((t) => t.price !== "paid").length;
  $("stat-tools").textContent = TOOLS.length;
  $("stat-cats").textContent = CATEGORIES.length;
  $("stat-free").textContent = freeCount;
  $("hero-total").textContent = TOOLS.length;

  function renderPopular() {
    const items = POPULAR.map((n) => TOOLS.find((t) => t.name === n)).filter(Boolean).slice(0, 8);
    $("popular-grid").innerHTML = items.map((t) => `
      <a class="pop-card" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">
        ${logoHTML(t)}
        <span><strong>${esc(t.name)}</strong><span class="d">${esc(t.desc)}</span></span>
      </a>`).join("");
    wireLogos($("popular-grid"));
  }

  function renderCategories() {
    $("cat-grid").innerHTML = CATEGORIES.map((c) => {
      const n = TOOLS.filter((t) => t.cat === c.id).length;
      return `<button class="cat-tile" type="button" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
        <span class="cat-emoji" aria-hidden="true">${CAT_ICONS[c.id] || "✨"}</span>
        <span><b>${esc(c.name)}</b><small>${n} tools</small></span>
      </button>`;
    }).join("");
    $("cat-select").innerHTML = `<option value="all">All categories</option>` +
      CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    $("cat-select").value = state.cat;
  }

  function renderPrices() {
    const opts = [["all", "Any price"]].concat(Object.entries(PRICES));
    $("prices").innerHTML = opts.map(([id, label]) =>
      `<button type="button" data-price="${id}" aria-pressed="${state.price === id}">${esc(label)}</button>`).join("");
  }

  function filtered() {
    const term = state.q.trim().toLowerCase();
    let list = TOOLS.filter((t) =>
      (state.cat === "all" || t.cat === state.cat) &&
      (state.price === "all" || t.price === state.price) &&
      (!state.savedOnly || state.saved.has(t.url)) &&
      (!term || (t.name + " " + t.desc + " " + domainOf(t.url) + " " + catName[t.cat]).toLowerCase().includes(term))
    );
    if (term) list = list.slice().sort((a, b) => (b.name.toLowerCase().includes(term)) - (a.name.toLowerCase().includes(term)));
    if (state.sort === "az") list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  function renderTools(animate) {
    const list = filtered();
    const term = state.q.trim();
    const visible = list.slice(0, state.shown);

    $("tool-grid").innerHTML = visible.map((t) => `
      <article class="card${animate ? " in" : ""}">
        <a class="card-link" href="${esc(t.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(t.name)}"></a>
        <div class="card-top">
          ${logoHTML(t)}
          <span class="badge price-${t.price}">${esc(PRICES[t.price])}</span>
        </div>
        <h3>${highlight(t.name, term)}</h3>
        <p>${highlight(t.desc, term)}</p>
        <div class="card-foot">
          <span class="card-cat">${esc(catName[t.cat])}</span>
          <button class="save" type="button" data-url="${esc(t.url)}" aria-pressed="${state.saved.has(t.url)}" aria-label="Save ${esc(t.name)}">${heart}</button>
        </div>
      </article>`).join("");
    wireLogos($("tool-grid"));

    let title = state.cat === "all" ? "All tools" : catName[state.cat];
    if (state.savedOnly) title = "Saved tools";
    $("dir-title").textContent = title;
    $("dir-sub").textContent = list.length
      ? `Showing ${visible.length} of ${list.length} tool${list.length === 1 ? "" : "s"}`
      : "No matches";
    $("empty").hidden = list.length > 0;
    $("empty-text").textContent = state.savedOnly && !state.saved.size
      ? "Tap the heart on any tool to save it here."
      : "Try a different word or clear your filters.";
    $("show-more").hidden = visible.length >= list.length;
    $("show-more").textContent = `Show more tools (${list.length - visible.length} left)`;
    renderActiveFilters();
  }

  function renderActiveFilters() {
    const x = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    const tags = [];
    if (state.q.trim()) tags.push(`<button class="tag-x" data-clear="q">“${esc(state.q.trim())}” ${x}</button>`);
    if (state.cat !== "all") tags.push(`<button class="tag-x" data-clear="cat">${esc(catName[state.cat])} ${x}</button>`);
    if (state.price !== "all") tags.push(`<button class="tag-x" data-clear="price">${esc(PRICES[state.price])} ${x}</button>`);
    if (state.savedOnly) tags.push(`<button class="tag-x" data-clear="saved">Saved only ${x}</button>`);
    $("active-filters").innerHTML = tags.join("");
  }

  function update(opts = {}) {
    state.shown = PAGE_SIZE;
    $("q").value = state.q;
    $("cat-select").value = state.cat;
    document.querySelectorAll(".cat-tile").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === state.cat));
    renderPrices();
    $("saved-toggle").setAttribute("aria-pressed", state.savedOnly);
    renderTools(true);
    if (opts.scroll) $("directory").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateSavedCount() { $("saved-count").textContent = state.saved.size; }

  $("hero-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = $("hero-q").value;
    update({ scroll: true });
  });
  document.querySelector(".quick").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-q]");
    if (!b) return;
    state.q = b.dataset.q;
    $("hero-q").value = b.dataset.q;
    state.cat = "all";
    update({ scroll: true });
  });

  let typing;
  $("q").addEventListener("input", () => {
    clearTimeout(typing);
    typing = setTimeout(() => { state.q = $("q").value; $("hero-q").value = state.q; state.shown = PAGE_SIZE; renderTools(false); }, 120);
  });
  $("cat-select").addEventListener("change", (e) => { state.cat = e.target.value; update(); });
  $("sort").addEventListener("change", (e) => { state.sort = e.target.value; update(); });
  $("prices").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-price]");
    if (!b) return;
    state.price = b.dataset.price;
    update();
  });
  $("cat-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile");
    if (!b) return;
    state.cat = state.cat === b.dataset.cat ? "all" : b.dataset.cat;
    update({ scroll: true });
  });
  $("active-filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-clear]");
    if (!b) return;
    const k = b.dataset.clear;
    if (k === "q") { state.q = ""; $("hero-q").value = ""; }
    if (k === "cat") state.cat = "all";
    if (k === "price") state.price = "all";
    if (k === "saved") state.savedOnly = false;
    update();
  });
  $("clear-all").addEventListener("click", () => {
    Object.assign(state, { q: "", cat: "all", price: "all", savedOnly: false });
    $("hero-q").value = "";
    update();
  });
  $("show-more").addEventListener("click", () => {
    const before = state.shown;
    state.shown += PAGE_SIZE;
    renderTools(false);
    const next = $("tool-grid").children[before];
    if (next) next.querySelector(".card-link").focus({ preventScroll: true });
  });

  $("tool-grid").addEventListener("click", (e) => {
    const b = e.target.closest(".save");
    if (!b) return;
    const url = b.dataset.url;
    if (state.saved.has(url)) state.saved.delete(url); else state.saved.add(url);
    store.set("saved", [...state.saved]);
    b.setAttribute("aria-pressed", state.saved.has(url));
    updateSavedCount();
    if (state.savedOnly) renderTools(false);
  });
  $("saved-toggle").addEventListener("click", () => {
    state.savedOnly = !state.savedOnly;
    update({ scroll: true });
  });

  $("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });

  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || "";
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag)) {
      e.preventDefault();
      $("directory").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => $("q").focus({ preventScroll: true }), 300);
    }
    if (e.key === "Escape" && document.activeElement === $("q") && state.q) {
      state.q = ""; $("hero-q").value = ""; update();
    }
  });

  const nav = document.querySelector(".nav");
  const toolbar = $("toolbar");
  const toTop = $("to-top");
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 8);
    const r = toolbar.getBoundingClientRect();
    const stickTop = parseFloat(getComputedStyle(toolbar).top) || 0;
    toolbar.classList.toggle("stuck", r.top <= stickTop + 1 && y > 300);
    toTop.hidden = y < 900;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  renderPopular();
  renderCategories();
  renderPrices();
  updateSavedCount();
  renderTools(false);
  onScroll();
})();