/* =============================================================================
 *  main.js — entry point. Loads config, applies site settings, wires modules.
 * ===========================================================================*/
import CONFIG from "../config.js";
import { createBook } from "./book.js";
import { createControls } from "./controls.js";

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

  // ---- Controls + book (controls is created first so the book can report to it) ----
  let book;
  const controls = createControls({
    getBook: () => book,
    onSeeAll: showGallery,
    onBackToBook: showBook,
  });

  book = createBook({
    config: CONFIG,
    mountEl: $("book"),
    onChange: (s) => controls.update(s),
    onPhotoClick(/* index */) {
      // wired to the lightbox in a later commit
    },
    onSeeAll: showGallery,
  });
}

document.addEventListener("DOMContentLoaded", init);
