# Romi Padam Portfolio

Static portfolio hosted on GitHub Pages.

Live site: `https://rkpadam.github.io/portfolio/`

## Local Preview

```bash
python3 -m http.server 4173 --directory .
```

Open `http://localhost:4173/`.

## Contact Form

- Public endpoint: `assets/config.js`
- Private recipient email: Apps Script property `CONTACT_TO_EMAIL`
- After editing `Code.gs`, redeploy:

```text
Deploy -> Manage deployments -> Edit -> Version: New version -> Deploy
```
