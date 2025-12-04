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
        
        console.log('[App] Inicjalizacja zakończona');
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
        
        // Status online
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);
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
        
        // Wyczyść opcje
        kategoriaSelect.innerHTML = '<option value="">-- Wybierz kategorię --</option>';
        
        if (typ === 'wydatek') {
            const kategoriesWydatki = [
                { value: 'jedzenie', text: '🍔 Jedzenie' },
                { value: 'transport', text: '🚗 Transport' },
                { value: 'rozrywka', text: '🎬 Rozrywka' },
                { value: 'zdrowie', text: '⚕️ Zdrowie' },
                { value: 'edukacja', text: '📚 Edukacja' },
                { value: 'inne', text: '📦 Inne' }
            ];
            
            kategoriesWydatki.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.value;
                option.textContent = cat.text;
                kategoriaSelect.appendChild(option);
            });
        } else if (typ === 'dochód') {
            const categoriesDochody = [
                { value: 'wyplata', text: '💼 Wypłata' },
                { value: 'premia', text: '🎁 Premia' },
                { value: 'inwestycje', text: '📈 Inwestycje' },
                { value: 'inne-dochod', text: '📦 Inne' }
            ];
            
            categoriesDochody.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.value;
                option.textContent = cat.text;
                kategoriaSelect.appendChild(option);
            });
        }
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
        } else {
            Notifications.notifyOfflineMode();
        }
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
        init
    };
})();

// Inicjalizuj aplikację po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}

console.log('[App] Moduł załadowany');
