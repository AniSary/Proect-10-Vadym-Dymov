/**
 * Notifications Module - Finansowy Tracker
 * System powiadomień i alertów dla użytkownika
 */

const Notifications = (() => {
    const NOTIFICATION_TIMEOUT = 5000; // 5 sekund
    const MAX_NOTIFICATIONS = 3; // Maksymalnie 3 powiadomienia na raz
    
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
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(title)}</div>
                <div class="notification-message">${escapeHtml(message)}</div>
            </div>
            <button class="notification-close" aria-label="Zamknij powiadomienie">✕</button>
        `;
        
        container.appendChild(notification);
        
        // Dodaj event listener do przycisku zamknięcia
        const closeBtn = notification.querySelector('.notification-close');
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
     * Bezpieczne escape'owanie HTML
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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
                icon: '/myapp/icons/icon-192.png',
                badge: '/myapp/icons/icon-96.png',
                ...options
            });
        }
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
        showSystemNotification
    };
})();

console.log('[Notifications] Moduł załadowany');
