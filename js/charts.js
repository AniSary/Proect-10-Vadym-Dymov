/**
 * Charts Module - Finansowy Tracker
 * Rysowanie wykresów statystyk finansowych
 * Biblioteka: Canvas API (natywna obsługa przeglądarki)
 */

const Charts = (() => {
    // Kolory dla wykresów
    const colors = {
        primary: '#3498db',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db',
        light: '#ecf0f1',
        dark: '#2c3e50',
        categories: [
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#FFA07A',
            '#98D8C8',
            '#F7DC6F',
            '#BB8FCE',
            '#85C1E2',
            '#F8B88B',
            '#FADBD8'
        ]
    };
    
    /**
     * Inicjalizuj wykresy
     */
    function init() {
        console.log('[Charts] Inicjalizacja modułu wykresów');
        // Wykresy będą rysowane na żądanie
    }
    
    /**
     * Narysuj wykres kołowy (Pie Chart)
     */
    function drawPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Ustawienia rozmiaru canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        // Normalizuj dane
        const normalizedData = normalizePieData(data);
        
        // Rysuj wykresy
        let startAngle = -Math.PI / 2;
        
        normalizedData.forEach((item, index) => {
            const sliceAngle = (item.value / normalizedData.reduce((sum, d) => sum + d.value, 0)) * 2 * Math.PI;
            
            // Rysuj segment
            drawPieSlice(ctx, centerX, centerY, radius, startAngle, startAngle + sliceAngle, colors.categories[index % colors.categories.length]);
            
            // Rysuj etykietę
            if (item.label && item.value > 0) {
                const labelAngle = startAngle + sliceAngle / 2;
                const labelRadius = radius * 0.7;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                
                drawLabel(ctx, item.label, item.value, labelX, labelY);
            }
            
            startAngle += sliceAngle;
        });
        
        // Rysuj legendę
        drawLegend(canvas, ctx, normalizedData, width);
        
        console.log('[Charts] Wykres kołowy narysowany:', canvasId);
    }
    
    /**
     * Narysuj segment koła
     */
    function drawPieSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Rysuj obramowanie
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    /**
     * Narysuj etykietę na wykresie
     */
    function drawLabel(ctx, label, value, x, y) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${value.toFixed(2)} zł`;
        ctx.fillText(text, x, y);
    }
    
    /**
     * Rysuj legendę
     */
    function drawLegend(canvas, ctx, data, width) {
        const legendY = canvas.height - 30 * Math.ceil(data.length / 3);
        const itemWidth = width / 3;
        
        data.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            
            const x = col * itemWidth + 10;
            const y = legendY + row * 25;
            
            // Kolor
            ctx.fillStyle = colors.categories[index % colors.categories.length];
            ctx.fillRect(x, y, 12, 12);
            
            // Tekst
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(item.label, x + 16, y - 2);
        });
    }
    
    /**
     * Narysuj wykres słupkowy (Bar Chart)
     */
    function drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Ustawienia rozmiaru canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Normalizuj dane
        const normalizedData = normalizeBarData(data);
        const maxValue = Math.max(...normalizedData.map(d => Math.max(d.dochody || 0, d.wydatki || 0)), 1);
        
        // Rysuj osie
        drawAxes(ctx, width, height, padding, maxValue);
        
        // Rysuj słupki
        const barWidth = chartWidth / (normalizedData.length * 2.5);
        const barSpacing = chartWidth / normalizedData.length;
        
        normalizedData.forEach((item, index) => {
            const x = padding + index * barSpacing + barSpacing / 2;
            
            // Dochody
            if (item.dochody && item.dochody > 0) {
                const barHeight = (item.dochody / maxValue) * chartHeight;
                drawBar(ctx, x - barWidth / 2 - 5, height - padding - barHeight, barWidth, barHeight, colors.success);
            }
            
            // Wydatki
            if (item.wydatki && item.wydatki > 0) {
                const barHeight = (item.wydatki / maxValue) * chartHeight;
                drawBar(ctx, x + barWidth / 2 + 5, height - padding - barHeight, barWidth, barHeight, colors.danger);
            }
            
            // Etykieta
            drawBarLabel(ctx, item.label, x, height - padding + 10);
        });
        
        console.log('[Charts] Wykres słupkowy narysowany:', canvasId);
    }
    
    /**
     * Narysuj słupek
     */
    function drawBar(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        // Obramowanie
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    /**
     * Narysuj osie wykresu
     */
    function drawAxes(ctx, width, height, padding, maxValue) {
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        
        // Oś X
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Oś Y
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // Linie pomocnicze na osi Y
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const y = padding + (height - 2 * padding) * (1 - i / steps);
            const value = (maxValue / steps) * i;
            
            ctx.strokeStyle = '#ecf0f1';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            // Etykieta wartości
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(0) + ' zł', padding - 10, y);
        }
    }
    
    /**
     * Narysuj etykietę słupka
     */
    function drawBarLabel(ctx, label, x, y) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y);
    }
    
    /**
     * Narysuj wykres liniowy (Line Chart)
     */
    function drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Ustawienia rozmiaru canvas
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        
        // Normalizuj dane
        const normalizedData = normalizeLineData(data);
        const maxValue = Math.max(...normalizedData.map(d => d.value), 1);
        
        // Rysuj osie
        drawAxes(ctx, width, height, padding, maxValue);
        
        // Rysuj linię
        drawLine(ctx, normalizedData, width, height, padding, maxValue);
        
        console.log('[Charts] Wykres liniowy narysowany:', canvasId);
    }
    
    /**
     * Narysuj linię wykresu
     */
    function drawLine(ctx, data, width, height, padding, maxValue) {
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Rysuj linię
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (point.value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Rysuj punkty
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (point.value / maxValue) * chartHeight;
            
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    /**
     * Normalizuj dane dla wykresu kołowego
     */
    function normalizePieData(data) {
        if (Array.isArray(data)) {
            return data.filter(d => d.value > 0);
        }
        
        return Object.entries(data)
            .map(([label, value]) => ({ label, value }))
            .filter(d => d.value > 0);
    }
    
    /**
     * Normalizuj dane dla wykresu słupkowego
     */
    function normalizeBarData(data) {
        if (Array.isArray(data)) {
            return data;
        }
        return [data];
    }
    
    /**
     * Normalizuj dane dla wykresu liniowego
     */
    function normalizeLineData(data) {
        if (Array.isArray(data)) {
            return data.map(d => ({
                label: d.label || '',
                value: d.value || 0
            }));
        }
        return [];
    }
    
    /**
     * Wyczyść canvas
     */
    function clearCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    /**
     * Narysuj placeholder kiedy brak danych
     */
    function drawNoData(canvasId, message = 'Brak danych') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Czyść canvas
        ctx.clearRect(0, 0, width, height);
        
        // Rysuj tekst
        ctx.fillStyle = '#7f8c8d';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);
    }
    
    // Zwróć publiczne metody
    return {
        init,
        drawPieChart,
        drawBarChart,
        drawLineChart,
        clearCanvas,
        drawNoData
    };
})();

// Inicjalizacja modułu
Charts.init();

console.log('[Charts] Moduł załadowany');
