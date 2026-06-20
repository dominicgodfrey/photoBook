/* =============================================================================
 *  gallery.js — the "See All" view: a thumbnail grid of every photo (book
 *  order) plus a "Download All" button that zips the originals.
 *  Tapping a thumbnail opens the shared lightbox.
 * ===========================================================================*/
import { downloadAll } from "./download.js";

export function createGallery({ photos, onPhotoClick }) {
  const grid = document.getElementById("gallery-grid");
  const dlBtn = document.getElementById("download-all");

  // ---- Build the thumbnail grid ----
  const frag = document.createDocumentFragment();
  photos.forEach((p) => {
    const fig = document.createElement("figure");
    fig.className = "thumb";
    fig.tabIndex = 0;
    fig.setAttribute("role", "button");
    fig.setAttribute("aria-label", p.caption || `Photo ${p.index + 1}`);

    const img = document.createElement("img");
    img.src = p.src;
    img.loading = "lazy";
    img.alt = p.caption || `Photo ${p.index + 1}`;
    img.draggable = false;
    fig.appendChild(img);

    if (p.caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = p.caption;
      fig.appendChild(cap);
    }

    const open = () => onPhotoClick(p.index);
    fig.addEventListener("click", open);
    fig.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
    frag.appendChild(fig);
  });
  grid.appendChild(frag);

  // ---- Download All ----
  let busy = false;
  const defaultLabel = dlBtn.textContent;
  dlBtn.addEventListener("click", async () => {
    if (busy || !photos.length) return;
    busy = true;
    dlBtn.disabled = true;
    try {
      await downloadAll(photos, (done, total) => {
        dlBtn.textContent = `zipping ${done}/${total}…`;
      });
      dlBtn.textContent = "✓ downloaded";
    } catch {
      dlBtn.textContent = "download failed";
    } finally {
      setTimeout(() => {
        dlBtn.textContent = defaultLabel;
        dlBtn.disabled = false;
        busy = false;
      }, 2200);
    }
  });
}
