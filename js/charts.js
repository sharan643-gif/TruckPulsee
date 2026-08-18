/* ═══════════════════════════════════════════════════════════════
   CHARTS — Apple-style canvas chart rendering
   Uses requestAnimationFrame for smooth, high-DPI rendering
   ═══════════════════════════════════════════════════════════════ */

const Charts = (() => {
  'use strict';

  /* ─── High-DPI canvas setup ─── */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height, dpr };
  }

  /* ─── Utility: draw smooth bezier curve through points ─── */
  function drawSmoothLine(ctx, points, { lineWidth = 2, strokeStyle = '#6ee7b7', fillStyle = null } = {}) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom to Bezier conversion
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Optional fill under the curve
    if (fillStyle) {
      ctx.lineTo(points[points.length - 1].x, points[0].y + (points[0].y - points[0].y) + 200);
      ctx.lineTo(points[0].x, points[0].y + (points[0].y - points[0].y) + 200);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
  }

  /* ─── Generic line/area chart ─── */
  function drawLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    const {
      color = '#6ee7b7',
      fillColor = null,
      labels = [],
      yMin = null,
      yMax = null,
      showGrid = true,
      showLabels = true,
      animate = true,
      lineWidth = 2.5,
    } = options;

    const padding = { top: 12, right: 12, bottom: showLabels ? 28 : 8, left: 12 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minVal = yMin !== null ? yMin : Math.min(...data) * 0.92;
    const maxVal = yMax !== null ? yMax : Math.max(...data) * 1.08;
    const range = maxVal - minVal || 1;

    // Map data to canvas coordinates
    function getPoints(progress = 1) {
      const count = Math.ceil(data.length * progress);
      return data.slice(0, count).map((val, i) => ({
        x: padding.left + (i / (data.length - 1)) * chartW,
        y: padding.top + (1 - (val - minVal) / range) * chartH,
      }));
    }

    function render(progress = 1) {
      ctx.clearRect(0, 0, width, height);

      // Grid lines
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (i / 4) * chartH;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(width - padding.right, y);
          ctx.stroke();
        }
      }

      const points = getPoints(progress);
      if (points.length < 2) return;

      // Gradient fill
      const fill = fillColor || (() => {
        const grad = ctx.createLinearGradient(0, padding.top, 0, height);
        const rgb = hexToRgb(color);
        if (rgb) {
          grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
          grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        }
        return grad;
      })();

      // Draw fill area
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        const t = 0.3;
        ctx.bezierCurveTo(
          p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t,
          p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t,
          p2.x, p2.y
        );
      }
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // Draw line
      drawSmoothLine(ctx, points, { lineWidth, strokeStyle: color });

      // End dot
      const last = points[points.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(last.x, last.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();

      // X-axis labels
      if (showLabels && labels.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const step = Math.ceil(labels.length / 6);
        labels.forEach((label, i) => {
          if (i % step === 0) {
            const x = padding.left + (i / (labels.length - 1)) * chartW;
            ctx.fillText(label, x, height - 6);
          }
        });
      }
    }

    if (animate) {
      let startTime = null;
      const duration = 1000;
      function animateIn(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        render(eased);
        if (progress < 1) requestAnimationFrame(animateIn);
      }
      requestAnimationFrame(animateIn);
    } else {
      render(1);
    }
  }

  /* ─── Health trend mini chart (Home page) ─── */
  function drawHealthTrend(canvasId) {
    const data = FleetData.generateTimeSeriesData(30, 75, 95, 8);
    const labels = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 29 + i);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });
    drawLineChart(canvasId, data, { color: '#6ee7b7', labels });
  }

  /* ─── Vibration signature chart (waveform) ─── */
  function drawVibrationChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { ctx, width, height } = setupCanvas(canvas);
    const padding = { top: 12, right: 12, bottom: 28, left: 12 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const midY = padding.top + chartH / 2;

    // Generate vibration waveform
    const points = [];
    const numPoints = 120;
    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      const x = padding.left + t * chartW;
      const amp = Math.sin(t * Math.PI * 8) * 0.4 +
                  Math.sin(t * Math.PI * 24) * 0.15 +
                  Math.sin(t * Math.PI * 48) * 0.05 +
                  (Math.random() - 0.5) * 0.08;
      const y = midY - amp * chartH * 0.8;
      points.push({ x, y });
    }

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, midY);
    ctx.lineTo(width - padding.right, midY);
    ctx.stroke();

    drawSmoothLine(ctx, points, {
      lineWidth: 1.5,
      strokeStyle: '#fbbf24',
      fillStyle: null,
    });

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Time →', width / 2, height - 6);
  }

  /* ─── Helper: hex to rgb ─── */
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  }

  /* ─── Redraw on resize ─── */
  function autoResize() {
    // Debounced resize handler
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (document.getElementById('healthTrendCanvas')) {
          drawHealthTrend('healthTrendCanvas');
        }
      }, 250);
    });
  }

  return {
    drawLineChart,
    drawHealthTrend,
    drawVibrationChart,
    autoResize,
  };
})();
