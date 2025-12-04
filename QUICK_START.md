# ⚡ Quick Start - Szybki Start

## 🎯 Uruchomienie w 30 sekund

### Windows (PowerShell)

```powershell
cd "C:\Users\dymow\Desktop\Vadym Dymov śledzenie finansów\myapp"
python -m http.server 8000
```
Otwórz: `http://localhost:8000` 🎉

### macOS/Linux

```bash
cd myapp
python -m http.server 8000
```
Otwórz: `http://localhost:8000` 🎉

### Node.js (Dowolny system)

```bash
cd myapp
npx http-server
```
Otwórz: `http://localhost:8080` 🎉

## ✨ Co teraz?

1. **Dodaj kilka transakcji**
   - Kliknij `➕ Dodaj`
   - Wybierz typ (Dochód/Wydatek)
   - Wpisz kwotę
   - Kliknij "Dodaj transakcję"

2. **Przejrzyj statystyki**
   - Kliknij `📈 Statystyki`
   - Zobaczysz wykresy i rozbicie po kategoriach

3. **Skonfiguruj ustawienia**
   - Kliknij `⚙️ Ustawienia`
   - Wybierz motyw, walutę, itp.

4. **Testuj tryb offline**
   - Otwórz DevTools (F12)
   - Przejdź do Application → Service Workers
   - Zaznacz "Offline"
   - Aplikacja działa bez internetu! ✓

## 📱 Instalacja jako aplikacja

### Android (Chrome)
1. Otwórz aplikację w Chrome
2. Kliknij menu (⋮) → "Zainstaluj aplikację"
3. Potwierdź

### iOS (Safari)
1. Otwórz aplikację w Safari
2. Kliknij Udostępniaj (↗) → "Do ekranu głównego"
3. Potwierdź

### Desktop (Chrome/Edge)
1. Kliknij ikonę instalacji w pasku adresu
2. Potwierdź

## 🏗️ Struktura projektu

```
myapp/
├── index.html              ← Główny plik (355 linii HTML)
├── sw.js                   ← Offline support
├── manifest.json           ← PWA metadata
│
├── css/
│   ├── style.css           ← Style (700+ linii)
│   └── responsive.css      ← Mobile design (400+ linii)
│
├── js/
│   ├── app.js              ← Główna logika (664 linii)
│   ├── database.js         ← Dane (490 linii)
│   ├── notifications.js    ← Powiadomienia (352 linii)
│   └── charts.js           ← Wykresy (430 linii)
│
└── icons/                  ← PWA ikony (11 plików)
```

## 🔑 Kluczowe cechy

✅ **PWA** - instalowalne na urządzenia  
✅ **Offline** - działa bez internetu  
✅ **Responsywne** - działa na wszystkich ekranach  
✅ **Polski** - całość w języku polskim  
✅ **Czysty kod** - HTML/CSS/JavaScript bez frameworków  
✅ **LocalStorage** - dane zapisane lokalnie  
✅ **Wykresy** - wizualizacja finansów  

## 🛠️ Personalizacja

### Zmiana koloru tematu

Edytuj `css/style.css` - linia ~15:

```css
:root {
    --primary-color: #2c3e50;  /* Zmień tutaj */
    --accent-color: #3498db;   /* I tutaj */
    /* ... */
}
```

### Dodanie nowej kategorii

Edytuj `js/database.js` - szukaj `CATEGORIES`:

```javascript
const CATEGORIES = {
    dochod: ['Pensja', 'Bonus', 'Freelance', 'Twoja nowa kategoria'],
    wydatek: ['Jedzenie', 'Transport', 'Rozrywka', 'Twoja nowa kategoria']
};
```

### Zmiana waluty

Edytuj `js/app.js` - szukaj `formatCurrency`:

```javascript
formatCurrency: (amount) => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'EUR'  // Zmień na EUR, GBP, itp
    }).format(amount);
}
```

## 🐛 Troubleshooting

**Aplikacja nie ładuje się?**
- Sprawdź, czy serwer HTTP działa
- Spróbuj `Ctrl+Shift+Del` (czyszczenie cache)

**Service Worker się nie rejestruje?**
- Upewnij się, że używasz HTTPS lub localhost
- Sprawdź konsolę (F12 → Console tab)

**Dane się nie zapisują?**
- Otwórz DevTools → Application → LocalStorage
- Sprawdź, czy `finansowy-tracker-db` jest tam

**Wykresy się nie pokazują?**
- Sprawdzenie, czy Canvas jest obsługiwany
- Wyczyszcz cache i przeładuj (F5 lub Ctrl+R)

## 📚 Dokumentacja

- **README.md** - Pełna dokumentacja funkcji
- **ARCHITECTURE.md** - Architektura kodu
- **DEPLOYMENT.md** - Jak wdrażać do produkcji

## 🚀 Co dalej?

- Chcesz więcej funkcji? Edytuj `js/app.js`
- Chcesz inne style? Dostosuj `css/style.css`
- Chcesz wdrażać online? Patrz `DEPLOYMENT.md`

## 💬 Support

Jeśli coś nie działa:
1. Sprawdź dokumentację
2. Otwórz DevTools (F12)
3. Sprawdź konsolę pod kątem błędów
4. Czyszczenie cache i przeładuj

## 🎉 Gotowe!

Aplikacja jest w pełni funkcjonalna i gotowa do użytku.

**Miłego używania! 💰**

---

*Finansowy Tracker v1.0.0 - Progressive Web App | Czysty HTML/CSS/JavaScript*
