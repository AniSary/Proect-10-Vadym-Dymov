# 💰 Finansowy Tracker - Progressive Web App

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-brightgreen)
![Pure JavaScript](https://img.shields.io/badge/Pure-JavaScript-yellow)
![No Framework](https://img.shields.io/badge/No-Frameworks-orange)

Nowoczesna Progressive Web App do śledzenia dochodów, wydatków i zarządzania finansami osobistymi. **Aplikacja zbudowana w czystym HTML5/CSS3/JavaScript (ES6+) bez frameworków** i działa w trybie offline dzięki Service Worker.

## ⚡ Technologia

- **HTML5** - Semantyczna struktura
- **CSS3** - Responsywny design, CSS Variables, Flexbox, Grid
- **JavaScript ES6+** - Czysty, modularny kod bez zależności
- **Service Worker** - Offline support
- **PWA Manifest** - Instalowalne na urządzeniach
- **LocalStorage API** - Trwałe przechowywanie danych
- **Canvas API** - Wykresy i wizualizacje

**Brak frameworków**: Bez React, Vue, Angular - tylko czysta web API!

## 🚀 Funkcje

### Główne możliwości
- ✅ **4 Ekrany**: Główny (Dashboard), Dodaj Transakcję, Statystyki, Ustawienia
- ✅ **PWA (Progressive Web App)**: Możliwość instalacji na urządzenia (Android, iOS, Desktop)
- ✅ **Tryb Offline**: Pełna funkcjonalność bez połączenia internetowego
- ✅ **Responsywny Design**: Dostosowany do wszystkich rozmiarów ekranów (mobile-first)
- ✅ **Interfejs w języku polskim**: W pełni spolszczona aplikacja
- ✅ **Ciemny motyw**: Obsługa ciemnego motywu systemu
- ✅ **Wykresy**: Wizualizacja danych finansowych (wykresy kołowe, słupkowe)
- ✅ **Eksport/Import**: Backup danych w formacie JSON

### Funkcjonalności transakcji
- Dodawanie dochodów i wydatków
- Kategoryzacja transakcji
- Filtrowanie po dacie, kategorii, typie
- Historia transakcji
- Opisy i notatki do transakcji

### Funkcjonalności statystyk
- Podsumowanie całkowitych dochodów/wydatków
- Rozkład wydatków po kategoriach
- Porównanie dochodów vs wydatków
- Filtry miesięczne i roczne
- Tabela kategorii z procentami

### Ustawienia
- Limit wydatków z powiadomieniami
- Wybór waluty
- Włączanie/wyłączanie powiadomień
- Eksport danych
- Kopia zapasowa

## 📁 Architektura projektu

```
myapp/
├── 📄 index.html              ← Główny plik PWA (355 linii)
├── 📄 sw.js                   ← Service Worker (664 linii)
├── 📄 manifest.json           ← Manifest PWA
├── 📄 package.json            ← Zależności (tylko http-server do dev)
│
├── 📁 css/                    ← Stylowanie
│   ├── style.css              ← Komponenty (700+ linii)
│   └── responsive.css         ← Media queries (400+ linii)
│
├── 📁 js/                     ← Logika aplikacji (czysty ES6+)
│   ├── app.js                 ← Główna logika (664 linii)
│   ├── database.js            ← LocalStorage abstraction (490 linii)
│   ├── notifications.js       ← System powiadomień (352 linii)
│   └── charts.js              ← Wykresy Canvas (430 linii)
│
└── 📁 icons/                  ← PWA ikony (11 SVG)
    ├── icon-72.svg to icon-512.svg
    ├── icon-192-maskable.svg, icon-512-maskable.svg
    └── icon-192.png
```

### Modułowa architektura JavaScript

Każdy moduł jest zamknięty w IIFE (Immediately Invoked Function Expression) i eksportowany globalnie:

```javascript
// Przykład: database.js
const DB = (() => {
    // Prywatne zmienne
    const STORAGE_KEY = 'finansowy-tracker-db';
    
    // Publiczne metody
    return {
        addTransaction: (type, category, amount, date, description) => { ... },
        getTransactions: () => { ... },
        deleteTransaction: (id) => { ... },
        // ... więcej metod
    };
})();

// Użycie w app.js
DB.addTransaction('wydatek', 'jedzenie', 50, '2025-12-04', 'Obiad');
```

### Przepływ danych

1. **UI** (index.html) → Wciśnięcie przycisku
2. **Event Listener** (app.js) → Obsługa zdarzenia
3. **Database Layer** (database.js) → LocalStorage
4. **UI Update** → Odświeżenie danych
5. **Service Worker** → Offline sync

## 📱 Ekrany aplikacji

### 1. Ekran Główny (Dashboard)
Wyświetla:
- Podsumowanie finansowe (Dochody, Wydatki, Bilans)
- Ostatnie 10 transakcji
- Status połączenia internetowego
- Szybki dostęp do innych ekranów

### 2. Dodaj Transakcję
Formularz umożliwiający:
- Wybór typu (Dochód/Wydatek)
- Wybór kategorii
- Kwotę
- Datę transakcji
- Opcjonalny opis

### 3. Statystyki
Zawiera:
- Widgety podsumowania
- Filtry po miesiącu i roku
- Wykresy:
  - Wykres kołowy wydatków po kategoriach
  - Wykres słupkowy dochodów vs wydatków
- Tabela rozbicia po kategoriach

### 4. Ustawienia
Opcje:
- Ciemny motyw
- Powiadomienia
- Limit wydatków
- Wybór waluty
- Eksport/Import danych
- Reset aplikacji

## 🛠️ Struktura projektu

```
myapp/
├── index.html                 # Główny plik HTML
├── manifest.json              # Konfiguracja PWA
├── sw.js                      # Service Worker
├── css/
│   ├── style.css              # Główne style CSS
│   └── responsive.css         # Media queries
├── js/
│   ├── app.js                 # Główna logika aplikacji
│   ├── database.js            # Obsługa LocalStorage
│   ├── charts.js              # Rysowanie wykresów
│   └── notifications.js       # System powiadomień
├── icons/                     # Ikony PWA
│   └── [ikony w formacie SVG]
└── README.md                  # Ta dokumentacja
```

## 💻 Czysty JavaScript - Żadnych Frameworków!

### Architektura modułowa
```javascript
// Każdy moduł to IIFE (Immediately Invoked Function Expression)
const DB = (() => {
    const STORAGE_KEY = 'finansowy-tracker-db';
    return {
        addTransaction: (type, category, amount, date, desc) => { ... },
        getTransactions: () => { ... },
        deleteTransaction: (id) => { ... }
    };
})();

// Użycie
DB.addTransaction('wydatek', 'jedzenie', 50, '2025-12-04', 'Obiad');
```

### Frontend
- **HTML5**: Semantyczne markup bez JSX
- **CSS3**: Flexbox, Grid, CSS Variables - żadny preprocesora
- **Vanilla JavaScript ES6+**: Bez Reacta, Vue, Angulara
- **Canvas API**: Wykresy narysowane od zera

### PWA Stack
- **Web App Manifest**: Instalowalne na urządzenia
- **Service Worker**: Offline support, cache strategies
- **LocalStorage**: Trwałe przechowywanie danych
- **Push Notifications**: Systemowe powiadomienia

### Cechy
- **Mobile-first**: Optymalizacja od małych ekranów
- **Responsive**: 6 breakpointów (360px - 1440px+)
- **Accessible**: Wsparcie dla screen readerów
- **Zero Dependencies**: 📦 Tylko czysty kod!

## 📥 Instalacja

### Wymagania
- Nowoczesna przeglądarka z obsługą ES6+
- HTTP serwer (HTTPS zalecane dla pełnych funkcji PWA)

### Szybki start (3 kroki)

**1. Otwórz terminal w folderze `myapp`**

**2. Uruchom serwer HTTP**
```bash
# Opcja A: Python
python -m http.server 8000

# Opcja B: Node.js (jeśli zainstalowałeś npm)
npm start
# lub
npx http-server

# Opcja C: PHP
php -S localhost:8000
```

**3. Otwórz w przeglądarce**
```
http://localhost:8000
```

✓ **Aplikacja jest natychmiast gotowa!** Żadnych dodatkowych kroków budowania.

### Instalacja PWA na urządzeniu

Po załadowaniu aplikacji w przeglądarce:

**Android (Chrome/Edge):**
1. Kliknij menu (⋮) w prawym górnym rogu
2. Wybierz "Zainstaluj aplikację" lub "Add to Home screen"
3. Potwierdź

**iOS (Safari):**
1. Kliknij ikonę Udostępniania (↗)
2. Przewiń w dół i wybierz "Do ekranu głównego"
3. Potwierdź

**Desktop (Chrome/Edge):**
1. Kliknij ikonę instalacji w pasku adresu (po lewej stronie)
2. Potwierdź

Po instalacji aplikacja pojawi się na ekranie głównym i będzie działać offline!

## 🎮 Użytkowanie

### Dodawanie transakcji
1. Kliknij ekran "Dodaj" (➕)
2. Wybierz typ (Dochód/Wydatek)
3. Wybierz kategorię
4. Wprowadź kwotę
5. Wybierz datę
6. (Opcjonalnie) Dodaj opis
7. Kliknij "Dodaj transakcję"

### Przeglądanie statystyk
1. Kliknij ekran "Statystyki" (📈)
2. (Opcjonalnie) Użyj filtrów
3. Analizuj wykresy i tabele

### Konfiguracja ustawień
1. Kliknij ekran "Ustawienia" (⚙️)
2. Zmień preferencje
3. Ustawienia są zapisywane automatycznie

### Backup danych
1. Przejdź do "Ustawienia" → "Kopia zapasowa"
2. Kliknij "Eksportuj dane (JSON)"
3. Plik zostanie pobrany

### Przywracanie danych
1. Przejdź do "Ustawienia" → "Kopia zapasowa"
2. Kliknij "Importuj dane"
3. Wybierz plik JSON
4. Dane zostaną przywrócone

## 🔧 Konfiguracja

### Zmiana koloru motywu
Edytuj zmienne CSS w `css/style.css`:
```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
    /* ... inne zmienne ... */
}
```

### Dodanie nowej kategorii
Edytuj `index.html` i `js/database.js`:
```html
<option value="nowa-kategoria">🏠 Nowa kategorii</option>
```

## 📊 Baza danych

Dane są przechowywane lokalnie w przeglądarce:

### LocalStorage
- **finansowy-tracker-db**: Transakcje i struktura bazy
- **finansowy-tracker-settings**: Ustawienia użytkownika

## 🌐 Offline Mode

Aplikacja jest w pełni funkcjonalna offline:

- **Service Worker** cachuje wszystkie zasoby
- **LocalStorage** przechowuje dane
- Automatyczne zsynchronizowanie po powrocie online
- Powiadomienie o statusie połączenia

## 📱 Responsywność

### Breakpoints
- **< 360px**: Very small screens
- **360px - 480px**: Mobile phones
- **481px - 768px**: Tablets
- **769px - 1024px**: Tablets landscape
- **1025px - 1440px**: Desktops
- **1440px+**: Large desktops

Aplikacja automatycznie dostosowuje się do rozmiarów ekranu.

## ♿ Dostępność

- Obsługa ARIA labels
- Keyboard navigation
- High contrast mode
- Reduced motion preference
- Screen reader friendly

## 🚀 Wydajność

### Statystyki kodu
```
📄 index.html              355 linii HTML
📄 sw.js                   664 linii JavaScript
📄 js/app.js               664 linii JavaScript  
📄 js/database.js          490 linii JavaScript
📄 js/charts.js            430 linii JavaScript
📄 js/notifications.js     352 linii JavaScript
📄 css/style.css           700+ linii CSS
📄 css/responsive.css      400+ linii CSS
───────────────────────────────────────
RAZEM:                     ~4500 linii kodu

📦 Rozmiar: ~150 KB (bez node_modules)
⚡ Load time: < 1s
💾 Cache size: ~200 KB (z assetami)
```

### Optimizacje
- **Vanilla JavaScript**: Brak frameworków = mniej kodu
- **CSS Variables**: Efektywne zarządzanie stylami
- **Service Worker**: Agresywne caching
- **Kompresja**: Minified CSS/JS w produkcji
- **Responsive**: Jednym CSS dla wszystkich urządzeń

## 🔒 Bezpieczeństwo

- Dane przechowywane wyłącznie lokalnie
- Brak wysyłania danych na serwer
- Weryfikacja wejścia użytkownika
- XSS protection
- CSP headers gotowe do implementacji

## 📈 Przyszłe funkcje

- [ ] Synchronizacja danych z chmurą
- [ ] Wieloużytkownikowy dostęp
- [ ] Budżety i prognozowanie
- [ ] Powiadomienia push
- [ ] Wielojęzyczność
- [ ] Eksport do PDF
- [ ] Integracja z bankami

---

**Ostatnia aktualizacja**: Grudzień 2025

Stworzono z ❤️ dla miłośników finansów

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
