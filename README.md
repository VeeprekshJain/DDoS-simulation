# DDoS Simulation & Monitoring Lab

A controlled environment for studying Distributed Denial of Service (DDoS) attacks and their mitigations.

## Prerequisites
- **Node.js**: Installed on your system.

## Project Structure
- `/server`: The target (victim) server that monitors its own health.
- `/client`: The monitoring dashboard (Simple & Realistic).
- `/simulator`: The engine used to launch attacks (Attacker).

## How to Run

### 1. Installation
Run the following in the root directory:
```bash
npm install
cd client && npm install
cd ..
```

### 2. Start the Lab (3 Terminals Required)

**Terminal 1: Start the Target Server**
```bash
npm run server
```
*Port: 3001*

**Terminal 2: Start the Monitoring Dashboard**
```bash
npm run client
```
*Open http://localhost:5173 (or as shown in the output)*

**Terminal 3: Launch the Simulator**
```bash
npm run simulator
```
*Follow the CLI prompts to select an attack mode (HTTP Flood or Slowloris).*

## Lab Workflow for Assessment
1. **Establish Baseline**: Observe metrics on the dashboard when no attack is running.
2. **Execute Attack**: Use the Simulator (Terminal 3) to start an HTTP Flood.
3. **Monitor Impact**: Watch the RPS (Requests Per Second) and Latency spikes on the Dashboard.
4. **Apply Mitigation**: Toggle the "Rate Limiting" switch on the Dashboard.
5. **Analyze Result**: Observe how the "Blocked Requests" count increases and the server latency stabilizes.
6. **Documentation**: Fill out the `Lab_Report_Template.md` with your findings.
