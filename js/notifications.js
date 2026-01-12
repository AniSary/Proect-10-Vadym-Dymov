/**
 * Notifications Module - Finansowy Tracker
 * System powiadomień i alertów dla użytkownika
 */

const Notifications = (() => {
    // Stałe konfiguracyjne
    const NOTIFICATION_TIMEOUT = 5000; // 5 sekund
    const MAX_NOTIFICATIONS = 3; // Maksymalnie 3 powiadomienia na raz
    const GEOLOCATION_TIMEOUT = 5000; // 5 sekund na geolokację
    const GEOLOCATION_MAX_AGE = 3600000; // 1 godzina cache geolokacji

    // Ścieżki do ikon
    const ICON_PATH_192 = '/myapp/icons/icon-192.png';
    const ICON_PATH_96 = '/myapp/icons/icon-96.png';

    // Limity budżetowe
    const BUDGET_WARNING_THRESHOLD = 0.8; // 80% limitu
    
    /**
     * Wyświetl powiadomienie
     */
    function show(type, title, message, options = {}) {
        const container = document.getElementById('notificationsContainer');
        const timeout = options.timeout !== undefined ? options.timeout : NOTIFICATION_TIMEOUT;
        
        // Sprawdź limit powiadomień
        const existingNotifications = container.querySelectorAll('.notification');
        if (existingNotifications.length >= MAX_NOTIFICATIONS) {
            existingNotifications[0].remove();
        }
        
        // Utwórz element powiadomienia
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        // Utwórz zawartość powiadomienia
        const contentDiv = document.createElement('div');
        contentDiv.className = 'notification-content';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'notification-title';
        titleDiv.textContent = title;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'notification-message';
        messageDiv.textContent = message;

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(messageDiv);

        // Utwórz przycisk zamknięcia
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.setAttribute('aria-label', 'Zamknij powiadomienie');
        closeBtn.textContent = '✕';

        notification.appendChild(contentDiv);
        notification.appendChild(closeBtn);
        
        container.appendChild(notification);
        
        // Dodaj event listener do przycisku zamknięcia
        closeBtn.addEventListener('click', () => removeNotification(notification));
        
        // Automatyczne usunięcie po timeout
        if (timeout > 0) {
            setTimeout(() => {
                removeNotification(notification);
            }, timeout);
        }
        
        console.log(`[Notifications] ${type.toUpperCase()}: ${title} - ${message}`);
        
        return notification;
    }
    
    /**
     * Usuń powiadomienie
     */
    function removeNotification(notification) {
        if (!notification || !notification.parentNode) return;
        
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
    
    /**
     * Powiadomienie sukcesu
     */
    function success(title, message, options = {}) {
        return show('success', title, message, options);
    }
    
    /**
     * Powiadomienie błędu
     */
    function error(title, message, options = {}) {
        return show('error', title, message, options);
    }
    
    /**
     * Powiadomienie ostrzeżenia
     */
    function warning(title, message, options = {}) {
        return show('warning', title, message, options);
    }
    
    /**
     * Powiadomienie informacyjne
     */
    function info(title, message, options = {}) {
        return show('info', title, message, options);
    }
    
    /**
     * Usuń wszystkie powiadomienia
     */
    function clearAll() {
        const container = document.getElementById('notificationsContainer');
        const notifications = container.querySelectorAll('.notification');
        notifications.forEach(notif => removeNotification(notif));
    }
    
    /**
     * Pokaż potwierdzenie
     */
    function confirm(title, message, onConfirm, onCancel) {
        const notification = show('info', title, message, { timeout: 0 });
        
        const content = notification.querySelector('.notification-content');
        
        // Utwórz przyciski
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '8px';
        buttonsDiv.style.marginTop = '12px';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Potwierdź';
        confirmBtn.style.flex = '1';
        confirmBtn.style.padding = '8px';
        confirmBtn.style.background = '#27ae60';
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = 'none';
        confirmBtn.style.borderRadius = '4px';
        confirmBtn.style.cursor = 'pointer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Anuluj';
        cancelBtn.style.flex = '1';
        cancelBtn.style.padding = '8px';
        cancelBtn.style.background = '#e74c3c';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.cursor = 'pointer';
        
        buttonsDiv.appendChild(confirmBtn);
        buttonsDiv.appendChild(cancelBtn);
        content.appendChild(buttonsDiv);
        
        confirmBtn.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            removeNotification(notification);
        });
        
        cancelBtn.addEventListener('click', () => {
            if (onCancel) onCancel();
            removeNotification(notification);
        });
        
        return notification;
    }
    
    /**
     * Pokaż toast (szybkie powiadomienie)
     */
    function toast(message, type = 'info') {
        return show(type, '', message, { timeout: 3000 });
    }
    

    
    /**
     * Powiadomienia Business Logic
     */
    
    /**
     * Powiadomienie o transakcji
     */
    function notifyTransactionAdded(transakcja) {
        const categoryEmoji = getCategoryEmoji(transakcja.kategoria);
        const typeText = transakcja.typ === 'dochód' ? 'Dochód' : 'Wydatek';
        
        success(
            'Transakcja dodana',
            `${categoryEmoji} ${typeText}: ${transakcja.kwota.toFixed(2)} zł`,
            { timeout: 4000 }
        );
    }
    
    /**
     * Powiadomienie o transakcji usuniętej
     */
    function notifyTransactionDeleted() {
        success('Transakcja usunięta', 'Transakcja została usunięta z historii', { timeout: 3000 });
    }
    
    /**
     * Powiadomienie o przekroczeniu limitu
     */
    function notifyLimitExceeded(kwota, limit) {
        warning(
            'Limit wydatków przekroczony!',
            `Przeznaczyłeś już ${kwota.toFixed(2)} zł z limitu ${limit.toFixed(2)} zł`,
            { timeout: 0 }
        );
    }
    
    /**
     * Powiadomienie o osiągnięciu progu limitu
     */
    function notifyLimitThreshold(procent) {
        info(
            'Zbliżasz się do limitu',
            `Wydałeś już ${procent}% z dostępnego limitu`,
            { timeout: 5000 }
        );
    }
    
    /**
     * Powiadomienie o zapisaniu ustawień
     */
    function notifySettingsSaved() {
        success('Ustawienia zapisane', 'Twoje preferencje zostały zaktualizowane', { timeout: 3000 });
    }
    
    /**
     * Powiadomienie o eksporcie
     */
    function notifyExported() {
        success('Dane wyeksportowane', 'Dane zostały pobrane w formacie JSON', { timeout: 4000 });
    }
    
    /**
     * Powiadomienie o imporcie
     */
    function notifyImported(iloscTransakcji) {
        success(
            'Dane zaimportowane',
            `Wczytano ${iloscTransakcji} transakcji`,
            { timeout: 4000 }
        );
    }
    
    /**
     * Powiadomienie o błędzie
     */
    function notifyError(title, message) {
        error(title, message, { timeout: 5000 });
    }
    
    /**
     * Powiadomienie o braku danych
     */
    function notifyNoData() {
        info('Brak danych', 'Nie masz jeszcze żadnych transakcji', { timeout: 4000 });
    }
    
    /**
     * Powiadomienie o offline mode
     */
    function notifyOfflineMode() {
        info('Tryb offline', 'Pracujesz bez połączenia internetowego', { timeout: 0 });
    }
    
    /**
     * Powiadomienie o online mode
     */
    function notifyOnlineMode() {
        success('Online', 'Połączenie internetowe zostało przywrócone', { timeout: 3000 });
    }
    
    /**
     * Helper - pobierz emoji dla kategorii
     */
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
    
    /**
     * Powiadomienia systemowe - notifications API
     */
    function requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log('[Notifications] Uprawnienia do powiadomień zostały przyznane');
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    console.log('[Notifications] Pozwolenie:', permission);
                });
            }
        }
    }
    
    /**
     * Pokaż systemowe powiadomienie
     */
    function showSystemNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            return new Notification(title, {
                icon: ICON_PATH_192,
                badge: ICON_PATH_96,
                ...options
            });
        }
    }
    
    /**
     * SYSTEM PRZYPOMINAŃ BUDŻETU
     * Sprawdza czy użytkownik zbliża się do limitu wydatków
     */
    
    let lastReminderCheck = 0;
    const REMINDER_CHECK_INTERVAL = 60000; // Sprawdzaj co 1 minutę
    const THRESHOLDS = [50, 75, 90, 100]; // Progi alertów w %
    
    function checkBudgetReminders() {
        // Unikaj zbyt częstych sprawdzeń
        const now = Date.now();
        if (now - lastReminderCheck < REMINDER_CHECK_INTERVAL) {
            return;
        }
        lastReminderCheck = now;
        
        // Sprawdź czy powiadomienia budżetu są włączone
        const settings = DB.getSettings();
        if (!settings.powiadomieniaLimitu) {
            return;
        }
        
        // Oblicz wydatki za bieżący miesiąc
        const today = new Date();
        const monthlyExpenses = calculateMonthlyExpenses(
            today.getMonth(),
            today.getFullYear()
        );
        
        const limit = settings.limitWydatkow || 3000;
        const percentage = (monthlyExpenses / limit) * 100;
        
        console.log(`[Reminders] Wydatki: ${monthlyExpenses.toFixed(2)} / ${limit.toFixed(2)} (${percentage.toFixed(1)}%)`);
        
        // Sprawdź czy osiągnął jakiś próg i wyślij powiadomienie
        checkThresholdAndNotify(percentage, monthlyExpenses, limit);
    }
    
    function calculateMonthlyExpenses(month, year) {
        const db = DB.getDatabase();
        let total = 0;
        
        db.transakcje.forEach(t => {
            const transDate = new Date(t.data);
            if (t.typ === 'wydatek' && 
                transDate.getMonth() === month && 
                transDate.getFullYear() === year) {
                total += t.kwota;
            }
        });
        
        return total;
    }
    
    function checkThresholdAndNotify(percentage, spent, limit) {
        const reminderKey = `budget-reminder-${new Date().toDateString()}`;
        const shownReminders = localStorage.getItem('budget-reminders') 
            ? JSON.parse(localStorage.getItem('budget-reminders'))
            : {};
        
        // Sprawdź każdy próg
        THRESHOLDS.forEach(threshold => {
            if (percentage >= threshold) {
                const key = `${reminderKey}-${threshold}`;
                
                // Pokaż powiadomienie tylko raz dziennie na próg
                if (!shownReminders[key]) {
                    if (percentage >= 100) {
                        // Krytyczne - przekroczony limit
                        showBudgetExceededNotification(spent, limit);
                    } else if (percentage >= 90) {
                        // Ostrzeżenie - prawie limit
                        showBudgetWarningNotification(percentage, spent, limit);
                    } else if (percentage >= 75) {
                        // Info - sporo wydanych
                        showBudgetInfoNotification(percentage, spent, limit);
                    }
                    
                    // Zapamiętaj że pokazaliśmy to powiadomienie
                    shownReminders[key] = true;
                    localStorage.setItem('budget-reminders', JSON.stringify(shownReminders));
                }
            }
        });
    }
    
    function showBudgetExceededNotification(spent, limit) {
        const message = `Przekroczyłeś limit budżetu! Wydałeś ${spent.toFixed(2)} zł z limitu ${limit.toFixed(2)} zł`;
        
        // Powiadomienie w UI
        warning('⚠️ Limit przekroczony', message, { timeout: 0 });
        
        // Push notification
        showSystemNotification('Finansowy Tracker - Limit przekroczony', {
            body: message,
            tag: 'budget-exceeded',
            requireInteraction: true
        });
    }
    
    function showBudgetWarningNotification(percentage, spent, limit) {
        const message = `Bliski końcowi budżetu! Wydałeś ${percentage.toFixed(0)}% limitu (${spent.toFixed(2)} zł z ${limit.toFixed(2)} zł)`;
        
        warning('⚠️ Prawie limit', message, { timeout: 5000 });
        
        showSystemNotification('Finansowy Tracker - Prawie limit', {
            body: `Wydałeś ${percentage.toFixed(0)}% budżetu`,
            tag: 'budget-warning',
            badge: ICON_PATH_96
        });
    }
    
    function showBudgetInfoNotification(percentage, spent, limit) {
        const message = `Wydałeś już ${percentage.toFixed(0)}% budżetu (${spent.toFixed(2)} zł)`;
        
        info('💡 Przegląd budżetu', message, { timeout: 5000 });
    }
    
    // Zwróć publiczne metody
    return {
        // Metody podstawowe
        show,
        success,
        error,
        warning,
        info,
        toast,
        confirm,
        clearAll,
        removeNotification,
        // Business Logic
        notifyTransactionAdded,
        notifyTransactionDeleted,
        notifyLimitExceeded,
        notifyLimitThreshold,
        notifySettingsSaved,
        notifyExported,
        notifyImported,
        notifyError,
        notifyNoData,
        notifyOfflineMode,
        notifyOnlineMode,
        // System Notifications
        requestNotificationPermission,
        showSystemNotification,
        // Budget Reminders
        checkBudgetReminders
    };
})();

console.log('[Notifications] Moduł załadowany');
