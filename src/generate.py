"""
src/generate.py
Synthetic dataset generator producing multi-cycle intermittent supply scenarios.
Generates:
- 1,000 no-leak scenarios (demand varies only)
- Leak scenarios across candidate leak nodes x sizes {small, medium, large}
- Multi-cycle stitched sequences for detection delay evaluation
"""

import json
import random
import numpy as np
from src.config import (
    N_CYCLES, LEAK_START_CYCLE, LEAK_SIZES,
    DEMAND_FACTOR_LOW, DEMAND_FACTOR_HIGH
)

def generate_multi_cycle_dataset(simulator, leak_nodes_list, n_no_leak=1000, seed=42):
    random.seed(seed)
    np.random.seed(seed)

    print(f"Generating {n_no_leak} no-leak baseline scenarios...")
    no_leak_scenarios = []
    no_leak_magnitudes_by_sensor = {"5": [], "10": [], "20": []}
    no_leak_raw_magnitudes_by_sensor = {"5": [], "10": [], "20": []}

    # Generate baseline demand variations
    for i in range(n_no_leak):
        g = round(random.uniform(DEMAND_FACTOR_LOW, DEMAND_FACTOR_HIGH), 3)
        pressures = simulator.simulate_window(g, leak_node=None, noise_std=0.06)
        no_leak_scenarios.append({
            "id": f"no_leak_{i}",
            "demand_factor": g,
            "pressures": pressures
        })

    print(f"Generating leak scenarios across {len(leak_nodes_list)} nodes x 3 sizes...")
    leak_scenarios = []

    # Fixed cycle demand pattern for reproducible multi-cycle sequences
    base_cycle_demands = [0.97, 1.07, 0.93, 1.08, 0.92, 1.05, 0.98, 1.03]

    for leak_node in leak_nodes_list:
        for size_label, cfg in LEAK_SIZES.items():
            scen_id = f"{leak_node}_{size_label}"
            cycles_data = []

            for c in range(N_CYCLES):
                g = base_cycle_demands[c]
                is_leaking = (c >= LEAK_START_CYCLE)
                
                # Pre-leak: normal run; Post-leak: leak active
                cur_leak = leak_node if is_leaking else None
                pressures = simulator.simulate_window(g, leak_node=cur_leak, leak_size=size_label, noise_std=0.06)

                cycles_data.append({
                    "cycle": c,
                    "pressures": pressures,
                    "demand_factor": g
                })

            leak_scenarios.append({
                "id": scen_id,
                "leak_node": leak_node,
                "size_label": size_label,
                "size_pct_of_supply": cfg["pct_of_supply"],
                "start_cycle": LEAK_START_CYCLE,
                "n_cycles": N_CYCLES,
                "cycles": cycles_data
            })

    return {
        "no_leak": no_leak_scenarios,
        "leak_scenarios": leak_scenarios
    }
