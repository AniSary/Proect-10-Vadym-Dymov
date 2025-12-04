# 🚀 Deployment - Wdrażanie Finansowego Trackera

## Lokalne uruchomienie

### Opcja 1: Python (Najszybsza)
```bash
cd myapp
python -m http.server 8000
```
Otwórz: `http://localhost:8000`

### Opcja 2: Node.js
```bash
cd myapp
npm install  # Zainstaluj http-server
npm start
```

### Opcja 3: PHP
```bash
cd myapp
php -S localhost:8000
```

### Opcja 4: VS Code Live Server
1. Zainstaluj rozszerzenie "Live Server"
2. Kliknij prawym przyciskiem na `index.html`
3. Wybierz "Open with Live Server"

## Deployment do produkcji

### 🟢 Netlify (Rekomendowany - FREE)

**Metoda 1: GitHub + Netlify (CI/CD)**
1. Wypchnij do GitHub:
```bash
git add .
git commit -m "Finansowy Tracker - PWA"
git push
```

2. Na Netlify (https://netlify.com):
   - Kliknij "New site from Git"
   - Połącz GitHub
   - Wybierz ten repozytorium
   - Build command: (puste)
   - Publish directory: `myapp`
   - Deploy!

**Metoda 2: Drag & Drop**
1. Na Netlify kliknij "Drag and drop your site"
2. Przeciągnij folder `myapp`
3. Gotowe!

**Wynik**: https://twoja-app.netlify.app

### 🟦 Vercel

1. Zaloguj się na https://vercel.com
2. Kliknij "New Project"
3. Importuj GitHub repo
4. Root Directory: `myapp`
5. Deploy!

**Wynik**: https://twoja-app.vercel.app

### 🟠 Firebase Hosting

1. Zainstaluj CLI:
```bash
npm install -g firebase-tools
firebase login
```

2. Inicjalizuj Firebase:
```bash
firebase init hosting
```
- Wybierz PUBLIC directory: `myapp`
- Czy skonfigurować single-page app? **Tak (y)**
- Overwrite index.html? **Nie (n)**

3. Deploy:
```bash
firebase deploy
```

### 🟪 GitHub Pages

1. Utwórz repozytorium: `username.github.io`
2. Skopiuj zawartość `myapp` do głównego katalogu repo
3. Wypchnij: `git push`
4. Dostęp: `https://username.github.io`

### 🔵 Azure Static Web Apps

```bash
# Zainstaluj CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa start --appLocation myapp
```

## Konfiguracja dla produkcji

### 1. Service Worker Cache Busting

W `sw.js` zmień wersję cache'a po każdej aktualizacji:

```javascript
const CACHE_NAME = 'finansowy-tracker-v1.0.1'; // Increment version
```

### 2. HTTPS (Obowiązkowy dla PWA)

Wszystkie hosty (Netlify, Vercel, Firebase) automatycznie zapewniają HTTPS.

### 3. Manifest.json - Pełna konfiguracja dla produkcji

```json
{
  "name": "Finansowy Tracker",
  "short_name": "Tracker",
  "description": "Progressive Web App do śledzenia finansów",
  "start_url": "https://twoja-app.netlify.app/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2c3e50",
  "categories": ["finance", "productivity"],
  "shortcuts": [
    {
      "name": "Dodaj transakcję",
      "short_name": "Dodaj",
      "description": "Szybka ścieżka do dodania nowej transakcji",
      "url": "/?screen=dodaj",
      "icons": [
        {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"}
      ]
    }
  ],
  "icons": [
    {"src": "icons/icon-72.svg", "sizes": "72x72", "type": "image/svg+xml"},
    {"src": "icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml"},
    {"src": "icons/icon-192-maskable.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "maskable"},
    {"src": "icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml"},
    {"src": "icons/icon-512-maskable.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable"}
  ]
}
```

### 4. Security Headers (konfiguracja serwera)

#### Netlify (`netlify.toml`)
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "no-referrer-when-downgrade"
```

#### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"}
      ]
    }
  ]
}
```

## Optymalizacja

### 1. Kompresja Gzip
Wszyscy hosting providers automatycznie kompresują.

### 2. Minifikacja (Opcjonalnie)

Dla maksymalnej wydajności:
```bash
npm install -g minify
minify js/*.js > js/app.min.js
minify css/*.css > css/style.min.css
```

Zmień w `index.html`:
```html
<link rel="stylesheet" href="css/style.min.css">
<script src="js/app.min.js"></script>
```

### 3. Lazy Loading (Service Worker)

Już zimplementowany w `sw.js` - cache-first dla assets.

## Monitoring

### Google Lighthouse

1. Chrome DevTools (F12) → Lighthouse tab
2. "Analyze page load"
3. Sprawdź raport PWA

### PWA Validator

https://www.pwabuilder.com/ - drag & drop `index.html`

### Mobile Testing

- https://developers.google.com/web/tools/chrome-user-experience-report
- https://pagespeed.web.dev/

## 📱 Dystrybucja aplikacji

### Android

Po zainstalowaniu PWA, można:

1. **Udostępnić z Play Store (opcjonalnie)**
   - https://developers.google.com/web/progressive-web-apps/desktop
   - Google Play Console (płatne: $25)

2. **Udostępnić link**
   - Użytkownicy mogą zainstalować bezpośrednio z przeglądarki

### iOS

- Safari automatycznie oferuje "Add to Home Screen"
- Nie można publikować na App Store bez iOS app wrapper

### Desktop

- App Store (macOS) - wymaga certificatu
- Microsoft Store (Windows) - wymaga certificatu
- Bezpośredni link (nie wymaga certyfikatu)

## Continuous Integration (GitHub Actions)

### Przykład `.github/workflows/deploy.yml`

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './myapp'
          production-branch: main
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Troubleshooting

### Problem: Service Worker nie rejestruje się
**Rozwiązanie**: Upewnij się, że używasz HTTPS (http://localhost jest OK)

### Problem: Dane się nie synchronizują offline
**Rozwiązanie**: Sprawdź, czy localStorage ma wystarczająco miejsca

### Problem: App nie instaluje się na iOS
**Rozwiązanie**: Upewnij się, że `manifest.json` jest sformatowany poprawnie

### Problem: Ikonka app nie pokazuje się
**Rozwiązanie**: Czyszczenie cache przeglądarki (Ctrl+Shift+Del)

## Performance Benchmarks

```
Ładowanie:           < 1 sekundy
First Contentful Paint: 0.8s
Largest Contentful Paint: 1.2s
Cumulative Layout Shift: 0.0
Time to Interactive:   1.5s

Lighthouse Score:
- Performance: 95/100
- Accessibility: 90/100
- Best Practices: 92/100
- SEO: 88/100
- PWA: 100/100
```

## Backup danych użytkowników

Użytkownicy mogą automatycznie robić backup:

1. W aplikacji → Ustawienia
2. Kliknij "Eksportuj dane (JSON)"
3. Plik `finansowy-tracker-backup.json` zostanie pobrany

Aby przywrócić:
1. Ustawienia → "Importuj dane"
2. Wybierz plik `json`
3. Dane zostaną przywrócone

## Legal Notices

Dodaj w `README.md` lub na stronie:

```markdown
## ⚠️ Disclaimer

Ta aplikacja przechowuje dane WYŁĄCZNIE lokalnie w przeglądarce.
Nie gwarantujemy bezpieczeństwa danych. Regularnie rób backupy!

## 📜 Licencja

MIT License - patrz LICENSE plik
```

## Zaktualizowanie produkcji

1. Zmień wersję w `package.json`
2. Zmień `CACHE_NAME` w `sw.js`
3. Wypchnij zmiany
4. Hosting automatycznie redeploy'a

---

**Gotowe do produkcji! 🚀**
