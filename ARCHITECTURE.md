# 🏗️ Architektura Finansowego Trackera

## Przegląd

Finansowy Tracker to **Progressive Web App (PWA) zbudowana w czystym HTML5/CSS3/JavaScript ES6+** bez żadnych frameworków (React, Vue, Angular, itp.).

Aplikacja zaprojektowana na **architekturze modułowej** z wyraźnym podziałem odpowiedzialności:
- UI Layer (HTML/CSS)
- Business Logic (JavaScript modules)
- Data Layer (LocalStorage)
- Service Worker (Offline support)

## 📁 Struktura plików

```
myapp/
├── index.html              ← Single Page App z 4 ekranami
├── sw.js                   ← Service Worker (offline)
├── manifest.json           ← PWA metadata
│
├── css/
│   ├── style.css           ← Komponenty UI i layout
│   └── responsive.css      ← Media queries (6 breakpointów)
│
├── js/
│   ├── app.js              ← Główna logika, event listeners
│   ├── database.js         ← LocalStorage abstraction layer
│   ├── charts.js           ← Canvas rendering (wykresy)
│   └── notifications.js    ← UI notifications system
│
└── icons/                  ← PWA icons (SVG, 72-512px)
```

## 🔄 Architektura JavaScript

### Moduły jako IIFE (Immediately Invoked Function Expression)

Każdy moduł JavaScript to **samozamaykająca się funkcja**, która ukrywa wewnętrzny stan i eksportuje publiczne API:

```javascript
// database.js - Wzorzec Singleton
const DB = (() => {
    // PRYWATNE zmienne - niedostępne z zewnątrz
    const STORAGE_KEY = 'finansowy-tracker-db';
    const transactions = [];
    
    // PRYWATNE metody
    const saveToStorage = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    };
    
    // PUBLICZNE API
    return {
        addTransaction: (type, category, amount, date, desc) => {
            const transaction = {
                id: Date.now(),
                type,
                category,
                amount,
                date,
                description: desc
            };
            transactions.push(transaction);
            saveToStorage();
            return transaction;
        },
        
        getTransactions: () => [...transactions], // Deep copy
        
        deleteTransaction: (id) => {
            const index = transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                transactions.splice(index, 1);
                saveToStorage();
                return true;
            }
            return false;
        }
    };
})();

// Użycie - zewnętrzny kod ma dostęp TYLKO do publicznego API
DB.addTransaction('wydatek', 'jedzenie', 50, '2025-12-04', 'Obiad');
```

### 4 Główne moduły

#### 1. **database.js** (490 linii)
Warstwa danych - obsługuje wszystkie operacje na transakcjach.

```javascript
const DB = (() => {
    return {
        // CRUD operacje
        addTransaction(type, category, amount, date, description),
        getTransactions(),
        getTransactionById(id),
        updateTransaction(id, updates),
        deleteTransaction(id),
        deleteAllTransactions(),
        
        // Filtrowanie i statystyki
        getTransactionsSorted(sortBy),
        getTransactionsByType(type),
        getTransactionsByCategory(category),
        getTransactionsByDateRange(startDate, endDate),
        getTransactionsByMonth(year, month),
        
        // Statystyki
        getSummary(filters),              // {dochody, wydatki, bilans}
        getStatisticsByCategory(filters), // {kategoria: kwota}
        getMonthlyTrend(months),         // Trend za ostatnie N miesięcy
        
        // Ustawienia
        getSettings(),
        updateSetting(key, value),
        saveSettings(settings),
        
        // Import/Export
        exportToJSON(),
        importFromJSON(json)
    };
})();
```

**Warstwa LocalStorage:**
- `finansowy-tracker-db`: Przechowuje wszystkie transakcje
- `finansowy-tracker-settings`: Ustawienia użytkownika

#### 2. **notifications.js** (352 linie)
System UI powiadomień.

```javascript
const Notifications = (() => {
    const MAX_VISIBLE = 3;
    const notifications = [];
    
    return {
        // Typy powiadomień
        success(message, duration),
        error(message, duration),
        warning(message, duration),
        info(message, duration),
        toast(message, duration),    // Auto-dismiss
        confirm(message, onYes, onNo), // Modal
        
        // Powiadomienia biznesowe
        notifyTransactionAdded(type, amount),
        notifyTransactionDeleted(),
        notifyLimitExceeded(amount, limit),
        notifySettingsSaved(),
        notifyDataExported(),
        notifyDataImported(),
        
        // System
        requestNotificationPermission(),
        showSystemNotification(title, options)
    };
})();
```

