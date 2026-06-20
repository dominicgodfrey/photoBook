/* =============================================================================
 *  download.js — single-photo download + "Download All" as a zip.
 *  JSZip is loaded lazily from a CDN only when "Download All" is used, so the
 *  rest of the site has zero dependencies.
 * ===========================================================================*/

const JSZIP_CDN = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

function basename(url) {
  return decodeURIComponent(url.split("/").pop().split("?")[0]);
}

function triggerDownload(href, name) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(href), 1500);
}

/** Download a single image to the user's machine (keeps the original file). */
export async function downloadOne(url, filename) {
  const name = filename || basename(url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    triggerDownload(URL.createObjectURL(blob), name);
  } catch {
    // Fallback: let the browser fetch it directly via the anchor.
    triggerDownload(url, name);
  }
}

let jszipPromise = null;
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = JSZIP_CDN;
    s.onload = () => resolve(window.JSZip);
    s.onerror = () => reject(new Error("Could not load JSZip"));
    document.head.appendChild(s);
  });
  return jszipPromise;
}

/**
 * Bundle every photo into a single zip and download it.
 * @param {{src:string}[]} photos
 * @param {(done:number,total:number)=>void} [onProgress]
 */
export async function downloadAll(photos, onProgress) {
  const JSZip = await loadJSZip();
  const zip = new JSZip();
  let done = 0;
  const used = new Set();

  await Promise.all(
    photos.map(async (p, i) => {
      try {
        const res = await fetch(p.src);
        const blob = await res.blob();
        // Keep original names, prefixing order + de-duping collisions.
        let name = basename(p.src);
        const ordered = `${String(i + 1).padStart(2, "0")}_${name}`;
        let finalName = ordered;
        let n = 1;
        while (used.has(finalName)) finalName = `${ordered}_${n++}`;
        used.add(finalName);
        zip.file(finalName, blob);
      } catch {
        /* skip a photo that fails to fetch rather than abort the whole zip */
      } finally {
        onProgress?.(++done, photos.length);
      }
    })
  );

  const content = await zip.generateAsync({ type: "blob" });
  triggerDownload(URL.createObjectURL(content), "photobook-photos.zip");
}
