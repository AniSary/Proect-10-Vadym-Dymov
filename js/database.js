/**
 * Database Module - Finansowy Tracker
 * Obsługa LocalStorage - przechowywanie danych aplikacji
 * Wzorzec: Singleton Pattern
 */

const DB = (() => {
    // Prywatne zmienne
    const STORAGE_KEY = 'finansowy-tracker-db';
    const SETTINGS_KEY = 'finansowy-tracker-settings';
    const VERSION = '1.0.0';
    
    // Domyślna struktura bazy danych
    const defaultDatabase = {
        version: VERSION,
        transakcje: [],
        kategorie: {
            wydatki: ['jedzenie', 'transport', 'rozrywka', 'zdrowie', 'edukacja', 'inne'],
            dochody: ['wyplata', 'premia', 'inwestycje', 'inne-dochod']
        }
    };
    
    // Domyślne ustawienia
    const defaultSettings = {
        limitWydatkow: 3000,
        waluty: 'PLN',
        ciemnyMotyw: false,
        powiadomieniaWlaczone: true,
        powiadomieniaLimitu: true
    };
    
    /**
     * Inicjalizacja bazy danych
     * Tworzy nową bazę, jeśli nie istnieje
     */
    function init() {
        console.log('[DB] Inicjalizacja bazy danych');
        
        // Sprawdź czy baza istnieje
        if (!localStorage.getItem(STORAGE_KEY)) {
            console.log('[DB] Tworzenie nowej bazy danych');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDatabase));
        }
        
        // Sprawdź czy ustawienia istnieją
        if (!localStorage.getItem(SETTINGS_KEY)) {
            console.log('[DB] Tworzenie nowych ustawień');
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        }
        
        // Migracja - jeśli wersja się nie zgadza
        const db = getDatabase();
        if (db.version !== VERSION) {
            console.log('[DB] Migracja bazy danych z wersji', db.version, 'do', VERSION);
            migrate(db);
        }
    }
    
    /**
     * Pobierz całą bazę danych
     */
    function getDatabase() {
        const db = localStorage.getItem(STORAGE_KEY);
        if (!db) {
            init();
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        }
        try {
            return JSON.parse(db);
        } catch (error) {
            console.error('[DB] Błąd parsowania bazy danych:', error);
            return defaultDatabase;
        }
    }
    
    /**
     * Zapisz całą bazę danych
     */
    function saveDatabase(db) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
            console.log('[DB] Baza danych zapisana');
            return true;
        } catch (error) {
            console.error('[DB] Błąd zapisywania bazy danych:', error);
            return false;
        }
    }
    
    /**
     * OPERACJE NA TRANSAKCJACH
     */
    
    /**
     * Dodaj nową transakcję
     */
    function addTransakcja(typ, kategoria, kwota, data, opis = '') {
        try {
            const db = getDatabase();
            
            const transakcja = {
                id: Date.now(),
                typ: typ,
                kategoria: kategoria,
                kwota: parseFloat(kwota),
                data: new Date(data).toISOString(),
                opis: opis,
                dataUtworzenia: new Date().toISOString()
            };
            
            // Walidacja
            if (!transakcja.kwota || transakcja.kwota <= 0) {
                throw new Error('Kwota musi być większa od 0');
            }
            
            db.transakcje.push(transakcja);
            saveDatabase(db);
            
            console.log('[DB] Transakcja dodana:', transakcja);
            return transakcja;
        } catch (error) {
            console.error('[DB] Błąd dodawania transakcji:', error);
            throw error;
        }
    }
    
    /**
     * Pobierz wszystkie transakcje
     */
    function getTransakcje() {
        const db = getDatabase();
        return db.transakcje.sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });
    }
    
    /**
     * Pobierz transakcje z filtrem
     */
    function getTransakcjeFiltered(filters = {}) {
        let transakcje = getTransakcje();
        
        // Filtr po typie
        if (filters.typ) {
            transakcje = transakcje.filter(t => t.typ === filters.typ);
        }
        
        // Filtr po kategorii
        if (filters.kategoria) {
            transakcje = transakcje.filter(t => t.kategoria === filters.kategoria);
        }
        
        // Filtr po dacie od
        if (filters.dataOd) {
            transakcje = transakcje.filter(t => 
                new Date(t.data) >= new Date(filters.dataOd)
            );
        }
        
        // Filtr po dacie do
        if (filters.dataDo) {
            transakcje = transakcje.filter(t => 
                new Date(t.data) <= new Date(filters.dataDo)
            );
        }
        
        // Filtr po miesiącu i roku
        if (filters.miesiac !== undefined && filters.rok !== undefined) {
            transakcje = transakcje.filter(t => {
                const data = new Date(t.data);
                return data.getMonth() === parseInt(filters.miesiac) && 
                       data.getFullYear() === parseInt(filters.rok);
            });
        }
        
        return transakcje;
    }
    
    /**
     * Pobierz transakcję po ID
     */
    function getTransakcjaById(id) {
        const transakcje = getTransakcje();
        return transakcje.find(t => t.id === id);
    }
    
    /**
     * Usuń transakcję po ID
     */
    function deleteTransakcja(id) {
        try {
            const db = getDatabase();
            db.transakcje = db.transakcje.filter(t => t.id !== id);
            saveDatabase(db);
            console.log('[DB] Transakcja usunięta, ID:', id);
            return true;
        } catch (error) {
            console.error('[DB] Błąd usuwania transakcji:', error);
            return false;
        }
    }
    
    /**
     * Aktualizuj transakcję
     */
    function updateTransakcja(id, updates) {
        try {
            const db = getDatabase();
            const transakcja = db.transakcje.find(t => t.id === id);
            
            if (!transakcja) {
                throw new Error('Transakcja nie znaleziona');
            }
            
            Object.assign(transakcja, updates, {
                dataModyfikacji: new Date().toISOString()
            });
            
            saveDatabase(db);
            console.log('[DB] Transakcja zaktualizowana:', transakcja);
            return transakcja;
        } catch (error) {
            console.error('[DB] Błąd aktualizacji transakcji:', error);
            throw error;
        }
    }
    
    /**
     * Usuń wszystkie transakcje
     */
    function deleteAllTransakcje() {
        try {
            const db = getDatabase();
            db.transakcje = [];
            saveDatabase(db);
            console.log('[DB] Wszystkie transakcje usunięte');
            return true;
        } catch (error) {
            console.error('[DB] Błąd usuwania wszystkich transakcji:', error);
            return false;
        }
    }
    
    /**
     * STATYSTYKI
     */
    
    /**
     * Oblicz podsumowanie (dochody, wydatki, bilans)
     */
    function getSummary(filters = {}) {
        const transakcje = getTransakcjeFiltered(filters);
        
        const dochody = transakcje
            .filter(t => t.typ === 'dochód')
            .reduce((sum, t) => sum + t.kwota, 0);
        
        const wydatki = transakcje
            .filter(t => t.typ === 'wydatek')
            .reduce((sum, t) => sum + t.kwota, 0);
        
        return {
            dochody: parseFloat(dochody.toFixed(2)),
            wydatki: parseFloat(wydatki.toFixed(2)),
            bilans: parseFloat((dochody - wydatki).toFixed(2))
        };
    }
    
    /**
     * Pobierz statystyki po kategoriach
     */
    function getStatisticsByCategory(filters = {}) {
        const transakcje = getTransakcjeFiltered(filters);
        const stats = {};
        
        transakcje.forEach(t => {
            if (!stats[t.kategoria]) {
                stats[t.kategoria] = {
                    kategoria: t.kategoria,
                    typ: t.typ,
                    kwota: 0,
                    ile: 0
                };
            }
            stats[t.kategoria].kwota += t.kwota;
            stats[t.kategoria].ile += 1;
        });
        
        return Object.values(stats);
    }
    
    /**
     * Pobierz statystyki po dniach
     */
    function getStatisticsByDay(filters = {}) {
        const transakcje = getTransakcjeFiltered(filters);
        const stats = {};
        
        transakcje.forEach(t => {
            const data = new Date(t.data).toLocaleDateString('pl-PL');
            if (!stats[data]) {
                stats[data] = {
                    data: data,
                    dochody: 0,
                    wydatki: 0
                };
            }
            
            if (t.typ === 'dochód') {
                stats[data].dochody += t.kwota;
            } else {
                stats[data].wydatki += t.kwota;
            }
        });
        
        return Object.values(stats);
    }
    
    /**
     * USTAWIENIA
     */
    
    /**
     * Pobierz ustawienia
     */
    function getSettings() {
        const settings = localStorage.getItem(SETTINGS_KEY);
        if (!settings) {
            return defaultSettings;
        }
        try {
            return JSON.parse(settings);
        } catch (error) {
            console.error('[DB] Błąd parsowania ustawień:', error);
            return defaultSettings;
        }
    }
    
    /**
     * Zapisz ustawienia
     */
    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            console.log('[DB] Ustawienia zapisane');
            return true;
        } catch (error) {
            console.error('[DB] Błąd zapisywania ustawień:', error);
            return false;
        }
    }
    
    /**
     * Aktualizuj ustawienie
     */
    function updateSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        return saveSettings(settings);
    }
    
    /**
     * EKSPORT I IMPORT
     */
    
    /**
     * Eksportuj dane do JSON
     */
    function exportToJSON() {
        try {
            const db = getDatabase();
            const settings = getSettings();
            const data = {
                database: db,
                settings: settings,
                exportDate: new Date().toISOString()
            };
            
            const json = JSON.stringify(data, null, 2);
            console.log('[DB] Dane wyeksportowane');
            return json;
        } catch (error) {
            console.error('[DB] Błąd eksportu:', error);
            throw error;
        }
    }
    
    /**
     * Importuj dane z JSON
     */
    function importFromJSON(json) {
        try {
            const data = JSON.parse(json);
            
            if (!data.database || !data.database.transakcje) {
                throw new Error('Nieprawidłowy format pliku');
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.database));
            if (data.settings) {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
            }
            
            console.log('[DB] Dane zaimportowane');
            return true;
        } catch (error) {
            console.error('[DB] Błąd importu:', error);
            throw error;
        }
    }
    
    /**
     * ZARZĄDZANIE KATEGORIAMI
     */
    
    /**
     * Dodaj nową kategorię
     */
    function addCategory(type, categoryName) {
        try {
            const db = getDatabase();
            const categories = db.kategorie[type];
            
            // Normalizuj nazwę (lowercase dla porównania)
            const normalized = categoryName.toLowerCase().trim();
            
            // Sprawdź czy już istnieje
            if (categories.some(cat => cat.toLowerCase() === normalized)) {
                console.log(`[DB] Kategoria "${categoryName}" już istnieje`);
                return false;
            }
            
            // Dodaj kategorię
            categories.push(categoryName);
            saveDatabase(db);
            
            console.log(`[DB] Kategoria "${categoryName}" dodana do "${type}"`);
            return true;
        } catch (error) {
            console.error('[DB] Błąd dodawania kategorii:', error);
            return false;
        }
    }
    
    /**
     * Usuń kategorię
     */
    function removeCategory(type, categoryName) {
        try {
            const db = getDatabase();
            const categories = db.kategorie[type];
            
            // Znaj kategorię i usuń
            const index = categories.indexOf(categoryName);
            if (index > -1) {
                categories.splice(index, 1);
                saveDatabase(db);
                
                console.log(`[DB] Kategoria "${categoryName}" usunięta z "${type}"`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[DB] Błąd usuwania kategorii:', error);
            return false;
        }
    }
    
    /**
     * Pobierz kategorię
     */
    function getCategories() {
        const db = getDatabase();
        return db.kategorie;
    }
    
    /**
     * MIGRACJA DANYCH
     */
    
    function migrate(db) {
        // Tutaj mogą być zmiany schemy w zależności od wersji
        if (db.version !== VERSION) {
            db.version = VERSION;
            saveDatabase(db);
        }
    }
    
    /**
     * RESETOWANIE
     */
    
    /**
     * Reset do ustawień domyślnych
     */
    function reset() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(SETTINGS_KEY);
            init();
            console.log('[DB] Baza danych zresetowana');
            return true;
        } catch (error) {
            console.error('[DB] Błąd resetu bazy danych:', error);
            return false;
        }
    }
    
    /**
     * Pobierz informacje o bazie danych
     */
    function getInfo() {
        const db = getDatabase();
        return {
            version: db.version,
            iloscTransakcji: db.transakcje.length,
            rozmir: new Blob([JSON.stringify(db)]).size,
            storage: localStorage
        };
    }
    
    // Zwróć publiczne metody
    return {
        init,
        // Transakcje
        addTransakcja,
        getTransakcje,
        getTransakcjeFiltered,
        getTransakcjaById,
        deleteTransakcja,
        updateTransakcja,
        deleteAllTransakcje,
        // Statystyki
        getSummary,
        getStatisticsByCategory,
        getStatisticsByDay,
        // Ustawienia
        getSettings,
        saveSettings,
        updateSetting,
        // Kategorie
        addCategory,
        removeCategory,
        getCategories,
        // Eksport/Import
        exportToJSON,
        importFromJSON,
        // Inne
        reset,
        getInfo,
        getDatabase,
        saveDatabase
    };
})();

// Inicjalizacja bazy danych po załadowaniu modułu
DB.init();

console.log('[Database] Moduł załadowany');
