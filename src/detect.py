"""
src/detect.py
Anomaly detection module with persistence filter and baseline comparison.
Strict implementation of Plan A Step 5:
- Statistic d = ||r_c||
- Threshold calibrated on no-leak data at 5% per-cycle False Alarm Rate (FAR)
- Persistence rule: alarm if d > threshold in 2 of the last 3 cycles
- Baseline benchmark: plain-pressure threshold on raw residual r at same 5% FAR
"""

import numpy as np
from src.config import TARGET_PER_CYCLE_FAR, PERSISTENCE_WINDOW, PERSISTENCE_REQUIRED

class LeakDetector:
    def __init__(self, cancelled_threshold=1.10, plain_threshold=1.65):
        self.threshold = cancelled_threshold
        self.plain_threshold = plain_threshold

    @classmethod
    def calibrate_from_no_leak(cls, no_leak_magnitudes, no_leak_raw_magnitudes, target_far=TARGET_PER_CYCLE_FAR):
        """
        Calibrates thresholds using the empirical quantile (1.0 - target_far) on no-leak runs.
        """
        cancelled_thr = float(np.percentile(no_leak_magnitudes, (1.0 - target_far) * 100))
        plain_thr = float(np.percentile(no_leak_raw_magnitudes, (1.0 - target_far) * 100))
        return cls(cancelled_threshold=cancelled_thr, plain_threshold=plain_thr)

    def evaluate_sequence(self, d_series, start_cycle=3):
        """
        Evaluates detection using persistence rule (2 of last 3 cycles exceeding threshold).
        Returns detected_cycle (or None if undetected) and delay.
        """
        n_cycles = len(d_series)
        detected_cycle = None
        
        for c in range(start_cycle, n_cycles):
            # Check window of last PERSISTENCE_WINDOW cycles
            win_start = max(0, c - PERSISTENCE_WINDOW + 1)
            recent_d = d_series[win_start:c + 1]
            exceeded_count = sum(1 for val in recent_d if val > self.threshold)
            
            if exceeded_count >= PERSISTENCE_REQUIRED:
                detected_cycle = c
                break

        delay = (detected_cycle - start_cycle) if detected_cycle is not None else None
        return detected_cycle, delay

    def evaluate_plain_sequence(self, plain_series, start_cycle=3):
        """
        Evaluates naive fixed threshold on raw residual norm.
        """
        n_cycles = len(plain_series)
        detected_cycle = None
        for c in range(n_cycles):
            if plain_series[c] > self.plain_threshold:
                detected_cycle = c
                break
        delay = (detected_cycle - start_cycle) if (detected_cycle is not None and detected_cycle >= start_cycle) else None
        return detected_cycle, delay
