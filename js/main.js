/* =============================================================================
 *  main.js — entry point. Loads config, applies site settings, wires modules.
 * ===========================================================================*/
import CONFIG from "../config.js";
import { createBook } from "./book.js";

/** Apply tab title + favicon from config. */
function applySiteSettings() {
  if (CONFIG.site?.title) document.title = CONFIG.site.title;
  if (CONFIG.site?.favicon) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = CONFIG.site.favicon;
  }
}

function init() {
  applySiteSettings();

  const $ = (id) => document.getElementById(id);
  const bookView = $("book-view");
  const galleryView = $("gallery-view");
  const prevBtn = $("prev-btn");
  const nextBtn = $("next-btn");
  const slider = $("slider");
  const readout = $("slider-readout");

  // ---- View switching (gallery is fully built in a later commit) ----
  function showGallery() {
    bookView.hidden = true;
    galleryView.hidden = false;
  }
  function showBook() {
    galleryView.hidden = true;
    bookView.hidden = false;
    book.relayout();
  }

  // ---- The book ----
  const book = createBook({
    config: CONFIG,
    mountEl: $("book"),
    onChange(s) {
      prevBtn.disabled = s.atStart;
      nextBtn.disabled = s.atEnd;
      slider.min = "0";
      slider.max = String(s.N);
      slider.value = String(s.k);
      readout.textContent = s.label;
    },
    onPhotoClick(/* index */) {
      // wired to the lightbox in a later commit
    },
    onSeeAll: showGallery,
  });

  // ---- Basic navigation wiring (enhanced in the controls commit) ----
  prevBtn.addEventListener("click", () => book.prev());
  nextBtn.addEventListener("click", () => book.next());
  slider.addEventListener("input", () => book.goTo(Number(slider.value)));

  $("see-all-link").addEventListener("click", showGallery);
  $("back-to-book").addEventListener("click", showBook);
}

document.addEventListener("DOMContentLoaded", init);
