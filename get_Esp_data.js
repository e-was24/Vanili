export async function Esp32Data() {
    try {
        const res = await fetch('http://192.168.1.74/data');
        const plainText = await res.text();
        const parts = plainText.split(" | ");

        const dataBersih = {
            status: parts[0]?.trim(), // "ON"
            analog: parts[1]?.split(':')[1]?.trim(), // "1971"
            kelembaban: parts[2]?.split(':')[1]?.trim() // "51%"
        };
        return dataBersih;
    } catch (err) {
        console.log("maaf data belum bisa dipanggil masih BOBOK...." + "\n" + err);
    }
}
