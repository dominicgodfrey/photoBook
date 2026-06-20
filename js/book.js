/* =============================================================================
 *  book.js — the page-flip engine.
 *
 *  Model (see README / spec):
 *    - Start state: NOTE on the left surface, COVER on the right (a leaf).
 *    - Flipping a leaf turns it right -> left (rigid CSS rotateY on the spine).
 *    - Open spreads show TWO photos at once (left page + right page).
 *    - End state: BACK COVER on the left, SEE ALL on the right surface.
 *
 *  Leaves are computed from config:
 *    faces = [COVER, photo0, photo1, ..., (BLANK if odd), BACKCOVER]
 *    leaf[i] = { front: faces[2i], back: faces[2i+1] }
 *
 *  Spread state `k` = number of flipped leaves (0..N):
 *    left  = k===0 ? NOTE      : leaf[k-1].back
 *    right = k===N ? SEE ALL   : leaf[k].front
 *
 *  Responsive: `double` mode renders the spread; `single` mode renders one
 *  page at a time. They share a position so resizing keeps your place:
 *    single linear pages = [NOTE, ...faces, SEEALL]; page index s = 2k + side.
 * ===========================================================================*/

const FLIP_MS = 720; // keep in sync with CSS --flip-ms

/* ---- Face/page builders --------------------------------------------------- */

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function multiline(s) {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

/** Build the renderable page element for a face descriptor. */
function renderPage(face, cfg) {
  switch (face.type) {
    case "note": {
      const p = el("div", "page page-note");
      const note = cfg.note || {};
      p.innerHTML = `
        <div class="note-inner">
          ${note.greeting ? `<p class="note-greeting">${escapeHtml(note.greeting)}</p>` : ""}
          ${note.body ? `<p class="note-body">${multiline(note.body)}</p>` : ""}
          ${note.signature ? `<p class="note-signature">${multiline(note.signature)}</p>` : ""}
        </div>`;
      return p;
    }
    case "cover": {
      const p = el("div", "page page-cover");
      const c = cfg.cover || {};
      p.innerHTML = `
        <div class="cover-frame">
          <div class="cover-inner">
            ${c.title ? `<h1 class="cover-title">${escapeHtml(c.title)}</h1>` : ""}
            ${c.subtitle ? `<p class="cover-subtitle">${escapeHtml(c.subtitle)}</p>` : ""}
            ${c.year ? `<p class="cover-year">${escapeHtml(c.year)}</p>` : ""}
          </div>
          <span class="open-hint" aria-hidden="true">turn the cover →</span>
        </div>`;
      return p;
    }
    case "backcover": {
      const p = el("div", "page page-cover page-backcover");
      const t = cfg.backCover?.text || "";
      p.innerHTML = `
        <div class="cover-frame">
          <div class="cover-inner">
            ${t ? `<p class="backcover-text">${escapeHtml(t)}</p>` : ""}
          </div>
        </div>`;
      return p;
    }
    case "blank": {
      const p = el("div", "page page-blank");
      p.innerHTML = `<span class="blank-flourish" aria-hidden="true">❧</span>`;
      return p;
    }
    case "photo": {
      const p = el("div", "page page-photo");
      const figure = el("figure", "photo-figure");
      const img = el("img", "photo-img");
      img.src = face.src;
      img.alt = face.caption || `Photo ${face.photoIndex + 1}`;
      img.loading = "lazy";
      img.draggable = false;
      figure.appendChild(img);
      if (face.caption) {
        const cap = el("figcaption", "photo-caption", escapeHtml(face.caption));
        figure.appendChild(cap);
      }
      p.appendChild(figure);
      p.dataset.photoIndex = String(face.photoIndex);
      return p;
    }
    case "seeall": {
      const p = el("div", "page page-seeall");
      p.innerHTML = `
        <div class="seeall-inner">
          <p class="seeall-kicker">that's the book</p>
          <button class="seeall-btn" type="button">See All Photos</button>
        </div>`;
      return p;
    }
    default:
      return el("div", "page");
  }
}

/* ---- The book factory ----------------------------------------------------- */

export function createBook({ config, mountEl, onChange, onPhotoClick, onSeeAll }) {
  const folder = (config.photosFolder || "photos").replace(/\/$/, "");
  const srcFor = (file) => `${folder}/${file}`;

  // Photos list (used by gallery + lightbox too).
  const photos = (config.photos || []).map((p, i) => ({
    index: i,
    src: srcFor(p.file),
    caption: p.caption || "",
  }));

  // ---- Build faces ----
  const faces = [{ type: "cover" }];
  photos.forEach((ph) =>
    faces.push({ type: "photo", photoIndex: ph.index, src: ph.src, caption: ph.caption })
  );
  if (photos.length % 2 === 1) faces.push({ type: "blank" }); // keep pairs even
  faces.push({ type: "backcover" });

  // Linear single-page list: [NOTE, ...faces, SEEALL]
  const linear = [{ type: "note" }, ...faces, { type: "seeall" }];

  // Leaves
  const leaves = [];
  for (let i = 0; i < faces.length; i += 2) {
    leaves.push({ front: faces[i], back: faces[i + 1] });
  }
  const N = leaves.length; // number of leaves; spread states are 0..N

  // ---- State ----
  let mode = "double";
  let k = 0;        // flipped-leaf count (double); also derived for single
  let side = 0;     // 0=left page, 1=right page (single mode only)
  let animating = false;

  function isWide() {
    return (
      window.matchMedia("(orientation: landscape)").matches ||
      window.innerWidth >= 820
    );
  }

  function emitChange() {
    onChange?.({
      k,
      N,
      mode,
      atStart: k === 0 && (mode === "double" || side === 0),
      atEnd: k === N && (mode === "double" || side === 1 || linearIndex() >= linear.length - 1),
      total: N,
      linearIndex: linearIndex(),
      linearTotal: linear.length,
      label: stateLabel(),
    });
  }

  function linearIndex() {
    return Math.min(2 * k + side, linear.length - 1);
  }

  function stateLabel() {
    if (k === 0 && side === 0) return "Cover";
    if (k === N) return "The End";
    return `Spread ${k} / ${N - 1}`;
  }

  /** Image src that best previews spread state `target` (for the slider). */
  function previewSrc(target) {
    const right = target < N ? leaves[target].front : null;
    const left = target > 0 ? leaves[target - 1].back : null;
    const pick = [right, left].find((f) => f && f.type === "photo");
    return pick ? pick.src : null;
  }

  /* ---- Wiring helpers for rendered pages ---- */
  function wirePage(pageEl) {
    if (pageEl.classList.contains("page-photo")) {
      pageEl.addEventListener("click", () => {
        const idx = Number(pageEl.dataset.photoIndex);
        if (!Number.isNaN(idx)) onPhotoClick?.(idx);
      });
    }
    const seeBtn = pageEl.querySelector(".seeall-btn");
    if (seeBtn) seeBtn.addEventListener("click", () => onSeeAll?.());
  }

  function makePage(face) {
    const p = renderPage(face, config);
    wirePage(p);
    return p;
  }

  /* =========================== DOUBLE (spread) =========================== */

  let leafEls = [];

  function buildDouble() {
    mountEl.innerHTML = "";
    mountEl.className = "book book-double";
    leafEls = [];

    // Static surfaces (behind the leaves)
    const noteSurface = el("div", "surface surface-left");
    noteSurface.appendChild(makePage(linear[0])); // NOTE
    const seeallSurface = el("div", "surface surface-right");
    seeallSurface.appendChild(makePage(linear[linear.length - 1])); // SEE ALL
    mountEl.appendChild(noteSurface);
    mountEl.appendChild(seeallSurface);

    // Leaves
    leaves.forEach((leaf, i) => {
      const leafEl = el("div", "leaf");
      const front = el("div", "leaf-face leaf-front");
      front.appendChild(makePage(leaf.front));
      const back = el("div", "leaf-face leaf-back");
      back.appendChild(makePage(leaf.back));
      leafEl.appendChild(front);
      leafEl.appendChild(back);
      mountEl.appendChild(leafEl);
      leafEls.push(leafEl);
    });

    applyLeafStates(true);
  }

  function applyLeafStates(instant) {
    leafEls.forEach((leafEl, i) => {
      const flipped = i < k;
      leafEl.classList.toggle("no-anim", !!instant);
      leafEl.classList.toggle("flipped", flipped);
      leafEl.style.zIndex = String(flipped ? i + 1 : N - i);
    });
    if (instant) {
      // force reflow then re-enable transitions
      void mountEl.offsetWidth;
      leafEls.forEach((l) => l.classList.remove("no-anim"));
    }
  }

  function flipDouble(forward) {
    if (animating) return;
    if (forward && k >= N) return;
    if (!forward && k <= 0) return;
    animating = true;

    const idx = forward ? k : k - 1;
    const leafEl = leafEls[idx];
    leafEl.style.zIndex = String(N + 5); // ride above during the turn
    leafEl.classList.toggle("flipped", forward);

    const done = () => {
      leafEl.removeEventListener("transitionend", onEnd);
      k += forward ? 1 : -1;
      side = forward ? 0 : 1; // keep single-mode position sensible
      applyLeafStates(false);
      animating = false;
      emitChange();
    };
    let fired = false;
    const onEnd = (e) => {
      if (e.propertyName !== "transform" || fired) return;
      fired = true;
      done();
    };
    leafEl.addEventListener("transitionend", onEnd);
    // safety timeout in case transitionend is missed
    setTimeout(() => { if (!fired) { fired = true; done(); } }, FLIP_MS + 120);
  }

  function jumpDouble(targetK) {
    targetK = Math.max(0, Math.min(N, targetK));
    if (targetK === k) return;
    k = targetK;
    side = 0;
    applyLeafStates(true);
    emitChange();
  }

  /* =========================== SINGLE (one page) ========================= */

  let singleStack = null;
  let currentPageEl = null;

  function buildSingle() {
    mountEl.innerHTML = "";
    mountEl.className = "book book-single";
    singleStack = el("div", "single-stack");
    mountEl.appendChild(singleStack);
    currentPageEl = el("div", "single-page current");
    currentPageEl.appendChild(makePage(linear[linearIndex()]));
    singleStack.appendChild(currentPageEl);
    emitChange();
  }

  function flipSingle(forward) {
    if (animating) return;
    const s = linearIndex();
    const target = s + (forward ? 1 : -1);
    if (target < 0 || target > linear.length - 1) return;
    animating = true;

    const incoming = el("div", "single-page", "");
    incoming.appendChild(makePage(linear[target]));

    if (forward) {
      // next page sits beneath; current turns away to the left
      incoming.classList.add("beneath");
      singleStack.insertBefore(incoming, currentPageEl);
      void incoming.offsetWidth;
      currentPageEl.classList.add("turn-out");
    } else {
      // previous page sweeps in from the left, on top
      incoming.classList.add("turn-in-start", "on-top");
      singleStack.appendChild(incoming);
      void incoming.offsetWidth;
      incoming.classList.remove("turn-in-start");
      incoming.classList.add("turn-in");
    }

    const animEl = forward ? currentPageEl : incoming;
    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      animEl.removeEventListener("transitionend", onEnd);
      currentPageEl.remove();
      incoming.className = "single-page current";
      currentPageEl = incoming;
      // advance shared position
      k = Math.floor(target / 2);
      side = target % 2;
      animating = false;
      emitChange();
    };
    const onEnd = (e) => { if (e.propertyName === "transform") finish(); };
    animEl.addEventListener("transitionend", onEnd);
    setTimeout(finish, FLIP_MS + 120);
  }

  function jumpSingle(targetK) {
    targetK = Math.max(0, Math.min(N, targetK));
    k = targetK;
    side = 0;
    currentPageEl.remove();
    currentPageEl = el("div", "single-page current");
    currentPageEl.appendChild(makePage(linear[linearIndex()]));
    singleStack.appendChild(currentPageEl);
    emitChange();
  }

  /* =========================== Public surface =========================== */

  function build() {
    document.body.classList.toggle("mode-single", mode === "single");
    document.body.classList.toggle("mode-double", mode === "double");
    if (mode === "double") buildDouble();
    else buildSingle();
    emitChange();
  }

  function relayout() {
    const wanted = isWide() ? "double" : "single";
    if (wanted === mode) return;
    mode = wanted;
    // k/side already shared; rebuild in the new mode at the same place
    build();
  }

  function next() {
    if (mode === "double") flipDouble(true);
    else flipSingle(true);
  }
  function prev() {
    if (mode === "double") flipDouble(false);
    else flipSingle(false);
  }
  function goTo(targetK) {
    if (animating) return;
    if (mode === "double") jumpDouble(targetK);
    else jumpSingle(targetK);
  }

  // init
  mode = isWide() ? "double" : "single";
  build();

  let resizeTimer = null;
  const debouncedRelayout = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(relayout, 120);
  };
  window.addEventListener("resize", debouncedRelayout);
  window.addEventListener("orientationchange", relayout);

  return {
    next,
    prev,
    goTo,
    relayout,
    previewSrc,
    photos,
    get state() {
      return { k, N, mode, atStart: k === 0, atEnd: k === N, animating };
    },
  };
}
