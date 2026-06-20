/* =============================================================================
 *  main.js — entry point. Loads config, applies site settings, wires modules.
 * ===========================================================================*/
import CONFIG from "../config.js";

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
  // Feature modules (flip engine, gallery, lightbox, download) are wired here
  // in later commits.
  console.info("Photobook scaffold loaded.");
}

document.addEventListener("DOMContentLoaded", init);
