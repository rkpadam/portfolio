# Romi Padam Portfolio

Static portfolio website for GitHub Pages.

## Local preview

```bash
python3 -m http.server 4173 --directory .
```

Then open `http://localhost:4173`.

## Files

- `index.html` - page structure and resume-based content
- `styles.css` - responsive visual system and mini robot styling
- `script.js` - interactive mini block builder and contact-form behavior
- `assets/config.js` - private contact endpoint placeholder
- `assets/config.sample.js` - copyable endpoint placeholder
- `google-apps-script/Code.gs` - optional private contact-form backend template

## Contact form setup

The public site does not publish an email address or phone number. To activate
the contact form, deploy a private backend endpoint and paste its URL into
`assets/config.js`:

```js
window.CONTACT_ENDPOINT_URL = "YOUR_DEPLOYED_WEB_APP_URL";
```

The included `google-apps-script/Code.gs` template validates name length, email
format, message length, honeypot input, and basic spam signals before routing a
message privately.

The current static-site form uses `mode: "no-cors"` so it can submit to a simple
Apps Script web app from GitHub Pages. That means the browser cannot read the
server response; a stronger future version should use a backend that returns a
proper success or failure response and can add Cloudflare Turnstile if spam
becomes a problem.

## Privacy note

The contact endpoint URL may be visible in the public site, but the recipient
email address should remain private inside the backend service only.

## Before publishing

- Confirm the final published URL in `index.html`
- Add the deployed contact endpoint to `assets/config.js`
- Confirm no Gmail address or phone number is committed
- Remove `__MACOSX/` and `.DS_Store` files
- Test the contact form from the live GitHub Pages URL
- Test mobile layout

## GitHub Pages

When ready, push this folder to a GitHub repository and enable Pages from the repository settings.
