// --- 1. Konfigurasi Awal ---
// Menghubungkan ke Broker Public EMQX via WebSockets
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

client.on('connect', () => {
    console.log('Terhubung ke Broker Cloud!');
    // Berlangganan topik data kelembaban
    client.subscribe('kebun/sensor/moisture');
});

// --- 2. Konfigurasi Grafik (Chart.js) ---
const ctx = document.getElementById('moistureChart').getContext('2d');
const moistureChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Kelembaban (%)',
            data: [],
            borderColor: '#00ff00',
            backgroundColor: 'transparent',
            borderWidth: 1,
            tension: 0.1,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        animation: { duration: 500, easing: 'linear' },
        scales: {
            y: { grid: { color: '#333' }, beginAtZero: true, max: 100 },
            x: {
                grid: { color: '#333' },
                ticks: { autoSkip: true, maxRotation: 45, minRotation: 45, maxTicksLimit: 10 }
            }
        }
    }
});

let maxPoints = 30;

// --- 3. MQTT Message Handler (Ganti fungsi updateUI yang lama) ---
client.on('message', (topic, message) => {
    if (topic === 'kebun/sensor/moisture') {
        const val = parseInt(message.toString());
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Update teks di HTML
        document.getElementById("sensorData").innerText = "Kelembaban: " + val + "%";

        // Update Grafik
        if (moistureChart.data.labels.length > maxPoints) {
            moistureChart.data.labels.shift();
            moistureChart.data.datasets[0].data.shift();
        }
        moistureChart.data.labels.push(now);
        moistureChart.data.datasets[0].data.push(val);
        moistureChart.update('none');

        // Simpan ke localStorage
        simpanData(val);
    }
});

// --- 4. Fungsi Kontrol (MQTT Publish) ---
function sendCommand(command) {
    // Kirim perintah Start/Stop
    client.publish('kebun/sistem/set', command);
    console.log(`Perintah sistem ${command} dikirim ke Cloud`);
}

function sendPumpCommand(state) {
    // Kirim perintah ON/OFF Pompa
    client.publish('kebun/pompa/set', state);
    alert(`Perintah ${state} dikirim ke pompa!`);
}

// --- 5. Fungsi Helper & Data ---
function updateMaxData() {
    const durasi = document.getElementById('duration').value;
    maxPoints = parseInt(durasi) / 2;
}

function simpanData(nilai) {
    const date = new Date();
    const waktuDisplay = date.toLocaleDateString('id-ID', { weekday: 'long' }) + ', ' +
        date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    let history = JSON.parse(localStorage.getItem('sensorHistory')) || [];
    history.unshift({ timestamp: Date.now(), waktu: waktuDisplay, nilai });
    if (history.length > 5000) history.pop();
    localStorage.setItem('sensorHistory', JSON.stringify(history));
    updateTabel(history);
}

function updateTabel(data) {
    const tabel = document.getElementById('tabelData');
    const dataTerbaru = data.slice(0, 10);
    let html = `<tr><th>Waktu (Hari, Jam)</th><th>Kelembaban (%)</th></tr>`;
    dataTerbaru.forEach(row => {
        html += `<tr><td>${row.waktu}</td><td>${row.nilai}%</td></tr>`;
    });
    tabel.innerHTML = html;
}

// --- 6. Fungsi Download Data ---
function downloadFilteredJSON() {
    const history = JSON.parse(localStorage.getItem('sensorHistory')) || [];
    const filterValue = parseInt(document.getElementById('filterWaktu').value);
    const sekarang = Date.now();
    const dataTerfilter = history.filter(item => (sekarang - item.timestamp) <= filterValue);

    if (dataTerfilter.length === 0) return alert("Data kosong!");

    const blob = new Blob([JSON.stringify(dataTerfilter)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_sensor.json'; a.click();
}

function downloadFilteredCSV() {
    const history = JSON.parse(localStorage.getItem('sensorHistory')) || [];
    const filterValue = parseInt(document.getElementById('filterWaktu').value);
    const sekarang = Date.now();
    const data = history.filter(item => (sekarang - item.timestamp) <= filterValue);

    if (data.length === 0) return alert("Data kosong!");

    let csv = "Waktu,Kelembaban (%)\n";
    data.forEach(row => csv += `"${row.waktu}","${row.nilai}"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_sensor.csv'; a.click();
}