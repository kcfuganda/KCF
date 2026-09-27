# Donations on kcfuganda.org

Donors now give **on the page**. Choosing an amount and pressing *Donate* opens
a secure Flutterwave window on top of the site. Nobody leaves kcfuganda.org, and
KCF never sees or stores a card number — Flutterwave handles all of that.

Everything the donation panel needs lives in one block at the top of `kcf.js`,
marked `Flutterwave configuration`. You should not need to touch anything else.

---

## Testing without spending money

Add `?flwtest=1` to the address:

```
https://kcfuganda.org/?flwtest=1#donate
```

A yellow **Test mode** banner appears and the site switches to the Flutterwave
test key. You can complete a whole donation with a Flutterwave test card and no
real money moves. Remove `?flwtest=1` and the site is live again.

You do not have to edit any file to do this, and you cannot leave the live site
stuck in test mode by accident — the banner only appears for whoever has that
address in their browser bar.

Flutterwave's current test card numbers are on their site; search their docs for
"test cards". They change them from time to time, so use theirs rather than any
number written down here.

**Before you announce the new donation page, do one real donation of a small
amount with a real card**, check it appears in the Flutterwave dashboard, and
then refund it from there. A test card proves the code works; a real card proves
the account is configured to receive.

---

## Monthly giving

One-time gifts work now, in every currency.

Monthly gifts need a **payment plan** created in the Flutterwave dashboard, and
Flutterwave requires **one plan per currency**. Until a plan exists, choosing
*Monthly* sends the donor to the hosted Flutterwave page in a new tab — exactly
how the site behaved before. Nothing is broken; it just opens elsewhere.

To bring monthly giving onto the page:

1. Sign in at https://dashboard.flutterwave.com
2. Go to **Payments → Payment Plans** and create a plan.
   - Interval: **monthly**
   - Currency: the one you are creating the plan for
   - Leave the amount unset if Flutterwave allows it, so the donor's chosen
     amount is used. If it insists on an amount, create the plan anyway — see
     the note below.
3. Copy the plan's **ID** (a number, e.g. `112233`).
4. Open `kcf.js`, find `MONTHLY_PLANS`, and paste the ID between the quotes for
   that currency:

```js
MONTHLY_PLANS: { USD: '112233', GBP: '', EUR: '', UGX: '' }
```

5. Commit the change. That currency now takes monthly gifts on the page. Any
   currency left as `''` keeps using the hosted page.

**Note on plan amounts.** If a plan has a fixed amount, Flutterwave charges the
amount passed at checkout as the first payment, then the plan's amount every
month after. If that is not what you want, create the plan without a fixed
amount, or create a few fixed plans and tell donors which amounts are available
monthly. Worth a quick test with `?flwtest=1` before announcing it.

Recurring payments only work with **cards**. Mobile money cannot be charged
automatically each month — that is a Flutterwave limitation, not a site one.

---

## What the donor sees when something goes wrong

The panel is written so it never claims something that did not happen:

| Situation | What the donor sees |
|---|---|
| Payment succeeds | Thank-you message, button locks so nobody pays twice |
| Payment fails | "That payment did not complete. Nothing has been charged." |
| Donor closes the window | "Checkout closed. Nothing has been charged." |
| Ad blocker blocks Flutterwave | Explains it, then opens the hosted page in a new tab |
| No email entered | Asks for one, and explains the receipt goes there |

To give again, the donor changes the amount and the button comes back.

---

## Where the money actually is

**The Flutterwave dashboard is the record of truth, not the website.**

This is a static site with no server, which means the page cannot independently
verify a payment — that check needs the secret key, and the secret key must
never be on a public website. So the thank-you message reflects what Flutterwave
told the browser, and in theory a determined person could make their own browser
show a thank-you without paying.

That sounds worse than it is. Nothing is delivered in exchange for a donation,
so a faked thank-you gains nobody anything, and it cannot affect the money.
Every real payment lands in the Flutterwave dashboard whether or not the page
says so.

The practical rule: **reconcile from the dashboard.** If you thank donors or
report totals, take the figures from Flutterwave, not from the website.

If KCF later wants receipts sent from KCF itself, donation totals shown on the
site, or verified thank-you emails, that needs a small server-side piece — a
Flutterwave webhook and the secret key held somewhere private. That is a
separate job and is not needed for donations to work.

---

## Currencies

The panel offers USD, GBP, EUR and UGX, matching what the hosted page offered.
If Flutterwave rejects one of these for the KCF account, remove that button from
the `Currency` group in `index.html` and its row from `PRESETS` in `kcf.js`.

---

## If you ever need to undo this

Set the donate button back to a link:

```html
<a class="btn btn-forest" id="give-btn"
   href="https://flutterwave.com/donate/1vkp00dchzjl"
   target="_blank" rel="noopener">Continue to secure checkout</a>
```

The site keeps working; donors just leave the page again.
