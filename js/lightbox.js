/* =============================================================================
 *  lightbox.js — the shared enlarged-photo view.
 *  Used both when a photo is tapped in the book and from the gallery.
 *  Shows the photo full-size with a caption, prev/next, a download button,
 *  and a visible ✕ to close (also Esc / backdrop click).
 * ===========================================================================*/
import { downloadOne } from "./download.js";

export function createLightbox({ photos }) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  const cap = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");
  const dlBtn = document.getElementById("lightbox-download");

  let i = 0;
  let lastFocus = null;

  function render() {
    const p = photos[i];
    img.src = p.src;
    img.alt = p.caption || `Photo ${i + 1}`;
    cap.textContent = p.caption || "";
    cap.style.visibility = p.caption ? "visible" : "hidden";
    prevBtn.disabled = i <= 0;
    nextBtn.disabled = i >= photos.length - 1;
  }

  function open(index) {
    if (!photos.length) return;
    lastFocus = document.activeElement;
    i = Math.max(0, Math.min(photos.length - 1, index));
    render();
    lb.hidden = false;
    document.body.classList.add("lightbox-open");
    closeBtn.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function go(delta) {
    const n = i + delta;
    if (n >= 0 && n < photos.length) {
      i = n;
      render();
    }
  }

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));
  dlBtn.addEventListener("click", () => downloadOne(photos[i].src));
  lb.addEventListener("click", (e) => {
    if (e.target === lb) close(); // click the dark backdrop
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  });

  return { open, close };
}
