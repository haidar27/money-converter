# Convertly — Currency Converter PWA

Responsive currency converter made with plain HTML, CSS, and JavaScript.

## Features
- Real-time conversion as you type.
- Latest available reference exchange rates via Frankfurter API.
- USD, IDR, EUR, GBP, JPY, SGD and other common currencies.
- Swap currencies button.
- Quick amount chips.
- Cached last-known rate for basic offline use.
- PWA manifest + service worker + app icons for Chrome installation.
- Responsive UI for desktop, tablet and mobile.

## Run locally
For PWA installation/service-worker features, serve the folder over `localhost` or HTTPS rather than opening `index.html` with `file://`.

Example with Python:

```bash
python -m http.server 8080
```

Then open:
`http://localhost:8080`

## Deploy
Upload all files in this folder to a static HTTPS host such as GitHub Pages, Netlify, Vercel, or Firebase Hosting.
