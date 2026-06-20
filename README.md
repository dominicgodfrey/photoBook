# 📖 Photobook

A digital, page-flipping photo album with a vintage feel. It opens on a
handwritten **note** beside a leather **book cover**; flip the cover and turn
through **two-page spreads** of photos with captions, and at the end the book
"closes" to reveal a **See All** gallery where every photo can be viewed and
downloaded.

Built as a **plain static site — no build step, no framework.** Deploys to
Netlify (or any static host) by just serving the folder.

---

## ✨ Make it your own (no coding required)

Everything you can customize lives in **[`config.js`](config.js)**.

1. **Add your photos.** Drop your image files into the **`photos/`** folder.
2. **List them.** For each photo, add a line to the `photos` array in
   `config.js`:
   ```js
   { file: "my-photo.jpg", caption: "Whatever you want to say" }
   ```
   - Photos appear in the book in the order you list them.
   - Leave `caption: ""` for no caption.
   - Mixed portrait/landscape is fine — each photo is centered and never cropped.
3. **Edit the words.** In `config.js`, set:
   - `cover.title`, `cover.year`, optional `cover.subtitle`
   - `note` (the opening letter: `greeting`, `body`, `signature`)
   - `backCover.text` (optional closing words)
   - `site.title` (browser tab) and `site.favicon`
4. **Save.** That's it — no build, no tools.

> The project ships with sample placeholder photos so it runs immediately.
> Delete them from `photos/` and remove their lines from `config.js` when you
> add your own.

---

## ▶️ Run it locally

Because it uses ES modules and reads image files, open it through a tiny local
web server (not by double-clicking the HTML file):

```bash
# Python (already on most machines)
python -m http.server 8000
# then visit http://localhost:8000
```

```bash
# ...or Node
npx serve .
```

---

## 🚀 Deploy to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git →** pick this repo.
3. Build command: **(leave empty)**. Publish directory: **`.`** (repo root).
   (`netlify.toml` already sets this.)
4. Deploy. Share the URL.

---

## 🗂 Project structure

```
photoBook/
├── index.html        # markup shell
├── config.js         # ← the only file you edit to reuse this
├── css/styles.css    # vintage theme + layout
├── js/
│   ├── main.js       # entry point / wiring
│   ├── book.js       # page-flip engine + responsive spread/single layout
│   ├── lightbox.js   # shared enlarged-photo view
│   ├── gallery.js    # the "See All" grid
│   └── download.js   # per-photo + "download all" (zip)
├── photos/           # ← drop your images here
├── assets/favicon.svg
└── netlify.toml
```

---

## 📜 License

Use it, remix it, gift it. See [`LICENSE`](LICENSE).
