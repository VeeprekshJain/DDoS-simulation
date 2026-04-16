const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pidusage = require('pidusage');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = 3001;

// Metrics Data
let metrics = {
    rps: 0,
    activeConnections: 0,
    totalRequests: 0,
    blockedRequests: 0,
    avgLatency: 0,
    cpuUsage: 0,
    ramUsage: 0,
    recentRequests: []
};

// State
let isRateLimitEnabled = false;
let requestCountInWindow = 0;
let latencySum = 0;

// Middleware for monitoring
app.use(cors());
app.use((req, res, next) => {
    const start = Date.now();
    metrics.totalRequests++;
    requestCountInWindow++;
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        latencySum += duration;
        
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            method: req.method,
            path: req.path,
            status: res.statusCode,
            ip: req.ip,
            latency: duration
        };
        
        metrics.recentRequests.unshift(logEntry);
        if (metrics.recentRequests.length > 20) metrics.recentRequests.pop();
        
        io.emit('request_log', logEntry);
    });
    
    next();
});

// Dynamic Rate Limiter
const dynamicLimiter = (req, res, next) => {
    if (isRateLimitEnabled) {
        return rateLimit({
            windowMs: 1000,
            max: 5, // Very strict for demo purposes
            handler: (req, res) => {
                metrics.blockedRequests++;
                res.status(429).json({ error: "Too many requests - Rate limit active" });
            }
        })(req, res, next);
    }
    next();
};

app.use(dynamicLimiter);

// Routes
app.get('/', (req, res) => {
    res.send('DDoS Target Server Active');
});

app.get('/api/data', (req, res) => {
    // Simulate some work
    setTimeout(() => {
        res.json({ message: "Success", timestamp: Date.now() });
    }, Math.random() * 50);
});

// Metric Calculation Loop (every second)
setInterval(async () => {
    metrics.rps = requestCountInWindow;
    metrics.avgLatency = requestCountInWindow > 0 ? (latencySum / requestCountInWindow).toFixed(2) : 0;
    
    try {
        const stats = await pidusage(process.pid);
        metrics.cpuUsage = stats.cpu.toFixed(1);
        metrics.ramUsage = (stats.memory / 1024 / 1024).toFixed(1);
    } catch (err) {
        console.error("Error getting process stats", err);
    }

    io.emit('metrics', {
        ...metrics,
        isRateLimitEnabled
    });

    // Reset window counters
    requestCountInWindow = 0;
    latencySum = 0;
}, 1000);

// Control Events
io.on('connection', (socket) => {
    console.log('Monitor connected');
    
    socket.on('toggle_defense', (enabled) => {
        isRateLimitEnabled = enabled;
        console.log(`Security Defense (Rate Limit): ${enabled ? 'ENABLED' : 'DISABLED'}`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Target Server running at http://0.0.0.0:${PORT} (accessible at http://192.168.138.1:${PORT})`);
    console.log(`WebSocket Metrics enabled on port ${PORT}`);
});
