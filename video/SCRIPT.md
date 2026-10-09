# Boond: Demo Video Script (Target: 2:45 – 3:00)

> **Important Video Rules:**
> - Record at **1080p (1920x1080)** with browser address bar/bookmarks hidden (`F11` fullscreen).
> - Total duration must be **strictly under 3:00**. Target run time: **2:50**.
> - Exact numbers only (from Plan A): Plain threshold catches **49%**; Boond demand-cancelled catches **69% at 12 sensors** and **78% at 20 sensors**. Leaks are simulated bursts/large leaks.

---

## Storyboard & Timing Breakdown

| Timestamp | Visual on Screen | Voiceover Narration | On-Screen Action |
|---|---|---|---|
| **0:00 – 0:25** | **Slide 1:** Title Card & IWS Crisis | *"Indian cities lose roughly a third or more of treated water to leaks before it reaches homes. In cities like Delhi, Bengaluru, and Shimla, water runs for only 2 to 4 hours a day—an Intermittent Water Supply system. Traditional commercial leak detection assumes 24/7 continuous pressurized flow. When pipes drain and refill every day, continuous models break down completely."* | Start on Slide 1. Speak steadily and clearly. |
| **0:25 – 0:55** | **Slide 2:** Figure 1 (Demand Masking) | *"The core challenge under intermittent supply is demand variation. Consumer drawing varies by ±10% day to day. In an intermittent network, that ±10% swing changes pipe pressure as much as a massive leak. A simple pressure threshold cannot tell if pressure dropped because of an underground rupture or just a hot morning with high demand. As a result, standard fixed thresholds catch only 49% of leaks."* | Advance to Slide 2. Point cursor at the ±10% demand variation band. |
| **0:55 – 1:15** | **Slide 3:** Demand Cancellation & Persistence Rule | *"Boond solves this with two mathematical insights. First, because systemic demand moves all sensors together, we project out the common demand mode, leaving only the demand-cancelled residual. Second, we enforce a multi-cycle persistence rule: an alarm fires only when the anomaly persists across consecutive supply cycles. This raises detection from 49% to 69% with 12 sensors, and 78% with 20 sensors, at the exact same false-alarm rate."* | Advance to Slide 3. Highlight formula and detection comparison table. |
| **1:15 – 2:10** | **Live UI:** Web Dashboard (`web/index.html`) | *"Let's see this live in the Boond dashboard. Here is a simulated 60-junction municipal distribution network under intermittent supply. We inject a medium leak at junction J-22 at Cycle 3. As cycles advance, notice sensor pressures fluctuate with demand. At Cycle 4—just one cycle after start—our demand-cancelled metric d crosses the 1.10 threshold and triggers a high-confidence alert. The heatmap immediately pinpoints top candidate junctions. Revealing the true leak confirms our top candidate matches ground truth. Now, when we reduce sensor density from 20 down to 5 sensors, notice the detection signal honestly degrades—demonstrating the exact instrumentation trade-off for city engineers."* | **Live Demo Actions:**<br>1. Show SVG map (J-22 selected).<br>2. Click Play (watch Cycles 0 &rarr; 4).<br>3. Highlight red 'LEAK DETECTED' banner at Cycle 4.<br>4. Point out candidate heatmap around J-22.<br>5. Click 'Reveal True Leak'.<br>6. Click '5 Sensors' button to show honest degradation. |
| **2:10 – 2:35** | **Slide 4:** AWS Cloud Architecture | *"Boond is built entirely on AWS serverless architecture to keep municipal operating costs near zero. The single-page frontend is hosted globally via AWS Amplify. Municipal queries route through Amazon API Gateway to an AWS Lambda Python 3.12 function that computes demand cancellation in milliseconds, fetching precomputed network matrices and WNTR simulation datasets from Amazon S3. Incident events are logged directly for dispatch."* | Advance to Slide 4. Trace the flow: Amplify &rarr; API Gateway &rarr; Lambda &rarr; S3. |
| **2:35 – 3:00** | **Slide 5:** Honest Limits & Wrap-up | *"To be completely honest about our engineering scope: Boond is validated on EPANET WNTR hydraulic simulations and targets burst and medium-to-large leaks. Small leaks under 2.5% remain challenging with sparse sensors, and localisation narrows down to neighbourhood sectors, ready for acoustic field verification. Boond is fully open source. Thank you."* | Advance to Slide 5. Fade out at 2:55. |

---

## Production & Recording Checklist

- [ ] **Resolution:** 1920x1080 (1080p), 60 FPS in OBS Studio or Windows Game Bar (`Win + Alt + R`).
- [ ] **Browser Window:** Chrome/Edge in Fullscreen mode (`F11`). Hide bookmarks bar (`Ctrl + Shift + B`).
- [ ] **Audio:** Clear USB microphone; quiet room; zero background noise.
- [ ] **Rehearsal:** Run through the sequence twice before the final take.
- [ ] **Verification:** Confirm the exported video file is strictly under **3:00** (e.g., 2:50-2:55).
