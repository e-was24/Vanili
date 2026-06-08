import { Esp32Data } from './get_Esp_data.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const WelcomeText = `
HALLO SELAMAT DATANG!!! AKU SIAP BANTU KAMU JAGA TANAMAN KAMU...
`;

async function welcome() {

    console.log(WelcomeText);
    await delay(5000)
    console.clear();
}


async function showCaseData() {
    
    console.log("============ [ \x1b[31mLIVE\x1b[0m MONITORING via CMD ] ============");
    while (true) {
        const EspData = await Esp32Data();
        const StatusColor = EspData.status == 'ON' ? '\x1b[32m[ON]\x1b[0m' : '\x1b[31m[OFF]\x1b[0m';
    
        if (EspData) {
            process.stdout.write(`\r\x1b[31m[Live]\x1b[0m Status: ${StatusColor} | Analog: ${EspData.analog} | kelembaban: ${EspData.kelembaban}\x1b[K`);
        }
    
        await delay(1000);
    }
}


async function urutan() {
    await welcome();
    await showCaseData();
}

urutan();