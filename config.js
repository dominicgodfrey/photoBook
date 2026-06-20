/* =============================================================================
 *  PHOTOBOOK CONFIG  —  this is the ONLY file you need to edit to make it yours.
 * =============================================================================
 *
 *  HOW TO REUSE THIS PROJECT WITH YOUR OWN PHOTOS:
 *
 *    1. Drop your image files into the  /photos  folder.
 *    2. For each photo, add one line to the `photos` array below:
 *           { file: "your-photo.jpg", caption: "Whatever you want to say" }
 *       (caption can be left as "" for no caption — the page just shows the photo.)
 *    3. Edit the cover text, the note, and the back-cover text below.
 *    4. Save, commit, push. Done — no build step, no tools required.
 *
 *  The photos appear in the book in the exact order you list them here.
 * ---------------------------------------------------------------------------*/

const PHOTOBOOK_CONFIG = {

  /* ---- Browser tab title + favicon ------------------------------------- */
  site: {
    title: "Happy Father's Day 2026",          // shown in the browser tab
    favicon: "assets/favicon.svg",             // small icon for the tab
  },

  /* ---- The front cover (gold-foil text on the leather cover) ------------ */
  cover: {
    title: "Happy Father's Day",               // the big line
    year: "2026",                              // the small line beneath
    subtitle: "",                              // optional dedication, e.g. "To Dad" ("" = hidden)
  },

  /* ---- The note on the opening left-hand page --------------------------- *
   *  This is the heartfelt letter shown before the cover is opened.
   *  EDIT ME — replace the placeholder text below with your own words.
   * ---------------------------------------------------------------------- */
  note: {
    greeting: "Dear Dad,",
    body:
      "EDIT ME — Replace this with your own message. Write whatever is in your " +
      "heart: a favourite memory, a thank-you, an inside joke. The pages that " +
      "follow are a few of the moments I never want either of us to forget. " +
      "Turn the cover when you're ready.",
    signature: "With love,\nYour kid",
  },

  /* ---- The back cover (shown when the book is fully closed at the end) --- */
  backCover: {
    text: "The End.",                          // optional closing words ("" = hidden)
  },

  /* ---- The photos (book order). Add/remove freely. --------------------- *
   *  `file` is just the filename inside the /photos folder.
   *  These sample SVGs ship with the project so it runs immediately.
   *  Replace them with your real photos and update the captions.
   * ---------------------------------------------------------------------- */
  photosFolder: "photos",                      // where the images live

  photos: [
    { file: "sample-01.svg", caption: "Where it all began." },
    { file: "sample-02.svg", caption: "Sunday mornings." },
    { file: "sample-03.svg", caption: "" },
    { file: "sample-04.svg", caption: "That summer by the lake." },
    { file: "sample-05.svg", caption: "Teaching me everything." },
    { file: "sample-06.svg", caption: "The big game." },
    { file: "sample-07.svg", caption: "" },
    { file: "sample-08.svg", caption: "Always there." },
  ],
};

export default PHOTOBOOK_CONFIG;
