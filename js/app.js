const App = (() => {
    const GEOLOCATION_TIMEOUT = 5000;
    const GEOLOCATION_MAX_AGE = 3600000;
    const BUDGET_WARNING_THRESHOLD = 0.8;

    let state = {
        currentScreen: 'ekran-glowny',
        isOnline: navigator.onLine
    };
    
    function init() {
        console.log('[App] Inicjalizacja aplikacji');
        
        const dateInput = document.getElementById('data');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        loadSettings();
        
        registerEventListeners();
        
        refreshDashboard();
        
        updateOnlineStatus();
        
        Notifications.requestNotificationPermission();
        
        detectLocationAndSetCurrency();
        
        console.log('[App] Inicjalizacja zakończona');
    }
    
    function detectLocationAndSetCurrency() {
        if (!navigator.geolocation) {
            console.log('[Geolocation] Geolocation API nie jest dostępna w tej przeglądarce');
            return;
        }
        
        const currentSettings = DB.getSettings();
        if (currentSettings.waluty && currentSettings.waluty !== 'PLN') {
            console.log('[Geolocation] Waluta już ustawiona na:', currentSettings.waluty);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => handleGeolocationSuccess(position),
            (error) => handleGeolocationError(error),
            { timeout: GEOLOCATION_TIMEOUT, maximumAge: GEOLOCATION_MAX_AGE }
        );
    }
    
    function handleGeolocationSuccess(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`[Geolocation] Lokalizacja: ${lat}, ${lng}`);
        
        const currency = mapCoordinatesToCurrency(lat, lng);
        
        if (currency && currency !== 'PLN') {
            console.log(`[Geolocation] Auto-ustawiono walutę na: ${currency}`);
            const settings = DB.getSettings();
            settings.waluty = currency;
            DB.saveSettings(settings);
            
            const currencySelect = document.getElementById('waluty');
            if (currencySelect) {
                currencySelect.value = currency;
            }
            
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
        if (lat >= 49 && lat <= 55 && lng >= 14 && lng <= 24) {
            return 'PLN';
        }
        
        if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) {
            if ((lat >= 48.5 && lat <= 54.5 && lng >= 5.5 && lng <= 15.5) ||
                (lat >= 43 && lat <= 51 && lng >= -5 && lng <= 8) ||
                (lat >= 40.5 && lat <= 48 && lng >= 4 && lng <= 20)) {
                return 'EUR';
            }
        }
        
        if (lat >= 24 && lat <= 50 && lng >= -125 && lng <= -66) {
            return 'USD';
        }
        
        return 'PLN';
    }
    
    function registerEventListeners() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', handleNavigation);
        });
        
        const formularz = document.getElementById('formularzTransakcji');
        if (formularz) {
            formularz.addEventListener('submit', handleFormSubmit);
            
            const typSelect = document.getElementById('typ');
            if (typSelect) {
                typSelect.addEventListener('change', updateCategories);
            }
        }
        
        const filterData = document.getElementById('filterData');
        const filterRok = document.getElementById('filterRok');
        if (filterData) filterData.addEventListener('change', refreshStatistics);
        if (filterRok) filterRok.addEventListener('change', refreshStatistics);
        
        registerSettingsListeners();
        
        const fabBtn = document.getElementById('fabBtn');
        if (fabBtn) {
            fabBtn.addEventListener('click', handleFabClick);
        }
        
        window.addEventListener('online', handleOnlineStatusChange);
        window.addEventListener('offline', handleOnlineStatusChange);
    }
    
    function handleFabClick() {
        const ekranDodaj = document.getElementById('ekran-dodaj');
        const ekranGlowny = document.getElementById('ekran-glowny');
        
        document.querySelectorAll('.ekran.active').forEach(el => {
            el.classList.remove('active');
        });
        
        if (ekranDodaj) {
            ekranDodaj.classList.add('active');
            
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.ekran === 'ekran-dodaj') {
                    btn.classList.add('active');
                }
            });
            
            setTimeout(() => {
                const kwotaInput = document.getElementById('kwota');
                if (kwotaInput) kwotaInput.focus();
            }, 100);
        }
        
        state.currentScreen = 'ekran-dodaj';
    }
    
    function handleNavigation(event) {
        const ekranId = event.currentTarget.dataset.ekran;
        if (!ekranId) return;
        
        document.querySelectorAll('.ekran.active').forEach(el => {
            el.classList.remove('active');
        });
        
        const ekran = document.getElementById(ekranId);
        if (ekran) {
            ekran.classList.add('active');
            
            document.querySelectorAll('.nav-btn.active').forEach(el => {
                el.classList.remove('active');
            });
            event.currentTarget.classList.add('active');
            
            state.currentScreen = ekranId;
            
            if (ekranId === 'ekran-glowny') {
                refreshDashboard();
            } else if (ekranId === 'ekran-statystyki') {
                refreshStatistics();
            } else if (ekranId === 'ekran-ustawienia') {
                loadSettings();
            }
        }
    }
    
    function refreshDashboard() {
        console.log('[App] Odświeżanie dashboardu');
        
        const summary = DB.getSummary();
        
        updateSummaryValues(summary);
        
        loadMonthlyOverview();
        
        loadRecentTransactions();
        
        checkLimitExceeded(summary);
    }
    
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
    
    function loadRecentTransactions() {
        const listaElement = document.getElementById('listaTransakcji');
        if (!listaElement) return;

        const transakcje = DB.getTransakcje().slice(0, 10);

        listaElement.innerHTML = '';

        if (transakcje.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Brak transakcji. Dodaj nową!';
            listaElement.appendChild(emptyState);
            return;
        }

        transakcje.forEach(t => {
            const data = new Date(t.data).toLocaleDateString('pl-PL');
            const kategoria = getCategoryName(t.kategoria);
            const emoji = getCategoryEmoji(t.kategoria);

            const transactionItem = document.createElement('div');
            transactionItem.className = `transaction-item ${t.typ}`;

            const transactionInfo = document.createElement('div');
            transactionInfo.className = 'transaction-info';

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'transaction-category';
            categoryDiv.textContent = `${emoji} ${kategoria}`;

            const dateDiv = document.createElement('div');
            dateDiv.className = 'transaction-date';
            dateDiv.textContent = data;

            transactionInfo.appendChild(categoryDiv);
            transactionInfo.appendChild(dateDiv);

            if (t.opis) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'transaction-note';
                noteDiv.textContent = t.opis;
                transactionInfo.appendChild(noteDiv);
            }

            const amountDiv = document.createElement('div');
            amountDiv.className = `transaction-amount ${t.typ}`;
            amountDiv.textContent = `${t.kwota.toFixed(2)} zł`;

            transactionItem.appendChild(transactionInfo);
            transactionItem.appendChild(amountDiv);

            listaElement.appendChild(transactionItem);
        });
    }
    
    function checkLimitExceeded(summary) {
        const settings = DB.getSettings();
        const limit = settings.limitWydatkow;
        
        if (settings.powiadomieniaLimitu && summary.wydatki > limit) {
            Notifications.notifyLimitExceeded(summary.wydatki, limit);
        } else if (settings.powiadomieniaLimitu && summary.wydatki > limit * BUDGET_WARNING_THRESHOLD) {
            const procent = Math.round((summary.wydatki / limit) * 100);
            Notifications.notifyLimitThreshold(procent);
        }
    }
    
    function loadMonthlyOverview() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
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
    
    function handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            const typ = document.getElementById('typ').value;
            const kategoria = document.getElementById('kategoria').value;
            const kwota = parseFloat(document.getElementById('kwota').value);
            const data = document.getElementById('data').value;
            const opis = document.getElementById('opis').value;
            
            if (!typ || !kategoria || !kwota || !data) {
                Notifications.notifyError('Błąd', 'Wypełnij wszystkie wymagane pola');
                return;
            }
            
            const transakcja = DB.addTransakcja(typ, kategoria, kwota, data, opis);
            
            Notifications.notifyTransactionAdded(transakcja);
            
            event.target.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            
            refreshDashboard();
            
            Notifications.checkBudgetReminders();
            
            console.log('[App] Transakcja dodana:', transakcja);
        } catch (error) {
            console.error('[App] Błąd przy dodawaniu transakcji:', error);
            Notifications.notifyError('Błąd', error.message);
        }
    }
    
    function updateCategories() {
        const typSelect = document.getElementById('typ');
        const kategoriaSelect = document.getElementById('kategoria');

        if (!typSelect || !kategoriaSelect) return;

        const typ = typSelect.value;
        const db = DB.getDatabase();

        kategoriaSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Wybierz kategorię --';
        kategoriaSelect.appendChild(defaultOption);

        let categories = [];

        if (typ === 'wydatek') {
            categories = db.kategorie.wydatki || [];
        } else if (typ === 'dochód') {
            categories = db.kategorie.dochody || [];
        }

        const getEmoji = (cat) => {
            const emojis = {
                'jedzenie': '🍔', 'transport': '🚗', 'rozrywka': '🎬', 'zdrowie': '⚕️',
                'edukacja': '📚', 'inne': '📦', 'wyplata': '💼', 'premia': '🎁',
                'inwestycje': '📈', 'inne-dochod': '📦'
            };
            return emojis[cat] || '💰';
        };

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `${getEmoji(cat)} ${cat}`;
            kategoriaSelect.appendChild(option);
        });
    }
    
    function refreshStatistics() {
        console.log('[App] Odświeżanie statystyk');
        
        const dataValue = document.getElementById('filterData').value;
        const rok = document.getElementById('filterRok').value;
        
        const filters = {};
        if (dataValue) {
            const date = new Date(dataValue);
            filters.miesiac = date.getMonth();
            filters.rok = date.getFullYear();
        }
        if (rok) filters.rok = rok;
        
        const summary = DB.getSummary(filters);
        
        const stats = DB.getStatisticsByCategory(filters);
        
        updateStatisticsValues(summary);
        
        drawStatisticsCharts(stats, summary);
        
        loadCategoriesTable(stats);
    }
    
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
    
    function drawStatisticsCharts(stats, summary) {
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
        
        const barData = {
            label: 'Podsumowanie',
            dochody: summary.dochody,
            wydatki: summary.wydatki
        };
        
        Charts.drawBarChart('chartPortfolio', [barData]);
    }
    
    function loadCategoriesTable(stats) {
        const tbody = document.getElementById('tabelaKategoriiBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (stats.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            const emptyCell = document.createElement('td');
            emptyCell.setAttribute('colspan', '3');
            emptyCell.textContent = 'Brak danych';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }

        const totalKwota = stats.reduce((sum, s) => sum + s.kwota, 0);

        stats.forEach(s => {
            const procent = ((s.kwota / totalKwota) * 100).toFixed(1);
            const emoji = getCategoryEmoji(s.kategoria);

            const row = document.createElement('tr');

            const categoryCell = document.createElement('td');
            categoryCell.textContent = `${emoji} ${getCategoryName(s.kategoria)}`;

            const amountCell = document.createElement('td');
            amountCell.textContent = `${s.kwota.toFixed(2)} zł`;

            const percentCell = document.createElement('td');
            percentCell.textContent = `${procent}%`;

            row.appendChild(categoryCell);
            row.appendChild(amountCell);
            row.appendChild(percentCell);

            tbody.appendChild(row);
        });
    }
    
    function registerSettingsListeners() {
        const ciemnyMotyw = document.getElementById('ciemnyMotyw');
        if (ciemnyMotyw) {
            ciemnyMotyw.addEventListener('change', toggleDarkTheme);
        }
        
        const powiadomieniaWlaczone = document.getElementById('powiadomieniaWlaczone');
        const powiadomieniaLimitu = document.getElementById('powiadomieniaLimitu');
        if (powiadomieniaWlaczone) {
            powiadomieniaWlaczone.addEventListener('change', saveSettings);
        }
        if (powiadomieniaLimitu) {
            powiadomieniaLimitu.addEventListener('change', saveSettings);
        }
        
        const limitWydatkow = document.getElementById('limitWydatkow');
        const waluty = document.getElementById('waluty');
        if (limitWydatkow) limitWydatkow.addEventListener('change', saveSettings);
        if (waluty) waluty.addEventListener('change', saveSettings);
        
        const settingsContainer = document.getElementById('ekran-ustawienia');
        
        loadCategoriesUI();
        
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
        
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExport);
        }
        
        const importBtn = document.getElementById('importData');
        const fileInput = document.getElementById('fileInput');
        if (importBtn) {
            importBtn.addEventListener('click', () => fileInput.click());
        }
        if (fileInput) {
            fileInput.addEventListener('change', handleImport);
        }
        
        const usunWszystkie = document.getElementById('usunWszytkieTransakcje');
        if (usunWszystkie) {
            usunWszystkie.addEventListener('click', handleDeleteAllTransactions);
        }
        
        const resetBtn = document.getElementById('resetDoUstawienDomyslnych');
        if (resetBtn) {
            resetBtn.addEventListener('click', handleReset);
        }
    }
    
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
    
    function toggleDarkTheme() {
        saveSettings();
    }
    
    function applyTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
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
    
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            Notifications.notifyError('Błąd importu', 'Wybierz plik JSON');
            return;
        }

        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            Notifications.notifyError('Błąd importu', 'Plik jest zbyt duży (maksymalnie 10MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target.result;

                const data = JSON.parse(json);

                if (!data.database || !Array.isArray(data.database.transakcje)) {
                    throw new Error('Nieprawidłowa struktura pliku JSON');
                }

                DB.importFromJSON(json);

                const iloscTransakcji = data.database.transakcje.length;
                
                Notifications.notifyImported(iloscTransakcji);
                refreshDashboard();
                
                document.getElementById('fileInput').value = '';
            } catch (error) {
                Notifications.notifyError('Błąd importu', error.message);
            }
        };
        reader.readAsText(file);
    }
    
    function loadCategoriesUI() {
        const db = DB.getDatabase();

        const getEmoji = (cat) => {
            const emojis = {
                'jedzenie': '🍔', 'transport': '🚗', 'rozrywka': '🎬', 'zdrowie': '⚕️',
                'edukacja': '📚', 'inne': '📦', 'wyplata': '💼', 'premia': '🎁',
                'inwestycje': '📈', 'inne-dochod': '📦'
            };
            return emojis[cat] || '💰';
        };

        const wydatkiList = document.getElementById('kategorieWydatki');
        if (wydatkiList && db.kategorie.wydatki) {
            wydatkiList.innerHTML = '';

            db.kategorie.wydatki.forEach(cat => {
                const categoryTag = document.createElement('div');
                categoryTag.className = 'category-tag';

                const span = document.createElement('span');
                span.textContent = `${getEmoji(cat)} ${cat}`;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => removeCategory('wydatki', cat);

                categoryTag.appendChild(span);
                categoryTag.appendChild(removeBtn);

                wydatkiList.appendChild(categoryTag);
            });
        }

        const dochodList = document.getElementById('kategorieDochody');
        if (dochodList && db.kategorie.dochody) {
            dochodList.innerHTML = '';

            db.kategorie.dochody.forEach(cat => {
                const categoryTag = document.createElement('div');
                categoryTag.className = 'category-tag';

                const span = document.createElement('span');
                span.textContent = `${getEmoji(cat)} ${cat}`;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = '×';
                removeBtn.onclick = () => removeCategory('dochody', cat);

                categoryTag.appendChild(span);
                categoryTag.appendChild(removeBtn);

                dochodList.appendChild(categoryTag);
            });
        }
    }
    
    function addNewCategory(type, inputElement) {
        const categoryName = inputElement.value.trim().toLowerCase();
        
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
        
        if (/^\d+$/.test(categoryName)) {
            Notifications.warning('Błąd', 'Nazwa kategorii nie może być tylko liczbami');
            return;
        }
        
        console.log(`[App] Dodawanie kategorii: "${categoryName}" do typu "${type}"`);
        
        const success = DB.addCategory(type, categoryName);
        
        if (success) {
            Notifications.success('Kategoria dodana', `"${categoryName}" została dodana`);
            inputElement.value = '';
            loadCategoriesUI();
            
            updateCategories();
        } else {
            Notifications.error('Błąd', 'Kategoria już istnieje lub nie można jej dodać');
        }
    }
    
    function handleAddExpenseCategory() {
        console.log('[App] handleAddExpenseCategory wywołane');
        const input = document.getElementById('newExpenseCategory');
        if (input) addNewCategory('wydatki', input);
    }
    
    function handleAddIncomeCategory() {
        console.log('[App] handleAddIncomeCategory wywołane');
        const input = document.getElementById('newIncomeCategory');
        if (input) addNewCategory('dochody', input);
    }
    
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
            syncDataWhenOnline();
        } else {
            Notifications.notifyOfflineMode();
        }
    }
    
    function syncDataWhenOnline() {
        console.log('[App] Rozpoczynanie synchronizacji danych');
        
        const db = DB.getDatabase();
        
        const pendingChanges = db.transakcje.filter(t => t.pendingSync === true);
        
        if (pendingChanges.length > 0) {
            console.log(`[App] Znaleziono ${pendingChanges.length} pending zmian do synchronizacji`);
            
            pendingChanges.forEach(t => {
                t.pendingSync = false;
            });
            
            DB.saveDatabase(db);
            Notifications.success('Synchronizacja', 'Dane zostały zsynchronizowane', { timeout: 3000 });
        } else {
            console.log('[App] Brak zmian do synchronizacji');
        }
        
        refreshDashboard();
    }
    
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
    
    return {
        init,
        removeCategory,
        addNewCategory,
        handleAddExpenseCategory,
        handleAddIncomeCategory
    };
})();

document.addEventListener('DOMContentLoaded', function setupGlobalHandlers() {
    console.log('[Setup] Ustawianie globalnych handlerów...');
    
    window.App.handleAddExpenseCategory = function() {
        console.log('[Global] handleAddExpenseCategory');
        const input = document.getElementById('newExpenseCategory');
        if (input && App.addNewCategory) {
            App.addNewCategory('wydatki', input);
        }
    };

    window.App.handleAddIncomeCategory = function() {
        console.log('[Global] handleAddIncomeCategory');
        const input = document.getElementById('newIncomeCategory');
        if (input && App.addNewCategory) {
            App.addNewCategory('dochody', input);
        }
    };
    
    window.App.removeCategory = App.removeCategory;
    
    console.log('[Setup] Globalne handlery ustawione');
    console.log('[Setup] window.App.handleAddExpenseCategory:', typeof window.App.handleAddExpenseCategory);
    console.log('[Setup] window.App.handleAddIncomeCategory:', typeof window.App.handleAddIncomeCategory);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}

console.log('[App] Moduł załadowany');
