// --- 1. Konfigurasi Chart ---
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
                ticks: {
                    autoSkip: true,       // Fitur utama agar tidak bertumpuk
                    maxRotation: 45,      // Memiringkan teks label agar lebih hemat tempat
                    minRotation: 45,
                    maxTicksLimit: 10     // Maksimal label yang tampil di layar sekaligus
                }
            }
        }
    }
});

let maxPoints = 30;

// --- 2. Fungsi Helper (Di luar updateUI agar bisa diakses global) ---
function updateMaxData() {
    const durasi = document.getElementById('duration').value;
    // Logika untuk mengubah jumlah poin yang ditampilkan di chart
    // Misal: jika interval 2 detik, 1 menit = 30 poin
    maxPoints = parseInt(durasi) / 2;
    console.log("Maksimal titik data diubah ke:", maxPoints);
}

function simpanData(nilai) {
    const date = new Date();

    // Opsi format: 
    // weekday: 'long' (Sabtu)
    // hour: '2-digit', minute: '2-digit' (12:27)
    // hour12: false (memastikan format 24 jam agar tidak ada AM/PM)
    const waktuDisplay = date.toLocaleDateString('id-ID', {
        weekday: 'long'
    }) + ', ' + date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

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

function downloadFilteredJSON() {
    const history = JSON.parse(localStorage.getItem('sensorHistory')) || [];
    const filterValue = parseInt(document.getElementById('filterWaktu').value);
    const sekarang = Date.now();

    // Filter data yang waktunya masih dalam rentang yang dipilih
    const dataTerfilter = history.filter(item => {
        return (sekarang - item.timestamp) <= filterValue;
    });

    if (dataTerfilter.length === 0) {
        alert("Tidak ada data dalam rentang waktu tersebut!");
        return;
    }

    // Proses download
    const blob = new Blob([JSON.stringify(dataTerfilter)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_sensor_filter.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadFilteredCSV() {
    const history = JSON.parse(localStorage.getItem('sensorHistory')) || [];
    const filterValue = parseInt(document.getElementById('filterWaktu').value);
    const sekarang = Date.now();

    const dataTerFilter = history.filter(item => (sekarang - item.timestamp) <= filterValue);

    if (dataTerFilter.length === 0) {
        alert("data tidak tersedia ");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Waktu,Kelembaban (%)\n";
    dataTerFilter.forEach(row => {
        csvContent += `"${row.waktu}", "${row.nilai}"\n`;
    });

    const encodeUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodeUri);
    link.setAttribute("download", "data_sensor_filter.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}

function downloadJSON() {
    // 1. Ambil data dari localStorage
    const data = localStorage.getItem('sensorHistory');
    if (!data) {
        alert("Belum ada data untuk diunduh!");
        return;
    }

    // 2. Buat Blob (objek file) dari data JSON
    const blob = new Blob([data], { type: 'application/json' });

    // 3. Buat URL sementara untuk file tersebut
    const url = URL.createObjectURL(blob);

    // 4. Buat elemen <a> tersembunyi untuk memicu download
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_sensor_${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(a);
    a.click();

    // 5. Bersihkan URL setelah download selesai
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadAllCSV() {
    const history = JSON.parse(localStorage.getItem('sensorHistory') || []);
    if (history.length === 0) {
        alert("Data kosong!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Waktu,Kelembaban (%)\n";
    history.forEach(row => {
        csvContent += `${row.waktu}", "${row.nilai}"\n`;
    })

    const encodeUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodeUri);
    link.setAttribute("download", "data_sensor_filter.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


async function sendCommand(command) {
    const btn = event.target;
    btn.disabled = true;

    try {
        const endpoint = command === 'start' ? '/start' : '/stop';
        const res = await fetch(`http://192.168.1.74${endpoint}`);

        if (res.ok) {
            console.log(`Perintah ${command} berhasil dikirim`);
            // Opsional: berikan notifikasi visual
        }
    } catch (err) {
        alert("Gagal terhubung ke ESP32. Periksa jaringan!");
    } finally {
        btn.disabled = false; // Aktifkan kembali
    }
}

async function sendPumpCommand(state) {
    try {
        // Mengirim request ke ESP32 dengan parameter state
        const res = await fetch(`http://192.168.1.74/pump?state=${state}`);

        if (res.ok) {
            console.log(`Pompa berhasil diatur ke: ${state}`);
            alert(`Pompa telah diatur ke: ${state}`);
        }
    } catch (err) {
        alert("Gagal terhubung ke ESP32 untuk kontrol manual!");
    }
}
// --- 3. Fungsi Utama ---

async function updateUI() {
    try {
        const res = await fetch('http://192.168.1.74/data');
        if (!res.ok) throw new Error("Server tidak merespon");

        const text = await res.text();
        document.getElementById("sensorData").innerText = text;

        const match = text.match(/Kelembaban: (\d+)%/);
        if (match) {
            const val = parseInt(match[1]); // Ini adalah angka kelembaban (misal: 45)
            const now = new Date().toLocaleTimeString();

            if (moistureChart.data.labels.length > maxPoints) {
                moistureChart.data.labels.shift();
                moistureChart.data.datasets[0].data.shift();
            }

            // UPDATE GRAFIK
            moistureChart.data.labels.push(now);
            moistureChart.data.datasets[0].data.push(val);
            moistureChart.update('none');

            // PERBAIKAN DI SINI:
            // Pastikan Anda hanya mengirim 'val' (angka kelembaban)
            simpanData(val);
        }
    } catch (err) {
        console.warn("Menunggu data dari ESP32...");
    }
}

// Jalankan update
setInterval(updateUI, 2000);