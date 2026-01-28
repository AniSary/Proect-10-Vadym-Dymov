const DB = (() => {
    const STORAGE_KEY = 'finansowy-tracker-db';
    const SETTINGS_KEY = 'finansowy-tracker-settings';
    const VERSION = '1.0.0';
    
    const defaultDatabase = {
        version: VERSION,
        transakcje: [],
        kategorie: {
            wydatki: ['jedzenie', 'transport', 'rozrywka', 'zdrowie', 'edukacja', 'inne'],
            dochody: ['wyplata', 'premia', 'inwestycje', 'inne-dochod']
        }
    };
    
    const defaultSettings = {
        limitWydatkow: 3000,
        waluty: 'PLN',
        ciemnyMotyw: false,
        powiadomieniaWlaczone: true,
        powiadomieniaLimitu: true
    };
    
    function init() {
        console.log('[DB] Inicjalizacja bazy danych');
        
        if (!localStorage.getItem(STORAGE_KEY)) {
            console.log('[DB] Tworzenie nowej bazy danych');
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDatabase));
        }
        
        if (!localStorage.getItem(SETTINGS_KEY)) {
            console.log('[DB] Tworzenie nowych ustawień');
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
        }
        
        const db = getDatabase();
        if (db.version !== VERSION) {
            console.log('[DB] Migracja bazy danych z wersji', db.version, 'do', VERSION);
            migrate(db);
        }
    }
    
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
    
    function saveDatabase(db) {
        try {
            if (!window.localStorage) {
                throw new Error('localStorage nie jest dostępny w tej przeglądarce');
            }

            const jsonString = JSON.stringify(db);
            localStorage.setItem(STORAGE_KEY, jsonString);
            console.log('[DB] Baza danych zapisana');
            return true;
        } catch (error) {
            console.error('[DB] Błąd zapisywania bazy danych:', error);

            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.error('[DB] Przekroczono limit miejsca w localStorage');
            }

            return false;
        }
    }
    
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
    
    function getTransakcje() {
        const db = getDatabase();
        return db.transakcje.sort((a, b) => {
            return new Date(b.data) - new Date(a.data);
        });
    }
    
    function getTransakcjeFiltered(filters = {}) {
        let transakcje = getTransakcje();
        
        if (filters.typ) {
            transakcje = transakcje.filter(t => t.typ === filters.typ);
        }
        
        if (filters.kategoria) {
            transakcje = transakcje.filter(t => t.kategoria === filters.kategoria);
        }
        
        if (filters.dataOd) {
            transakcje = transakcje.filter(t => 
                new Date(t.data) >= new Date(filters.dataOd)
            );
        }
        
        if (filters.dataDo) {
            transakcje = transakcje.filter(t => 
                new Date(t.data) <= new Date(filters.dataDo)
            );
        }
        
        if (filters.miesiac !== undefined && filters.rok !== undefined) {
            transakcje = transakcje.filter(t => {
                const data = new Date(t.data);
                return data.getMonth() === parseInt(filters.miesiac) && 
                       data.getFullYear() === parseInt(filters.rok);
            });
        }
        
        return transakcje;
    }
    
    function getTransakcjaById(id) {
        const transakcje = getTransakcje();
        return transakcje.find(t => t.id === id);
    }
    
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
    
    function updateSetting(key, value) {
        const settings = getSettings();
        settings[key] = value;
        return saveSettings(settings);
    }
    
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
    
    function addCategory(type, categoryName) {
        try {
            console.log(`[DB.addCategory] Start: type="${type}", categoryName="${categoryName}"`);
            
            const db = getDatabase();
            console.log(`[DB.addCategory] DB kategorie:`, db.kategorie);
            
            const categories = db.kategorie[type];
            console.log(`[DB.addCategory] Categories dla type="${type}":`, categories);
            
            if (!categories) {
                console.error(`[DB.addCategory] Nie ma kategorii dla type="${type}"`);
                return false;
            }
            
            const normalized = categoryName.toLowerCase().trim();
            
            const exists = categories.some(cat => cat.toLowerCase() === normalized);
            console.log(`[DB.addCategory] Czy istnieje "${normalized}"?`, exists);
            
            if (exists) {
                console.log(`[DB] Kategoria "${categoryName}" już istnieje`);
                return false;
            }
            
            categories.push(categoryName);
            console.log(`[DB.addCategory] Po dodaniu:`, categories);
            
            const saved = saveDatabase(db);
            console.log(`[DB.addCategory] Zapisano do DB:`, saved);
            
            console.log(`[DB] Kategoria "${categoryName}" dodana do "${type}"`);
            return true;
        } catch (error) {
            console.error('[DB] Błąd dodawania kategorii:', error);
            return false;
        }
    }
    
    function removeCategory(type, categoryName) {
        try {
            const db = getDatabase();
            const categories = db.kategorie[type];
            
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
    
    function getCategories() {
        const db = getDatabase();
        return db.kategorie;
    }
    
    function migrate(db) {
        if (db.version !== VERSION) {
            db.version = VERSION;
            saveDatabase(db);
        }
    }
    
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
    
    function getInfo() {
        const db = getDatabase();
        return {
            version: db.version,
            iloscTransakcji: db.transakcje.length,
            rozmir: new Blob([JSON.stringify(db)]).size,
            storage: localStorage
        };
    }
    
    return {
        init,
        addTransakcja,
        getTransakcje,
        getTransakcjeFiltered,
        getTransakcjaById,
        deleteTransakcja,
        updateTransakcja,
        deleteAllTransakcje,
        getSummary,
        getStatisticsByCategory,
        getStatisticsByDay,
        getSettings,
        saveSettings,
        updateSetting,
        addCategory,
        removeCategory,
        getCategories,
        exportToJSON,
        importFromJSON,
        reset,
        getInfo,
        getDatabase,
        saveDatabase
    };
})();

DB.init();

console.log('[Database] Moduł załadowany');
