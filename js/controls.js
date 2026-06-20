/* =============================================================================
 *  controls.js — all book navigation inputs:
 *    Prev/Next buttons, arrow keys, touch swipe, and the bottom slider
 *    (with an "X / Y" readout + a thumbnail preview on hover/drag).
 *
 *  Returns an `update(state)` function that createBook calls on every change.
 * ===========================================================================*/

export function createControls({ getBook, onSeeAll, onBackToBook }) {
  const $ = (id) => document.getElementById(id);
  const prevBtn = $("prev-btn");
  const nextBtn = $("next-btn");
  const slider = $("slider");
  const readout = $("slider-readout");
  const thumb = $("slider-thumb");
  const stage = $("stage");
  const bookView = $("book-view");
  const lightbox = $("lightbox");

  const bookActive = () => !bookView.hidden && lightbox.hidden;

  // ---- Buttons ----
  prevBtn.addEventListener("click", () => getBook()?.prev());
  nextBtn.addEventListener("click", () => getBook()?.next());

  // ---- Slider (jump) ----
  slider.addEventListener("input", () => getBook()?.goTo(Number(slider.value)));

  // ---- Slider thumbnail preview on hover/drag ----
  let thumbImg = thumb.querySelector("img");
  if (!thumbImg) {
    thumbImg = document.createElement("img");
    thumb.appendChild(thumbImg);
  }
  function showThumbAt(clientX) {
    const book = getBook();
    if (!book) return;
    const rect = slider.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const max = Number(slider.max) || 0;
    const target = Math.round(ratio * max);
    const src = book.previewSrc(target);
    if (!src) {
      thumb.hidden = true;
      return;
    }
    thumbImg.src = src;
    thumb.hidden = false;
    // position centered over the cursor, clamped to the slider track
    const wrapRect = thumb.parentElement.getBoundingClientRect();
    const x = Math.min(
      wrapRect.width - thumb.offsetWidth / 2,
      Math.max(thumb.offsetWidth / 2, clientX - wrapRect.left)
    );
    thumb.style.left = `${x}px`;
  }
  slider.addEventListener("mousemove", (e) => showThumbAt(e.clientX));
  slider.addEventListener("mouseleave", () => (thumb.hidden = true));
  slider.addEventListener("mousedown", (e) => showThumbAt(e.clientX));
  window.addEventListener("mouseup", () => (thumb.hidden = true));

  // ---- Keyboard ----
  document.addEventListener("keydown", (e) => {
    // Let the lightbox handle keys while it's open
    if (!lightbox.hidden) return;
    if (!bookView.hidden) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        getBook()?.next();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        getBook()?.prev();
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      onBackToBook?.(); // leave the gallery
    }
  });

  // ---- Touch swipe on the stage ----
  let sx = 0, sy = 0, tracking = false;
  const SWIPE = 45; // px
  stage.addEventListener(
    "touchstart",
    (e) => {
      if (!bookActive()) return;
      const t = e.changedTouches[0];
      sx = t.clientX; sy = t.clientY; tracking = true;
    },
    { passive: true }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) getBook()?.next(); // swipe left -> next
        else getBook()?.prev(); // swipe right -> prev
      }
    },
    { passive: true }
  );

  // ---- The always-visible bottom link + back-to-book ----
  $("see-all-link").addEventListener("click", () => onSeeAll?.());
  $("back-to-book").addEventListener("click", () => onBackToBook?.());

  // ---- Called by the book on every state change ----
  function update(s) {
    prevBtn.disabled = s.atStart;
    nextBtn.disabled = s.atEnd;
    slider.min = "0";
    slider.max = String(s.N);
    slider.value = String(s.k);
    readout.textContent = s.label;
  }

  return { update };
}
