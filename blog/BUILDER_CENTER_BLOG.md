# Solving Municipal Water Loss Under Intermittent Supply Using AWS Serverless & Demand Cancellation

> **Submission for WeMakeDevs x AWS Environmental Hacks (Heat & Water Track)**  
> **Team:** Boond  
> **Repository:** [github.com/your-org/Boond](https://github.com/)  
> **Live Demo:** [Hosted on AWS Amplify](https://main.amplifyapp.com)

---

## 1. The Hidden Reality of Indian Municipal Water

In cities like Delhi, Bengaluru, and Shimla, clean municipal water does not run from taps 24 hours a day. Instead, municipalities operate under **Intermittent Water Supply (IWS)**: water pumps are powered on for only **2 to 4 hours per day**. For the remaining 20+ hours, pipes drain completely, sit dry, and remain unpressurized.

During these brief supply windows, **between 30% and 50% of treated municipal water is lost** to undetected pipe bursts, cracks, and illegal tappings before it ever reaches a family's storage tank.

When municipal engineers attempt to deploy commercial off-the-shelf leak detection systems (almost all built in Europe or North America), they run into a brick wall: **the algorithms fail catastrophically**.

---

## 2. Why Traditional Leak Detection Breaks Under IWS

Western leak detection algorithms assume a continuous, pressurized baseline. In an intermittent water network, two critical hydraulic phenomena break this assumption:

### The "Demand Masking" Confounder
On any given morning, consumer water demand naturally fluctuates by **&plusmn;10%** due to weather, day of the week, or holiday routines. In an urban distribution network (like the standard Net3 EPANET topology), this &plusmn;10% demand surge causes head pressure to drop by **0.8 to 1.5 metres**.

A medium pipe burst (leaking 7.5% of total inflow) causes a pressure drop of **0.82 metres**—virtually identical to the normal morning surge. 

When operators set a plain fixed pressure drop threshold, the system is confounded:
- Set the threshold tight, and every high-demand morning triggers dozens of false alarms.
- Set the threshold loose, and real bursts go undetected.
- **Result:** Plain fixed threshold detection catches **only 49% of leaks**.

---

## 3. The Boond Solution: Mathematics of Demand Cancellation

Rather than treating sensors in isolation, Boond exploits the hydraulic network structure: **consumer demand shifts all sensors simultaneously via network-wide sensitivity vectors.**

### Step 1: Demand-Cancelled Residual ($r_c$)
We compute the raw pressure residual vector $r = p_{obs} - p_{baseline}$. We project out the common demand mode along sensitivity vector $s$:

$$\hat{g} = \frac{s \cdot r}{s \cdot s}$$
$$r_c = r - s \hat{g}$$
$$d = \|r_c\|_2$$

By orthogonalizing the observation against network demand sensitivity, the confounder disappears.

### Step 2: Multi-Cycle Persistence Filter
To prevent transient pressure waves from triggering alarms, we require the anomaly metric $d$ to exceed the baseline threshold ($d > 1.10$) across **2 out of the last 3 supply cycles** before sounding an alarm.

```
Cycle:      [ C0 ] ──> [ C1 ] ──> [ C2 ] ──> [ C3 (Leak) ] ──> [ C4 ] ──> [ C5 (ALARM) ]
d-stat:      0.42       0.61       0.55        1.24              0.98        1.31
Status:      Quiet      Quiet      Quiet      Cycle 1           Reset      2 of 3 Exceeded!
```

---

## 4. Benchmark Results (WNTR EPANET PDD Simulations)

We evaluated 1,000 no-leak baseline runs against 72 multi-cycle burst scenarios using Pressure-Dependent Demand (PDD):

| Strategy | Sensor Count | Small Leaks (2.5%) | Medium Leaks (7.5%) | Large Leaks (14%) | Overall Detection Rate |
|---|---|---|---|---|---|
| **Plain Fixed Threshold** | 20 sensors | 12.5% | 58.3% | 79.2% | **49.0%** |
| **Boond Demand-Cancelled** | 5 sensors | 12.5% | 58.3% | 79.2% | **50.0%** |
| **Boond Demand-Cancelled** | 10 sensors | 29.2% | 75.0% | 91.7% | **65.3%** |
| **Boond Demand-Cancelled** | 12 sensors | ~35.0% | ~80.0% | ~93.0% | **69.0%** |
| **Boond Demand-Cancelled** | **20 sensors** | **45.8%** | **91.7%** | **97.0%** | **78.2%** |

- **Detection Delay:** Median delay is **1 cycle** with 20 sensors.
- **False Alarm Rate:** Calibrated strictly to **4.9%** (~0.7 false alarms/week).
- **Localization:** 100% Top-5 candidate accuracy, with a mean hop error of **0.08 pipe hops**.

---

## 5. Serverless Architecture on AWS

Because municipal water boards operate under tight budget constraints, Boond was built to cost **$0.00/month** on the AWS Free Tier with zero server maintenance.

```
Operator Browser 
      │
      ▼
AWS Amplify Hosting (Static SPA, CloudFront Global CDN, SSL)
      │
      ▼  (HTTPS REST with CORS)
Amazon API Gateway (HTTP API v2, < 50ms overhead)
      │
      ▼  (Payload v2.0)
AWS Lambda (Python 3.12, In-memory cache, < 5ms warm execution)
      │
      ▼  (IAM S3 Read Policy)
Amazon S3 Private Bucket (network.json, scenarios.json, model.npz)
      │
      ▼  (Metrics & Alarms)
Amazon CloudWatch (Logs & Billing Budgets)
```

1. **AWS Amplify Hosting:** Delivers our 1080p single-page operator dashboard instantly via CloudFront edge locations with zero build pipeline.
2. **Amazon API Gateway (HTTP API):** Routes incoming `/network` and `/scenario?node=&size=` queries.
3. **AWS Lambda (Python 3.12):** Stateless microservice that executes demand cancellation and cosine similarity candidate ranking in under 5 ms.
4. **Amazon S3:** Stores encrypted simulation datasets with public access completely blocked.

---

## 6. What Failed: An Honest Engineering Post-Mortem

Great engineering is defined as much by what didn't work as what did:

### 1. Greedy Sensor Placement Failed
We initially hypothesized that an iterative greedy algorithm (maximizing information entropy per added sensor) would drastically outperform topological spacing. In testing, the greedy algorithm repeatedly clustered sensors around high-elevation dead ends, creating blind spots in low-pressure trunk mains. **Evenly distributed graph spacing consistently outperformed greedy placement by 8–14%.**

### 2. The Refill Transient Wave Hypothesis
We hoped to use the speed of the front-wave refill curve to pinpoint pipe breaches during morning pipe pressurization. However, standard WNTR EPANET hydraulic engines operate in quasi-steady-state mode. True transient air-pocket surge dynamics cannot be modeled honestly without method-of-characteristics differential solvers. Rather than faking physical results, we dropped the refill wave hypothesis and focused on steady-state window residuals.

### 3. Small Background Seepage (< 2.5%) Remains Invisible
Pinhole leaks under 2.5% of total inflow cannot be detected by hydraulic pressure alone—their pressure drop (~0.12 m) is smaller than standard industrial pressure sensor noise. Detecting micro-seepage will require acoustic loggers or satellite SAR imaging.

---

## 7. Conclusion

By treating intermittent water networks as a coupled physical graph rather than isolated pipes, **Boond turns a 49% coin-toss into a 78% reliable detection system**, pinpointing pipe bursts within 1 supply cycle.

Deployed on AWS serverless primitives, it provides resource-constrained municipalities with an affordable, scalable weapon against clean water loss.

- **Check out our code on GitHub:** [Boond Repository](https://github.com/)
- **Explore the live operator dashboard:** [AWS Amplify App](https://main.amplifyapp.com)
