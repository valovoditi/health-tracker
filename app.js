// App logic for health tracker PWA

const app = {
  // Quick log navigation
  quickLog(type) {
    switch (type) {
      case 'glucose': window.location = 'tracking.html#glucose-form'; break;
      case 'meal': window.location = 'nutrition.html#recipe-form'; break;
      case 'exercise': window.location = 'exercise.html#exercise-form'; break;
      case 'sleep': window.location = 'tracking.html#sleep-form'; break;
      default: break;
    }
  },

  // Data Storage Handlers
  saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  loadData(key, fallback = []) {
    let raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },

  // Dashboard Updaters
  updateDashboard() {
    // Update quick stats (today's data)
    let glucose = this.loadData('glucose', []).filter(r => this.isToday(r.timestamp));
    let calories = this.loadData('meals', []).filter(r => this.isToday(r.timestamp)).reduce((a, r) => a + (r.calories || 0), 0);
    let water = this.loadData('water', []).filter(r => this.isToday(r.timestamp)).reduce((a, r) => a + (r.amount || 0), 0);
    let exercise = this.loadData('exercise', []).filter(r => this.isToday(r.timestamp)).reduce((a, r) => a + (r.duration || 0), 0);
    document.getElementById('today-glucose') && (document.getElementById('today-glucose').textContent = glucose.length ? glucose[glucose.length-1].glucose : '--');
    document.getElementById('today-calories') && (document.getElementById('today-calories').textContent = calories);
    document.getElementById('today-water') && (document.getElementById('today-water').textContent = water);
    document.getElementById('today-exercise') && (document.getElementById('today-exercise').textContent = exercise);

    // Charts (last 7 days)
    if (typeof Chart !== 'undefined') {
      let glucoseData = this.lastNDays('glucose', 7, 'glucose');
      let exData = this.lastNDays('exercise', 7, 'duration');
      this.renderChart('glucoseChart', glucoseData, 'Glucose (mg/dL)');
      this.renderChart('exerciseChart', exData, 'Exercise (min)');
    }
  },

  // Utility: filter last N days of data
  lastNDays(key, days, field) {
    let arr = this.loadData(key, []);
    let out = [];
    for (let i = days - 1; i >= 0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      let ymd = d.toISOString().slice(0, 10);
      let recs = arr.filter(r => (r.timestamp || r.date || '').startsWith(ymd));
      let val = recs.length ? recs[recs.length-1][field] : 0;
      out.push({ date: ymd, value: val });
    }
    return out;
  },

  // Chart Renderer
  renderChart(canvasId, data, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label,
          data: data.map(d => d.value),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33,150,243,0.1)',
          fill: true,
        }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  },

  // Utility: check if timestamp is today
  isToday(ts) {
    if (!ts) return false;
    let today = new Date().toISOString().slice(0, 10);
    return ts.startsWith(today);
  },

  // Export Data as CSV
  exportData() {
    let keys = ['glucose', 'water', 'sleep', 'exercise', 'meals'];
    let blob = '';
    keys.forEach(k => {
      let arr = this.loadData(k, []);
      if (arr.length) {
        blob += `\n${k.toUpperCase()}\n`;
        blob += Object.keys(arr[0]).join(',') + '\n';
        arr.forEach(row => {
          blob += Object.values(row).join(',') + '\n';
        });
      }
    });
    let url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = 'health_data.csv';
    a.click();
  },

  // Reset Data
  resetData() {
    if (confirm('Delete ALL your health data?')) {
      ['glucose', 'water', 'sleep', 'exercise', 'meals', 'goals'].forEach(k => localStorage.removeItem(k));
      location.reload();
    }
  },

  // Settings & Goals Management
  saveGoals(goals) {
    this.saveData('goals', goals);
    this.updateDashboard();
    document.getElementById('goals-messages').textContent = 'Goals saved!';
  },

  // Placeholder for cloud sync (Firebase)
  cloudSyncInit() {
    if (window.firebase && window.firebase.auth && window.firebase.firestore) {
      // Firebase logic (abstracted for brevity; see README for full integration)
      document.getElementById('firebase-status').textContent = 'Cloud Sync Enabled';
      // ...init firebase, auth, db listeners
    }
  },
};

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
  app.updateDashboard();
  app.cloudSyncInit();
  // Add more event handlers for forms and navigation as needed
});
