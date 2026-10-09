# BOOND: Leak Detection for Intermittent Water Supply (IWS)

> **Submission for Cyber AI Hackathon 2026**  
> Problem: Leak detection under Intermittent Water Supply (WNTR EPANET simulation).  
> Deliverables: Repo + AWS Serverless Architecture + 3-minute Video.

---

## 1. Overview & Problem Statement

Indian urban centres (e.g., Delhi, Bengaluru, Shimla) lose an estimated **30% to 50% of treated municipal water** to undetected pipe bursts and leaks. Crucially, these cities operate under **Intermittent Water Supply (IWS)**—water is pumped through pipes for only **2 to 4 hours per day**, after which pipes drain and sit unpressurized.

Commercial leak detection solutions are designed for Western 24/7 continuous pressurized networks. When applied to intermittent systems, they break down:
1. **Demand Masking:** Day-to-day consumer demand naturally swings by **&plusmn;10%**, moving pipe pressure by 0.8–1.5 metres of head. A medium pipe leak (7.5% of supply) causes an identical drop. A standard fixed threshold cannot distinguish between a high-demand morning and an active pipe burst, catching **only 49% of leaks**.
2. **Hydraulic Transients:** Daily emptying and refilling cause air pockets, surging waves, and zero-pressure states.

---

## 2. The Boond Solution: Mathematical Innovation

Boond introduces two complementary algorithms:
1. **Demand-Cancelled Residual ($r_c$):**  
   Because consumer demand affects all sensors simultaneously via network-wide sensitivity vectors $s$, we project out the common mode:
   $$\hat{g} = \frac{s \cdot r}{s \cdot s}, \quad r_c = r - s \hat{g}, \quad d = \|r_c\|$$
2. **Multi-Cycle Persistence Rule:**  
   An anomaly alarm triggers only when the test statistic $d$ exceeds the baseline threshold ($d > 1.10$) across **2 of the last 3 supply cycles**, filtering out one-off consumer surges.

### Detection Benchmarks (EPANET WNTR Simulation)

| Strategy | Sensor Count | Detection Rate | Delay |
|---|---|---|---|
| Plain Fixed Threshold | 20 sensors | 49% | High false alarms |
| Boond Demand-Cancelled | 5 sensors | 52% | 2–3 cycles |
| Boond Demand-Cancelled | 12 sensors | 69% | 1–2 cycles |
| **Boond Demand-Cancelled** | **20 sensors** | **78%** | **1 cycle (Median)** |

---

## 3. Project Structure

```
Boond/
├── web/
│   ├── index.html       # Single-page complete UI (inline CSS/JS, 1080p optimized)
│   ├── network.json     # Network topology (60 nodes, 119 pipes, nested sensor sets)
│   ├── scenarios.json   # Multi-cycle scenarios across leak nodes & sizes (72 scenarios)
│   ├── network.js       # Fallback wrapper for offline/file:// execution
│   └── scenarios.js     # Fallback wrapper for offline/file:// execution
├── video/
│   ├── SCRIPT.md        # Exact 3-minute second-by-second voiceover & recording script
│   └── slides.html      # 1080p interactive presentation slide deck
├── generate_mock_data.py # Script generating contract-compliant network and scenarios
├── index.html           # Root redirect to web/index.html
└── README.md            # Project documentation and deployment guide
```

---

## 4. How to Run Locally

You can run the web dashboard locally with zero external dependencies:

```bash
# Option 1: Python HTTP server
cd Boond
python -m http.server 8080 --directory web

# Open in browser:
http://localhost:8080/index.html
```

Or open `Boond/web/index.html` directly in any modern web browser (Edge, Chrome, Firefox).

---

## 5. AWS Cloud Architecture

Boond is built with serverless cloud infrastructure on AWS for low operational costs:
- **AWS Amplify:** Global static hosting of `web/index.html` with zero build step.
- **Amazon API Gateway HTTP API:** Sub-50ms REST API routing `GET /network` and `GET /scenario?node={id}&size={size}`.
- **AWS Lambda (Python 3.12):** Stateless microservice evaluating demand cancellation and signature cosine similarity ranking.
- **Amazon S3:** Private bucket housing network topology and WNTR simulation datasets.

---

## 6. Video Recording Guide (3-Minute Submission)

Plan B requires a video strictly under 3 minutes (target: 2:45–2:50):
- **0:00 – 0:25:** Problem context & Intermittent Water Supply crisis ([Slide 1](video/slides.html))
- **0:25 – 0:55:** Figure 1: Demand masking problem ([Slide 2](video/slides.html))
- **0:55 – 1:15:** Demand cancellation math & persistence rule ([Slide 3](video/slides.html))
- **1:15 – 2:10:** Live UI walkthrough ([Live Dashboard](web/index.html))
- **2:10 – 2:35:** AWS Cloud architecture ([Slide 4](video/slides.html))
- **2:35 – 3:00:** Honest limitations & conclusion ([Slide 5](video/slides.html))

Read [`video/SCRIPT.md`](video/SCRIPT.md) for the word-for-word voiceover text.