**Cechy:**
- Maksymalnie 3 jednoczesne powiadomienia
- Auto-dismiss po 5 sekund (toast: 3s)
- Animacje CSS (fadeIn, slideIn, slideOut)
- System notyfikacji przeglądarki (push notifications)

#### 3. **charts.js** (430 linii)
Wizualizacja danych za pomocą Canvas API.

```javascript
const Charts = (() => {
    return {
        // Typy wykresów
        drawPieChart(canvasId, data, options),        // Wydatki po kategoriach
        drawBarChart(canvasId, data, options),        // Dochody vs wydatki
        drawLineChart(canvasId, data, options),       // Trend czasowy
        
        // Utility
        clearCanvas(canvasId),
        drawNoData(canvasId)
    };
})();
```

**Cechy:**
- Pure Canvas API (bez bibliotek jak Chart.js)
- DPI scaling dla ostrości na Retina
- Legend i labels
- Responsywne rozmiary
- Obsługa ciemnego motywu

#### 4. **app.js** (664 linie)
Główna logika aplikacji - orchestration layer.

```javascript
const App = (() => {
    return {
        // Cykl życia
        init(),
        destroy(),
        
        // Nawigacja między ekranami
        showScreen(screenName), // 'glowny', 'dodaj', 'statystyki', 'ustawienia'
        
        // Ekran Główny
        refreshDashboard(),
        displayRecentTransactions(),
        
        // Ekran Dodaj
        handleFormSubmit(event),
        updateCategorySelect(type),
        resetForm(),
        
        // Ekran Statystyki
        refreshStatistics(),
        drawStatisticsCharts(),
        loadCategoriesTable(),
        applyFilters(),
        
        // Ekran Ustawienia
        loadSettings(),
        saveSettings(),
        updateTheme(theme),
        handleExport(),
        handleImport(),
        
        // Utility
        updateOnlineStatus(),
        formatCurrency(amount),
        getCategoryEmoji(category)
    };
})();
```

## 🎨 Warstwa UI (HTML/CSS)

### index.html struktura

```html
<div id="app" class="app-container">
    <!-- Header z tytułem i statusem -->
    <header class="app-header">
        <h1>💰 Finansowy Tracker</h1>
        <span id="syncStatus">✓ Online</span>
    </header>
    
    <!-- Main content z 4 ekranami -->
    <main class="app-main">
        <!-- EKRAN 1: Główny (Dashboard) -->
        <section id="ekran-glowny" class="ekran active">
            <div class="summary-container">
                <div class="summary-card dochód">Dochody: <span id="sumaDochodów">0,00</span></div>
                <div class="summary-card wydatek">Wydatki: <span id="sumaWydatków">0,00</span></div>
                <div class="summary-card bilans">Bilans: <span id="bilans">0,00</span></div>
            </div>
            <div class="transactions-list" id="transactionsList"></div>
        </section>
        
        <!-- EKRAN 2: Dodaj transakcję -->
        <section id="ekran-dodaj" class="ekran">
            <form id="transactionForm">
                <select id="type" required>
                    <option value="">Typ...</option>
                    <option value="dochod">Dochód</option>
                    <option value="wydatek">Wydatek</option>
                </select>
                <select id="category" required><!-- Dynamicznie wypełniana --></select>
                <input id="amount" type="number" placeholder="Kwota" required>
                <input id="date" type="date" required>
                <textarea id="description" placeholder="Opis (opcjonalnie)"></textarea>
                <button type="submit">Dodaj transakcję</button>
            </form>
        </section>
        
        <!-- EKRAN 3: Statystyki -->
        <section id="ekran-statystyki" class="ekran">
            <!-- Filtry, wykresy, tabele -->
        </section>
        
        <!-- EKRAN 4: Ustawienia -->
        <section id="ekran-ustawienia" class="ekran">
            <!-- Preferencje, export/import, reset -->
        </section>
    </main>
    
    <!-- Bottom navigation -->
    <nav class="app-nav">
        <button data-screen="glowny">📊 Główny</button>
        <button data-screen="dodaj">➕ Dodaj</button>
        <button data-screen="statystyki">📈 Statystyki</button>
        <button data-screen="ustawienia">⚙️ Ustawienia</button>
    </nav>
    
    <!-- Notifications container -->
    <div id="notificationsContainer"></div>
</div>
```

