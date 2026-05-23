# Romi Padam Portfolio

Static portfolio website for GitHub Pages.

Live site:

```text
https://rkpadam.github.io/portfolio/
```

The site is intentionally static so it can be hosted directly on GitHub Pages.
It includes a responsive portfolio layout, a small interactive block-builder
robot, social links, and a privacy-conscious contact form.

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

The public site does not publish an email address or phone number.

Current behavior:

- Required fields: name, email, and message
- Empty messages show `Please add a message.`
- Short real messages such as `Hi` pass validation
- Until a backend endpoint is configured, the form shows:
  `Please connect with me on LinkedIn for now.`

To activate real message delivery, deploy a private backend endpoint and paste
its URL into `assets/config.js`:

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

## GitHub Pages

This repository is configured for the default GitHub Pages project URL:

```text
https://rkpadam.github.io/portfolio/
```

In GitHub, enable Pages from:

```text
Repository Settings -> Pages
```

Use:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ root`

Do not set a custom domain unless the domain has been purchased and DNS is
configured.

## Custom domain later

`romipadam.com` is not currently registered. After purchasing it, add GitHub
Pages DNS records at the domain registrar:

```text
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   rkpadam.github.io
```

Then add a `CNAME` file to this repository containing:

```text
romipadam.com
```

Finally, set `romipadam.com` in GitHub Pages settings and enable HTTPS when
GitHub allows it.

## Before publishing updates

- Confirm the final published URL in `index.html`
- Add the deployed contact endpoint to `assets/config.js`
- Confirm no Gmail address or phone number is committed
- Remove `__MACOSX/` and `.DS_Store` files
- Test the contact form from the live GitHub Pages URL
- Test mobile layout
