const Charts = (() => {
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
    
    function init() {
        console.log('[Charts] Inicjalizacja modułu wykresów');
    }
    
    function drawPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        const normalizedData = normalizePieData(data);
        
        let startAngle = -Math.PI / 2;
        
        normalizedData.forEach((item, index) => {
            const sliceAngle = (item.value / normalizedData.reduce((sum, d) => sum + d.value, 0)) * 2 * Math.PI;
            
            drawPieSlice(ctx, centerX, centerY, radius, startAngle, startAngle + sliceAngle, colors.categories[index % colors.categories.length]);
            
            if (item.label && item.value > 0) {
                const labelAngle = startAngle + sliceAngle / 2;
                const labelRadius = radius * 0.7;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                
                drawLabel(ctx, item.label, item.value, labelX, labelY);
            }
            
            startAngle += sliceAngle;
        });
        
        drawLegend(canvas, ctx, normalizedData, width);
        
        console.log('[Charts] Wykres kołowy narysowany:', canvasId);
    }
    
    function drawPieSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawLabel(ctx, label, value, x, y) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${value.toFixed(2)} zł`;
        ctx.fillText(text, x, y);
    }
    
    function drawLegend(canvas, ctx, data, width) {
        const legendY = canvas.height - 30 * Math.ceil(data.length / 3);
        const itemWidth = width / 3;
        
        data.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            
            const x = col * itemWidth + 10;
            const y = legendY + row * 25;
            
            ctx.fillStyle = colors.categories[index % colors.categories.length];
            ctx.fillRect(x, y, 12, 12);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(item.label, x + 16, y - 2);
        });
    }
    
    function drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const normalizedData = normalizeBarData(data);
        const maxValue = Math.max(...normalizedData.map(d => Math.max(d.dochody || 0, d.wydatki || 0)), 1);
        
        drawAxes(ctx, width, height, padding, maxValue);
        
        const barWidth = chartWidth / (normalizedData.length * 2.5);
        const barSpacing = chartWidth / normalizedData.length;
        
        normalizedData.forEach((item, index) => {
            const x = padding + index * barSpacing + barSpacing / 2;
            
            if (item.dochody && item.dochody > 0) {
                const barHeight = (item.dochody / maxValue) * chartHeight;
                drawBar(ctx, x - barWidth / 2 - 5, height - padding - barHeight, barWidth, barHeight, colors.success);
            }
            
            if (item.wydatki && item.wydatki > 0) {
                const barHeight = (item.wydatki / maxValue) * chartHeight;
                drawBar(ctx, x + barWidth / 2 + 5, height - padding - barHeight, barWidth, barHeight, colors.danger);
            }
            
            drawBarLabel(ctx, item.label, x, height - padding + 10);
        });
        
        console.log('[Charts] Wykres słupkowy narysowany:', canvasId);
    }
    
    function drawBar(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    function drawAxes(ctx, width, height, padding, maxValue) {
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
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
            
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(0) + ' zł', padding - 10, y);
        }
    }
    
    function drawBarLabel(ctx, label, x, y) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y);
    }
    
    function drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('[Charts] Canvas element nie znaleziony:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = rect.width;
        const height = rect.height;
        const padding = 40;
        
        const normalizedData = normalizeLineData(data);
        const maxValue = Math.max(...normalizedData.map(d => d.value), 1);
        
        drawAxes(ctx, width, height, padding, maxValue);
        
        drawLine(ctx, normalizedData, width, height, padding, maxValue);
        
        console.log('[Charts] Wykres liniowy narysowany:', canvasId);
    }
    
    function drawLine(ctx, data, width, height, padding, maxValue) {
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
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
        
        data.forEach((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (point.value / maxValue) * chartHeight;
            
            ctx.fillStyle = colors.primary;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    function normalizePieData(data) {
        if (Array.isArray(data)) {
            return data.filter(d => d.value > 0);
        }
        
        return Object.entries(data)
            .map(([label, value]) => ({ label, value }))
            .filter(d => d.value > 0);
    }
    
    function normalizeBarData(data) {
        if (Array.isArray(data)) {
            return data;
        }
        return [data];
    }
    
    function normalizeLineData(data) {
        if (Array.isArray(data)) {
            return data.map(d => ({
                label: d.label || '',
                value: d.value || 0
            }));
        }
        return [];
    }
    
    function clearCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    function drawNoData(canvasId, message = 'Brak danych') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = '#7f8c8d';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);
    }
    
    return {
        init,
        drawPieChart,
        drawBarChart,
        drawLineChart,
        clearCanvas,
        drawNoData
    };
})();

Charts.init();

console.log('[Charts] Moduł załadowany');
