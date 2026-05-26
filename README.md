# Romi Padam Portfolio

Static portfolio hosted on GitHub Pages.

Live site: `https://rkpadam.github.io/portfolio/`

## Local Preview

```bash
python3 -m http.server 4173 --directory .
```

Open `http://localhost:4173/`.

## Files I Usually Touch

- `index.html` - page content
- `styles.css` - styling and responsive layout
- `script.js` - portrait animation and contact form behavior
- `assets/config.js` - contact form endpoint
- `google-apps-script/Code.gs` - Apps Script backend

## Contact Form

- Public endpoint: `assets/config.js`
- Private recipient email: Apps Script property `CONTACT_TO_EMAIL`
- After editing `Code.gs`, redeploy:

```text
Deploy -> Manage deployments -> Edit -> Version: New version -> Deploy
```

Do not commit private email or phone details.

## Publish

```bash
git add .
git commit -m "Update portfolio"
git push
```

GitHub Pages publishes from `main` / root and may take a minute or two to refresh.