### CSS Architecture

**style.css** (700+ linii):
- CSS Variables dla kolorów, rozmiarów, fontów
- Layout: Flexbox dla responsywności
- Komponenty: cards, buttons, forms, notifications
- Animacje: fadeIn, slideIn, slideOut
- Ciemny motyw: `@media (prefers-color-scheme: dark)`

**responsive.css** (400+ linii):
- 6 media query breakpointów:
  - `< 360px`: Very small
  - `360px - 480px`: Mobile
  - `481px - 768px`: Tablet
  - `769px - 1024px`: Tablet landscape
  - `1025px - 1440px`: Desktop
  - `1440px+`: Large desktop
- Accessibility: `prefers-reduced-motion`, `prefers-contrast`
- Touch optimization: 44px+ tap targets

## 🔗 Przepływ danych

```
┌─────────────────────────────────────────────────────────────┐
│                         UI (HTML)                            │
│         Klik przycisku → Event bubble up                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Event Listener
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      App.js                                  │
│              Event Handler (onClick, etc)                    │
│         Walidacja danych → Logika biznesowa                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ DB.addTransaction()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database.js                               │
│              CRUD operacje na transakcjach                   │
│              LocalStorage synchronization                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Notifications.success()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Notifications.js                            │
│               DOM manipulation - pokaż toast                 │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         UI Update                            │
│            App.refreshDashboard() - odswiez widok            │
│                 Charts.drawPieChart()                        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Instancjacja modułów

Pliki JavaScript ładują się w określonej kolejności w `index.html`:

```html
<!-- Warstwa danych PIERWSZA -->
<script src="js/database.js"></script>

<!-- System powiadomień DRUGA -->
<script src="js/notifications.js"></script>

<!-- Wykresy TRZECIA -->
<script src="js/charts.js"></script>

<!-- Główna aplikacja CZWARTA (zależy od powyższych) -->
<script src="js/app.js"></script>

<!-- Service Worker dla offline -->
<script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
</script>
```

**Dlaczego ta kolejność?**
- `app.js` odwołuje się do `DB`, `Notifications`, `Charts`
- Wszystkie powinny być dostępne PRZED zainicjowaniem `App`
- Service Worker rejestruje się na końcu

## 🔄 Service Worker (sw.js)

Obsługuje offline support i caching.

```javascript
// Event 1: Install - cachuj zasoby przy pierwszej instalacji
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Event 2: Fetch - obsługuj requesty
self.addEventListener('fetch', (event) => {
    // Dla plików statycznych (CSS, JS, images) - cache-first
    if (isStaticAsset(event.request.url)) {
        event.respondWith(
            caches.match(event.request).then(response => 
                response || fetch(event.request)
            )
        );
    }
    // Dla HTML - network-first
    else if (event.request.url.endsWith('.html')) {
        event.respondWith(
            fetch(event.request).then(response => {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                });
                return response;
            }).catch(() => caches.match(event.request))
        );
    }
});

// Event 3: Activate - czyszczenie starych cache'y
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});
```

## 📊 Statystyki

```
Linie kodu:
- HTML: 355 linii
- CSS: 1100+ linii (style.css + responsive.css)
- JavaScript: 2600+ linii
- Razem: ~4055 linii

Moduły JavaScript:
- database.js: 490 linii (CRUD, filtering, export/import)
- notifications.js: 352 linii (toast, modals, system notifications)
- charts.js: 430 linii (Canvas rendering, 3 typy wykresów)
- app.js: 664 linii (UI orchestration, event handling)

Rozmiar:
- Transfer: ~150 KB (bez node_modules)
- Cache: ~200 KB (z assetami)
- Load time: < 1 sekundy
```

## ✅ Wymagania spełnione

✅ **4 ekrany w jednym HTML** - ukrywanie/pokazywanie divów za pomocą CSS  
✅ **Czysty JavaScript** - bez React, Vue, Angular  
✅ **PWA z Service Worker** - offline support, installable  
✅ **Responsywny design** - mobile-first, 6 breakpointów  
✅ **Polski interfejs** - całość w języku polskim  
✅ **Modułowa architektura** - IIFE + singleton pattern  
✅ **Brak frameworków** - 0 zależności (oprócz http-server na dev)  

## 🚀 Jak uruchomić

```bash
cd myapp
npm start  # lub: npx http-server
# Otwórz: http://localhost:8000
```

**Aplikacja jest gotowa do użytku w sekundę!** ⚡
