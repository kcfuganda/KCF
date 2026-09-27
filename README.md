# kcfuganda.org

Website of the Kamusenene Children's Foundation, hosted on GitHub Pages.

- `index.html`, `stories.html`: the pages
- `kcf.css`, `kcf.js`: shared styles and scripts (menu, photo viewer, stories, donation panel)
- `_stories/`: stories written by the KCF team in Pages CMS (https://app.pagescms.org)
- `stories.json`: built automatically by GitHub Pages from `_stories/`; the site reads it
- `.pages.yml`: the editor's settings (fields the team sees)
- `images/stories/`: photos uploaded through the editor
- `STORIES-GUIDE.md`: how-to for the team in Uganda
- `DONATIONS.md`: how the donation panel works, testing, and monthly giving

Donations are taken on the page itself through Flutterwave Inline Checkout.
The hosted page https://flutterwave.com/donate/1vkp00dchzjl is still used as a
fallback and for monthly gifts until payment plans are set up — see
`DONATIONS.md`.

## One rule that matters

The **public** Flutterwave keys in `kcf.js` are meant to be published; they
cannot move money on their own. The **secret** key must never be committed to
this repository, pasted into any file here, or sent in a message. If that ever
happens, revoke it in the Flutterwave dashboard immediately and issue a new one.
