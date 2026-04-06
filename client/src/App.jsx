import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Shield, ShieldAlert, Zap, Server as ServerIcon, Cpu, Database } from 'lucide-react';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [metrics, setMetrics] = useState({
    rps: 0,
    activeConnections: 0,
    totalRequests: 0,
    blockedRequests: 0,
    avgLatency: 0,
    cpuUsage: 0,
    ramUsage: 0,
    recentRequests: [],
    isRateLimitEnabled: false
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    socket.on('metrics', (data) => {
      setMetrics(data);
      setHistory(prev => {
        const newHistory = [...prev, { 
          time: new Date().toLocaleTimeString(), 
          rps: data.rps, 
          latency: parseFloat(data.avgLatency) 
        }];
        if (newHistory.length > 30) newHistory.shift();
        return newHistory;
      });
    });

    return () => {
      socket.off('metrics');
    };
  }, []);

  const toggleDefense = () => {
    socket.emit('toggle_defense', !metrics.isRateLimitEnabled);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 style={{margin: 0, fontSize: '1.5rem'}}>Network Traffic Monitor</h1>
          <p style={{margin: 0, color: '#7f8c8d'}}>DDoS Lab Assessment Tools</p>
        </div>
        <div className="defense-controls">
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            {metrics.isRateLimitEnabled ? <ShieldAlert color="#e74c3c" /> : <Shield color="#27ae60" />}
            <span style={{fontWeight: 'bold'}}>Rate Limiting: {metrics.isRateLimitEnabled ? 'ON' : 'OFF'}</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={metrics.isRateLimitEnabled} onChange={toggleDefense} />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Requests / Sec</h3>
          <div className="value" style={{color: metrics.rps > 20 ? '#e74c3c' : '#2c3e50'}}>
            <Zap size={20} style={{marginRight: 8}} inline />
            {metrics.rps}
          </div>
        </div>
        <div className="stat-card">
          <h3>Avg Latency</h3>
          <div className="value">
            <Activity size={20} style={{marginRight: 8}} inline />
            {metrics.avgLatency} ms
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Requests</h3>
          <div className="value">
            <Database size={20} style={{marginRight: 8}} inline />
            {metrics.totalRequests}
          </div>
        </div>
        <div className="stat-card">
          <h3>Blocked</h3>
          <div className="value" style={{color: metrics.blockedRequests > 0 ? '#e74c3c' : '#2c3e50'}}>
            <ShieldAlert size={20} style={{marginRight: 8}} inline />
            {metrics.blockedRequests}
          </div>
        </div>
      </div>

      <div className="main-grid">
        <div className="left-col">
          <div className="panel">
            <h2>Real-Time Traffic Throughput</h2>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="rps" stroke="#3498db" fill="#3498db" fillOpacity={0.1} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <h2>System Resources</h2>
            <div style={{display: 'flex', gap: '40px', padding: '10px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Cpu size={24} color="#7f8c8d" />
                <div>
                  <div style={{fontSize: '0.8rem', color: '#7f8c8d'}}>CPU Usage</div>
                  <div style={{fontWeight: 'bold'}}>{metrics.cpuUsage}%</div>
                </div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <ServerIcon size={24} color="#7f8c8d" />
                <div>
                  <div style={{fontSize: '0.8rem', color: '#7f8c8d'}}>RAM Usage</div>
                  <div style={{fontWeight: 'bold'}}>{metrics.ramUsage} MB</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="right-col">
          <div className="panel" style={{height: '100%', overflow: 'hidden'}}>
            <h2>Live Request Log</h2>
            <div style={{overflowY: 'auto', maxHeight: '500px'}}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentRequests.map(req => (
                    <tr key={req.id}>
                      <td>{req.timestamp}</td>
                      <td><code>{req.method} {req.path}</code></td>
                      <td>
                        <span className={`status-badge status-${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{req.latency}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
