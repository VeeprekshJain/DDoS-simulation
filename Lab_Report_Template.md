# DDoS Analysis Lab Report

**Student Name:** [Your Name]  
**Date:** 2026-04-09  
**Assessment Topic:** DDoS Monitoring & Mitigation  

---

## 1. Objective
The objective of this lab is to simulate and monitor Distributed Denial of Service (DDoS) attacks in a controlled environment to understand their impact on server resource utilization and service availability.

## 2. Methodology
A local environment was established consisting of:
- **Target Server (Victim)**: Node.js Express server monitoring real-time metrics.
- **Monitoring Dashboard**: React-based UI for visualizing RPS, Latency, and System Resources.
- **Traffic Simulator (Attacker)**: Stress-testing engine simulating Volumetric and Connection-Exhaustion attacks.

## 3. Experiment Data

### Experiment 1: HTTP GET Flood (Volumetric)
*   **Intensity:** [e.g., 50 requests/batch]
*   **Observations:**
    *   Requests Per Second (RPS) Peak: [Value]
    *   Latency (ms) Increase: [Value]
    *   CPU/RAM Usage spikes: [Value]
*   **Analysis:** Describe how the server behaved. Did response times increase? Did the process crash?

### Experiment 2: Slowloris (Connection Exhaustion)
*   **Connection Count:** [e.g., 200]
*   **Observations:**
    *   Initial behavior:
    *   Impact on legitimate requests while attack is active:
*   **Analysis:** How does this differ from the HTTP Flood?

## 4. Mitigation Strategies
During the lab, the following defense was tested:
- **Rate Limiting**: [Describe impact when toggled ON vs OFF]

| Condition | Avg Latency | Blocked Requests | Status |
|-----------|-------------|------------------|--------|
| Normal    |             |                  | Online |
| Attack    |             |                  | Degraded |
| Defense   |             |                  | Mitigated |

## 5. Conclusion
[Summarize what you learned about DDoS monitoring and the effectiveness of simple mitigation techniques like rate limiting.]
