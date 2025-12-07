/**
 * App Module - Finansowy Tracker
 * Główna logika aplikacji - zarządzanie stanem i interakcjami
 */

const App = (() => {
    // Zmienna stanu
    let state = {
        currentScreen: 'ekran-glowny',
        isOnline: navigator.onLine
    };
    
    /**
     * INICJALIZACJA APLIKACJI
     */
    
    function init() {
        console.log('[App] Inicjalizacja aplikacji');
        
        // Ustaw datę dzisiejszą w formularzu
        const dateInput = document.getElementById('data');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Załaduj ustawienia
        loadSettings();
        
        // Rejestruj event listenery
        registerEventListeners();
        
        // Odśwież dashboard
        refreshDashboard();
        
        // Sprawdź status online
        updateOnlineStatus();
        
        // Request notification permission
        Notifications.requestNotificationPermission();
        
        // Spróbuj określić lokalizację użytkownika (do auto-ustawienia waluty)
        detectLocationAndSetCurrency();
        
        console.log('[App] Inicjalizacja zakończona');
    }
    
    /**
     * GEOLOKACJA - Auto-detect waluty na podstawie lokalizacji
     */
    
    function detectLocationAndSetCurrency() {
        // Sprawdź czy geolokacja jest dostępna
        if (!navigator.geolocation) {
            console.log('[Geolocation] Geolocation API nie jest dostępna w tej przeglądarce');
            return;
        }
        
        // Sprawdź czy użytkownik już ma ustawioną walutę (nie overriduj jej)
        const currentSettings = DB.getSettings();
        if (currentSettings.waluty && currentSettings.waluty !== 'PLN') {
            console.log('[Geolocation] Waluta już ustawiona na:', currentSettings.waluty);
            return;
        }
        
        // Żądaj dostępu do lokalizacji
        navigator.geolocation.getCurrentPosition(
            (position) => handleGeolocationSuccess(position),
            (error) => handleGeolocationError(error),
            { timeout: 5000, maximumAge: 3600000 } // 5s timeout, cache 1h
        );
    }
    
    function handleGeolocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`[Geolocation] Lokalizacja: ${lat}, ${lng}`);
        
        // Mapuj współrzędne do waluty (uproszczona logika)
        const currency = mapCoordinatesToCurrency(lat, lng);
        
        if (currency && currency !== 'PLN') {
            console.log(`[Geolocation] Auto-ustawiono walutę na: ${currency}`);
            const settings = DB.getSettings();
            settings.waluty = currency;
            DB.saveSettings(settings);
            
            // Aktualizuj select w UI
            const currencySelect = document.getElementById('waluty');
            if (currencySelect) {
                currencySelect.value = currency;
            }
            
            // Odśwież dashboard z nową walutą
            refreshDashboard();
        }
    }
    
    function handleGeolocationError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                console.log('[Geolocation] Użytkownik odmówił dostępu do lokalizacji');
                break;
            case error.POSITION_UNAVAILABLE:
                console.log('[Geolocation] Informacje o lokalizacji nie są dostępne');
                break;
            case error.TIMEOUT:
                console.log('[Geolocation] Żądanie dla lokalizacji timeout');
                break;
            default:
                console.log('[Geolocation] Nieznąd błąd lokalizacji:', error.message);
        }
    }
    
    function mapCoordinatesToCurrency(lat, lng) {
        // Uproszczona mapa krajów -> walut
        // Polska: 49-55°N, 14-24°E
        if (lat >= 49 && lat <= 55 && lng >= 14 && lng <= 24) {
            return 'PLN';
        }
        
        // Europa (Euro) - przybliżone
        if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) {
            // Wyszczególnione kraje Eurostref
            if ((lat >= 48.5 && lat <= 54.5 && lng >= 5.5 && lng <= 15.5) ||  // Niemcy, Czechy
                (lat >= 43 && lat <= 51 && lng >= -5 && lng <= 8) ||           // Francja, Belgia
                (lat >= 40.5 && lat <= 48 && lng >= 4 && lng <= 20)) {         // Austria, Włochy, Słowenia
                return 'EUR';
            }
        }
        
        // USA: 25-50°N, 66-125°W
        if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
            return 'USD';
        }
        
        // Domyślnie PLN dla powiatu europejskiego
        return 'PLN';
    }
    
    /**
     * REJESTRACJA EVENT LISTENERÓW
     */
    
    function registerEventListeners() {
        // Nawigacja
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', handleNavigation);
        });
        
        // Formularz transakcji
        const formularz = document.getElementById('formularzTransakcji');
        if (formularz) {
            formularz.addEventListener('submit', handleFormSubmit);
            
            // Zmień kategorie w zależności od typu
            const typSelect = document.getElementById('typ');
            if (typSelect) {
                typSelect.addEventListener('change', updateCategories);
            }
        }
        
        // Filtry statystyk
        const filterMiesiac = document.getElementById('filterMiesiac');
        const filterRok = document.getElementById('filterRok');
        if (filterMiesiac) filterMiesiac.addEventListener('change', refreshStatistics);
        if (filterRok) filterRok.addEventListener('change', refreshStatistics);
        
        // Ustawienia
        registerSettingsListeners();
        
        // FAB Button - szybkie dodawanie transakcji
        const fabBtn = document.getElementById('fabBtn');
        if (fabBtn) {
            fabBtn.addEventListener('click', handleFabClick);
        }
        
        // Status online
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);
    }
    
    /**
     * FLOATING ACTION BUTTON - FAB
     */
    
    function handleFabClick() {
        // Przejdź do ekranu dodawania transakcji
        const ekranDodaj = document.getElementById('ekran-dodaj');
        const ekranGlowny = document.getElementById('ekran-glowny');
        
        // Ukryj główny ekran
        document.querySelectorAll('.ekran.active').forEach(el => {
            el.classList.remove('active');
        });
        
        // Pokaż ekran dodawania
        if (ekranDodaj) {
            ekranDodaj.classList.add('active');
            
            // Updatej nawigację
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.ekran === 'ekran-dodaj') {
                    btn.classList.add('active');
                }
            });
            
            // Ustaw fokus na pole kwoty dla UX
            setTimeout(() => {
                const kwotaInput = document.getElementById('kwota');
                if (kwotaInput) kwotaInput.focus();
            }, 100);
        }
        
        state.currentScreen = 'ekran-dodaj';
    }
    
    /**
     * NAWIGACJA MIĘDZY EKRANAMI
     */
    
    function handleNavigation(event) {
        const ekranId = event.currentTarget.dataset.ekran;
        if (!ekranId) return;
        
        // Zamknij aktualny ekran
        document.querySelectorAll('.ekran.active').forEach(el => {
            el.classList.remove('active');
        });
        
        // Otwórz nowy ekran
        const ekran = document.getElementById(ekranId);
        if (ekran) {
            ekran.classList.add('active');
            
            // Zaktualizuj nawigację
            document.querySelectorAll('.nav-btn.active').forEach(el => {
                el.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
            
            // Ustaw aktualny ekran
            state.currentScreen = ekranId;
            
            // Odśwież dane dla danego ekranu
            if (ekranId === 'ekran-glowny') {
                refreshDashboard();
            } else if (ekranId === 'ekran-statystyki') {
                refreshStatistics();
            } else if (ekranId === 'ekran-ustawienia') {
                loadSettings();
            }
        }
    }
    
    /**
     * DASHBOARD - EKRAN GŁÓWNY
     */
    
    function refreshDashboard() {
        console.log('[App] Odświeżanie dashboardu');
        
        // Pobierz podsumowanie
        const summary = DB.getSummary();
        
        // Zaktualizuj wartości
        updateSummaryValues(summary);
        
        // Załaduj przegląd miesięczny
        loadMonthlyOverview();
        
        // Załaduj ostatnie transakcje
        loadRecentTransactions();
        
        // Sprawdź limit wydatków
        checkLimitExceeded(summary);
    }
    
    /**
     * Zaktualizuj wartości podsumowania
     */
    function updateSummaryValues(summary) {
        const dochodElement = document.getElementById('sumaDochodów');
        const wydatekElement = document.getElementById('sumaWydatków');
        const bilanElement = document.getElementById('bilans');
        
        if (dochodElement) dochodElement.textContent = summary.dochody.toFixed(2) + ' zł';
        if (wydatekElement) wydatekElement.textContent = summary.wydatki.toFixed(2) + ' zł';
        if (bilanElement) {
            bilanElement.textContent = summary.bilans.toFixed(2) + ' zł';
            bilanElement.parentElement.className = 'summary-card bilans ' + (summary.bilans >= 0 ? 'positive' : 'negative');
        }
    }
    
    /**
     * Załaduj ostatnie transakcje
     */
    function loadRecentTransactions() {
        const listaElement = document.getElementById('listaTransakcji');
        if (!listaElement) return;
        
        const transakcje = DB.getTransakcje().slice(0, 10);
        
        if (transakcje.length === 0) {
            listaElement.innerHTML = '<p class="empty-state">Brak transakcji. Dodaj nową!</p>';
            return;
        }
        
        listaElement.innerHTML = transakcje.map(t => {
            const data = new Date(t.data).toLocaleDateString('pl-PL');
            const kategoria = getCategoryName(t.kategoria);
            const emoji = getCategoryEmoji(t.kategoria);
            
            return `
                <div class="transaction-item ${t.typ}">
                    <div class="transaction-info">
                        <div class="transaction-category">${emoji} ${kategoria}</div>
                        <div class="transaction-date">${data}</div>
                        ${t.opis ? `<div class="transaction-note">${t.opis}</div>` : ''}
                    </div>
                    <div class="transaction-amount ${t.typ}">${t.kwota.toFixed(2)} zł</div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Sprawdzenie przekroczenia limitu
     */
    function checkLimitExceeded(summary) {
        const settings = DB.getSettings();
        const limit = settings.limitWydatkow;
        
        if (settings.powiadomieniaLimitu && summary.wydatki > limit) {
            Notifications.notifyLimitExceeded(summary.wydatki, limit);
        } else if (settings.powiadomieniaLimitu && summary.wydatki > limit * 0.8) {
            const procent = Math.round((summary.wydatki / limit) * 100);
            Notifications.notifyLimitThreshold(procent);
        }
    }
    
    /**
     * Załaduj przegląd miesięczny
     */
    function loadMonthlyOverview() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Pobierz transakcje za bieżący miesiąc
        const transakcje = DB.getTransakcje();
        
        let monthlyIncome = 0;
        let monthlyExpense = 0;
        
        transakcje.forEach(t => {
            const tDate = new Date(t.data);
            if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
                if (t.typ === 'dochód') {
                    monthlyIncome += t.kwota;
                } else if (t.typ === 'wydatek') {
                    monthlyExpense += t.kwota;
                }
            }
        });
        
        const monthlySaldo = monthlyIncome - monthlyExpense;
        
        // Aktualizuj UI
        const monthlyDateEl = document.getElementById('monthlyDate');
        const monthlyIncomeEl = document.getElementById('monthlyIncome');
        const monthlyExpenseEl = document.getElementById('monthlyExpense');
        const monthlySaldoEl = document.getElementById('monthlySaldo');
        
        if (monthlyDateEl) {
            const monthName = new Date(currentYear, currentMonth).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
            monthlyDateEl.textContent = monthName;
        }
        
        if (monthlyIncomeEl) {
            monthlyIncomeEl.textContent = monthlyIncome.toFixed(2) + ' zł';
        }
        
        if (monthlyExpenseEl) {
            monthlyExpenseEl.textContent = monthlyExpense.toFixed(2) + ' zł';
        }
        
        if (monthlySaldoEl) {
            monthlySaldoEl.textContent = monthlySaldo.toFixed(2) + ' zł';
            monthlySaldoEl.style.color = monthlySaldo >= 0 ? 'var(--dochod-color)' : 'var(--wydatek-color)';
        }
    }
    
    /**
     * FORMULARZ - DODAWANIE TRANSAKCJI
     */
    
    function handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            // Pobierz dane z formularza
            const typ = document.getElementById('typ').value;
            const kategoria = document.getElementById('kategoria').value;
            const kwota = parseFloat(document.getElementById('kwota').value);
            const data = document.getElementById('data').value;
            const opis = document.getElementById('opis').value;
            
            // Walidacja
            if (!typ || !kategoria || !kwota || !data) {
                Notifications.notifyError('Błąd', 'Wypełnij wszystkie wymagane pola');
                return;
            }
            
            // Dodaj transakcję do bazy danych
            const transakcja = DB.addTransakcja(typ, kategoria, kwota, data, opis);
            
            // Powiadomienie
            Notifications.notifyTransactionAdded(transakcja);
            
            // Resetuj formularz
            event.target.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            
            // Odśwież dashboard
            refreshDashboard();
            
            // Sprawdź limit budżetu
            Notifications.checkBudgetReminders();
            
            console.log('[App] Transakcja dodana:', transakcja);
        } catch (error) {
            console.error('[App] Błąd przy dodawaniu transakcji:', error);
            Notifications.notifyError('Błąd', error.message);
        }
    }
    
    /**
     * Aktualizuj dostępne kategorie na podstawie typu
     */
    function updateCategories() {
        const typSelect = document.getElementById('typ');
        const kategoriaSelect = document.getElementById('kategoria');
        
        if (!typSelect || !kategoriaSelect) return;
        
        const typ = typSelect.value;
        const db = DB.getDatabase();
        
        // Wyczyść opcje
        kategoriaSelect.innerHTML = '<option value="">-- Wybierz kategorię --</option>';
        
        // Pobierz kategorie z bazy danych
        let categories = [];
        
        if (typ === 'wydatek') {
            categories = db.kategorie.wydatki || [];
        } else if (typ === 'dochód') {
            categories = db.kategorie.dochody || [];
        }
        
        // Helper do emoji
        const getEmoji = (cat) => {
            const emojis = {
                'jedzenie': '🍔', 'transport': '🚗', 'rozrywka': '🎬', 'zdrowie': '⚕️',
                'edukacja': '📚', 'inne': '📦', 'wyplata': '💼', 'premia': '🎁',
                'inwestycje': '📈', 'inne-dochod': '📦'
            };
            return emojis[cat] || '💰';
        };
        
        // Dodaj kategorie do selecta
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `${getEmoji(cat)} ${cat}`;
            kategoriaSelect.appendChild(option);
        });
    }
    
    /**
     * STATYSTYKI
     */
    
    function refreshStatistics() {
        console.log('[App] Odświeżanie statystyk');
        
        const miesiac = document.getElementById('filterMiesiac').value;
        const rok = document.getElementById('filterRok').value;
        
        const filters = {};
        if (miesiac !== '') filters.miesiac = miesiac;
        if (rok) filters.rok = rok;
        
        // Pobierz podsumowanie ze filtrami
        const summary = DB.getSummary(filters);
        
        // Pobierz statystyki po kategoriach
        const stats = DB.getStatisticsByCategory(filters);
        
        // Aktualizuj wartości
        updateStatisticsValues(summary);
        
        // Rysuj wykresy
        drawStatisticsCharts(stats, summary);
        
        // Załaduj tabelę kategorii
        loadCategoriesTable(stats);
    }
    
    /**
     * Zaktualizuj wartości na kartkach statystyk
     */
    function updateStatisticsValues(summary) {
        const dochodElement = document.getElementById('statDochodyCałkowite');
        const wydatekElement = document.getElementById('statWydatkiCałkowite');
        const saldoElement = document.getElementById('statSaldo');
        
        if (dochodElement) dochodElement.textContent = summary.dochody.toFixed(2) + ' zł';
        if (wydatekElement) wydatekElement.textContent = summary.wydatki.toFixed(2) + ' zł';
        if (saldoElement) {
            saldoElement.textContent = summary.bilans.toFixed(2) + ' zł';
            saldoElement.parentElement.style.color = summary.bilans >= 0 ? '#27ae60' : '#e74c3c';
        }
    }
    
    /**
     * Narysuj wykresy statystyk
     */
    function drawStatisticsCharts(stats, summary) {
        // Wykres kołowy wydatków po kategoriach
        const wydatkiStats = stats.filter(s => s.typ === 'wydatek');
        
        if (wydatkiStats.length > 0) {
            const chartData = wydatkiStats.map(s => ({
                label: getCategoryName(s.kategoria),
                value: s.kwota
            }));
            
            Charts.drawPieChart('chartWydatki', chartData);
        } else {
            Charts.drawNoData('chartWydatki', 'Brak danych o wydatkach');
        }
        
        // Wykres słupkowy dochody vs wydatki
        const barData = {
            label: 'Podsumowanie',
            dochody: summary.dochody,
            wydatki: summary.wydatki
        };
        
        Charts.drawBarChart('chartPortfolio', [barData]);
    }
    
    /**
     * Załaduj tabelę kategorii
     */
    function loadCategoriesTable(stats) {
        const tbody = document.getElementById('tabelaKategoriiBody');
        if (!tbody) return;
        
        if (stats.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="3">Brak danych</td></tr>';
            return;
        }
        
        const totalKwota = stats.reduce((sum, s) => sum + s.kwota, 0);
        
        tbody.innerHTML = stats.map(s => {
            const procent = ((s.kwota / totalKwota) * 100).toFixed(1);
            const emoji = getCategoryEmoji(s.kategoria);
            
            return `
                <tr>
                    <td>${emoji} ${getCategoryName(s.kategoria)}</td>
                    <td>${s.kwota.toFixed(2)} zł</td>
                    <td>${procent}%</td>
                </tr>
            `;
        }).join('');
    }
    
    /**
     * USTAWIENIA
     */
    
    function registerSettingsListeners() {
        // Ciemny motyw
        const ciemnyMotyw = document.getElementById('ciemnyMotyw');
        if (ciemnyMotyw) {
            ciemnyMotyw.addEventListener('change', toggleDarkTheme);
        }
        
        // Powiadomienia
        const powiadomieniaWlaczone = document.getElementById('powiadomieniaWlaczone');
        const powiadomieniaLimitu = document.getElementById('powiadomieniaLimitu');
        if (powiadomieniaWlaczone) {
            powiadomieniaWlaczone.addEventListener('change', saveSettings);
        }
        if (powiadomieniaLimitu) {
            powiadomieniaLimitu.addEventListener('change', saveSettings);
        }
        
        // Limit wydatków i waluta
        const limitWydatkow = document.getElementById('limitWydatkow');
        const waluty = document.getElementById('waluty');
        if (limitWydatkow) limitWydatkow.addEventListener('change', saveSettings);
        if (waluty) waluty.addEventListener('change', saveSettings);
        
        // Zarządzanie kategoriami - Event delegation na poziomie dokumentu
        const settingsContainer = document.getElementById('ekran-ustawienia');
        
        // Załaduj kategorie na początek
        loadCategoriesUI();
        
        // Delegacja zdarzeń - słuchamy na całym dokumencie
        setTimeout(() => {
            const newExpenseInput = document.getElementById('newExpenseCategory');
            const newIncomeInput = document.getElementById('newIncomeCategory');
            
            document.addEventListener('click', function handler(e) {
                const addExpenseBtn = document.getElementById('addExpenseCategoryBtn');
                const addIncomeBtn = document.getElementById('addIncomeCategoryBtn');
                
                if (e.target === addExpenseBtn || e.target?.parentElement === addExpenseBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[App] KLIK: Dodaj wydatki');
                    if (newExpenseInput) addNewCategory('wydatki', newExpenseInput);
                }
                
                if (e.target === addIncomeBtn || e.target?.parentElement === addIncomeBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[App] KLIK: Dodaj dochody');
                    if (newIncomeInput) addNewCategory('dochody', newIncomeInput);
                }
            });
        }, 100);
        
        // Enter key support
        const newExpenseInput = document.getElementById('newExpenseCategory');
        const newIncomeInput = document.getElementById('newIncomeCategory');
        
        if (newExpenseInput) {
            newExpenseInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addNewCategory('wydatki', newExpenseInput);
                }
            });
        }
        
        if (newIncomeInput) {
            newIncomeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addNewCategory('dochody', newIncomeInput);
                }
            });
        }
        
        // Eksport danych
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }
        
        // Import danych
        const importBtn = document.getElementById('importData');
        const fileInput = document.getElementById('fileInput');
        if (importBtn) {
            importBtn.addEventListener('click', () => fileInput.click());
        }
        if (fileInput) {
            fileInput.addEventListener('change', handleImport);
        }
        
        // Usuń wszystkie transakcje
        const usunWszystkie = document.getElementById('usunWszytkieTransakcje');
        if (usunWszystkie) {
            usunWszystkie.addEventListener('click', handleDeleteAllTransactions);
        }
        
        // Reset do ustawień domyślnych
        const resetBtn = document.getElementById('resetDoUstawienDomyslnych');
        if (resetBtn) {
            resetBtn.addEventListener('click', handleReset);
        }
    }
    
    /**
     * Załaduj ustawienia
     */
    function loadSettings() {
        const settings = DB.getSettings();
        
        const ciemnyMotyw = document.getElementById('ciemnyMotyw');
        const powiadomieniaWlaczone = document.getElementById('powiadomieniaWlaczone');
        const powiadomieniaLimitu = document.getElementById('powiadomieniaLimitu');
        const limitWydatkow = document.getElementById('limitWydatkow');
        const waluty = document.getElementById('waluty');
        
        if (ciemnyMotyw) ciemnyMotyw.checked = settings.ciemnyMotyw;
        if (powiadomieniaWlaczone) powiadomieniaWlaczone.checked = settings.powiadomieniaWlaczone;
        if (powiadomieniaLimitu) powiadomieniaLimitu.checked = settings.powiadomieniaLimitu;
        if (limitWydatkow) limitWydatkow.value = settings.limitWydatkow;
        if (waluty) waluty.value = settings.waluty;
        
        applyTheme(settings.ciemnyMotyw);
    }
    
    /**
     * Zapisz ustawienia
     */
    function saveSettings() {
        const settings = {
            ciemnyMotyw: document.getElementById('ciemnyMotyw')?.checked || false,
            powiadomieniaWlaczone: document.getElementById('powiadomieniaWlaczone')?.checked || true,
            powiadomieniaLimitu: document.getElementById('powiadomieniaLimitu')?.checked || true,
            limitWydatkow: parseFloat(document.getElementById('limitWydatkow')?.value || 3000),
            waluty: document.getElementById('waluty')?.value || 'PLN'
        };
        
        DB.saveSettings(settings);
        Notifications.notifySettingsSaved();
        applyTheme(settings.ciemnyMotyw);
    }
    
    /**
     * Toggle ciemny motyw
     */
    function toggleDarkTheme() {
        saveSettings();
    }
    
    /**
     * Zastosuj motyw
     */
    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    /**
     * Eksportuj dane
     */
    function handleExport() {
        try {
            const json = DB.exportToJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finansowy-tracker-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Notifications.notifyExported();
        } catch (error) {
            Notifications.notifyError('Błąd eksportu', error.message);
        }
    }
    
    /**
     * Importuj dane
     */
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target.result;
                DB.importFromJSON(json);
                
                const data = JSON.parse(json);
                const iloscTransakcji = data.database.transakcje.length;
                
                Notifications.notifyImported(iloscTransakcji);
                refreshDashboard();
                
                // Resetuj input
                document.getElementById('fileInput').value = '';
            } catch (error) {
                Notifications.notifyError('Błąd importu', error.message);
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * ZARZĄDZANIE KATEGORIAMI
     */
    
    function loadCategoriesUI() {
        const db = DB.getDatabase();
        
        // Helper do emoji
        const getEmoji = (cat) => {
            const emojis = {
                'jedzenie': '🍔', 'transport': '🚗', 'rozrywka': '🎬', 'zdrowie': '⚕️',
                'edukacja': '📚', 'inne': '📦', 'wyplata': '💼', 'premia': '🎁',
                'inwestycje': '📈', 'inne-dochod': '📦'
            };
            return emojis[cat] || '💰';
        };
        
        // Załaduj wydatki
        const wydatkiList = document.getElementById('kategorieWydatki');
        if (wydatkiList && db.kategorie.wydatki) {
            wydatkiList.innerHTML = db.kategorie.wydatki.map(cat => `
                <div class="category-tag">
                    <span>${getEmoji(cat)} ${cat}</span>
                    <button class="remove-btn" onclick="App.removeCategory('wydatki', '${cat}')">×</button>
                </div>
            `).join('');
        }
        
        // Załaduj dochody
        const dochodList = document.getElementById('kategorieDochody');
        if (dochodList && db.kategorie.dochody) {
            dochodList.innerHTML = db.kategorie.dochody.map(cat => `
                <div class="category-tag">
                    <span>${getEmoji(cat)} ${cat}</span>
                    <button class="remove-btn" onclick="App.removeCategory('dochody', '${cat}')">×</button>
                </div>
            `).join('');
        }
    }
    
    function addNewCategory(type, inputElement) {
        const categoryName = inputElement.value.trim().toLowerCase();
        
        // Walidacja
        if (!categoryName) {
            Notifications.warning('Puste pole', 'Wpisz nazwę kategorii');
            return;
        }
        
        if (categoryName.length < 2) {
            Notifications.warning('Za krótka', 'Nazwa kategorii musi mieć co najmniej 2 znaki');
            return;
        }
        
        if (categoryName.length > 30) {
            Notifications.warning('Za długa', 'Nazwa kategorii nie może mieć więcej niż 30 znaków');
            return;
        }
        
        // Sprawdź czy to nie liczby (case z inputu)
        if (/^\d+$/.test(categoryName)) {
            Notifications.warning('Błąd', 'Nazwa kategorii nie może być tylko liczbami');
            return;
        }
        
        console.log(`[App] Dodawanie kategorii: "${categoryName}" do typu "${type}"`);
        
        // Dodaj kategorię
        const success = DB.addCategory(type, categoryName);
        
        if (success) {
            Notifications.success('Kategoria dodana', `"${categoryName}" została dodana`);
            inputElement.value = '';
            loadCategoriesUI();
            
            // Odśwież opcje w formularzu
            updateCategories();
        } else {
            Notifications.error('Błąd', 'Kategoria już istnieje lub nie można jej dodać');
        }
    }
    
    // Handler dla HTML onclick
    function handleAddExpenseCategory() {
        console.log('[App] handleAddExpenseCategory wywołane');
        const input = document.getElementById('newExpenseCategory');
        if (input) addNewCategory('wydatki', input);
    }
    
    // Handler dla HTML onclick
    function handleAddIncomeCategory() {
        console.log('[App] handleAddIncomeCategory wywołane');
        const input = document.getElementById('newIncomeCategory');
        if (input) addNewCategory('dochody', input);
    }
    
    // Publiczna funkcja do usuwania kategorii (wywoływana z HTML)
    function removeCategory(type, categoryName) {
        Notifications.confirm(
            'Usuń kategorię',
            `Czy chcesz usunąć kategorię "${categoryName}"?`,
            () => {
                const success = DB.removeCategory(type, categoryName);
                
                if (success) {
                    Notifications.success('Usunięta', `Kategoria "${categoryName}" została usunięta`);
                    loadCategoriesUI();
                    updateCategories();
                } else {
                    Notifications.error('Błąd', 'Nie można usunąć tej kategorii');
                }
            }
        );
    }
    
    /**
     * Usuń wszystkie transakcje
     */
    function handleDeleteAllTransactions() {
        Notifications.confirm(
            'Usuń wszystkie transakcje',
            'Czy na pewno chcesz usunąć WSZYSTKIE transakcje? Tej operacji nie można cofnąć!',
            () => {
                DB.deleteAllTransakcje();
                Notifications.success('Usunięte', 'Wszystkie transakcje zostały usunięte');
                refreshDashboard();
            }
        );
    }
    
    /**
     * Reset do ustawień domyślnych
     */
    function handleReset() {
        Notifications.confirm(
            'Reset aplikacji',
            'Czy na pewno chcesz zresetować aplikację do ustawień domyślnych? Wszystkie dane zostaną usunięte!',
            () => {
                DB.reset();
                loadSettings();
                Notifications.success('Resetowano', 'Aplikacja została zresetowana');
                refreshDashboard();
            }
        );
    }
    
    /**
     * ONLINE STATUS
     */
    
    function updateOnlineStatus() {
        const status = navigator.onLine;
        state.isOnline = status;
        
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            if (status) {
                statusElement.textContent = '✓ Online';
                statusElement.className = 'sync-status online';
            } else {
                statusElement.textContent = '↻ Offline';
                statusElement.className = 'sync-status offline';
            }
        }
    }
    
    function handleOnlineStatusChange() {
        updateOnlineStatus();
        
        if (navigator.onLine) {
            Notifications.notifyOnlineMode();
            // Synchronizuj dane gdy wrócimy do online
            syncDataWhenOnline();
        } else {
            Notifications.notifyOfflineMode();
        }
    }
    
    /**
     * SYNCHRONIZACJA DANYCH
     * Synchronizuje dane które były zmieniane w offline mode
     */
    
    function syncDataWhenOnline() {
        console.log('[App] Rozpoczynanie synchronizacji danych');
        
        // Sprawdzenie czy są pending changes (oznaczone w bazie)
        const db = DB.getDatabase();
        
        // W naszym przypadku LocalStorage zawsze jest zsynchronizowany
        // ale możemy dodać log dla śledzenia
        const pendingChanges = db.transakcje.filter(t => t.pendingSync === true);
        
        if (pendingChanges.length > 0) {
            console.log(`[App] Znaleziono ${pendingChanges.length} pending zmian do synchronizacji`);
            
            // Tutaj mogłabyśmy wysłać na serwer (jeśli by był)
            // Na razie oznaczamy że dane są zsynchronizowane
            pendingChanges.forEach(t => {
                t.pendingSync = false;
            });
            
            DB.saveDatabase(db);
            Notifications.success('Synchronizacja', 'Dane zostały zsynchronizowane', { timeout: 3000 });
        } else {
            console.log('[App] Brak zmian do synchronizacji');
        }
        
        // Odśwież dashboard po sync
        refreshDashboard();
    }
    
    /**
     * HELPER FUNCTIONS
     */
    
    function getCategoryName(kategoria) {
        const names = {
            'jedzenie': 'Jedzenie',
            'transport': 'Transport',
            'rozrywka': 'Rozrywka',
            'zdrowie': 'Zdrowie',
            'edukacja': 'Edukacja',
            'inne': 'Inne',
            'wyplata': 'Wypłata',
            'premia': 'Premia',
            'inwestycje': 'Inwestycje',
            'inne-dochod': 'Inne'
        };
        return names[kategoria] || kategoria;
    }
    
    function getCategoryEmoji(kategoria) {
        const emojis = {
            'jedzenie': '🍔',
            'transport': '🚗',
            'rozrywka': '🎬',
            'zdrowie': '⚕️',
            'edukacja': '📚',
            'inne': '📦',
            'wyplata': '💼',
            'premia': '🎁',
            'inwestycje': '📈',
            'inne-dochod': '📦'
        };
        return emojis[kategoria] || '💰';
    }
    
    // Zwróć publiczne metody
    return {
        init,
        removeCategory,  // Wystawiony do globalnego scope dla onclick w HTML
        addNewCategory,  // Wystawiony do globalnego scope
        handleAddExpenseCategory,  // Handler dla przycisków
        handleAddIncomeCategory    // Handler dla przycisków
    };
})();

// Inicjalizuj aplikację po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Ustaw globalne handlery
        setupGlobalHandlers();
        App.init();
    });
} else {
    setupGlobalHandlers();
    App.init();
}

// Funkcja do ustawienia globalnych handlerów
function setupGlobalHandlers() {
    // Ustaw globalne funkcje dla HTML onclick
    window.App.handleAddExpenseCategory = function() {
        console.log('[Global] handleAddExpenseCategory');
        const input = document.getElementById('newExpenseCategory');
        if (input) App.addNewCategory('wydatki', input);
    };

    window.App.handleAddIncomeCategory = function() {
        console.log('[Global] handleAddIncomeCategory');
        const input = document.getElementById('newIncomeCategory');
        if (input) App.addNewCategory('dochody', input);
    };
    
    console.log('[Global] Handlery zostały ustawione');
}

console.log('[App] Moduł załadowany');
