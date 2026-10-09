#!/usr/bin/env python3
"""
generate_mock_data.py
Generates network.json and scenarios.json for the Boond Intermittent Water Supply Leak Detection project.
Adheres strictly to the contract defined in plan-A-modelling.md, plan-B-frontend-video.md, and plan-C-aws-docs.md.
"""

import json
import math
import random
import os

random.seed(42)

def generate_network():
    nodes = []
    node_coords = {}
    
    cols = 10
    rows = 6
    x_step = 95
    y_step = 95
    x_offset = 65
    y_offset = 65
    
    node_idx = 10
    for r in range(rows):
        for c in range(cols):
            nid = f"J-{node_idx}"
            jx = (random.random() - 0.5) * 26
            jy = (random.random() - 0.5) * 22
            elev = round(46.0 - (r * 3.4 + c * 2.2) + random.uniform(-1.2, 1.2), 1)
            x = round(x_offset + c * x_step + jx, 1)
            y = round(y_offset + r * y_step + jy, 1)
            
            nodes.append({"id": nid, "x": x, "y": y, "elevation": elev})
            node_coords[nid] = (x, y, elev)
            node_idx += 1

    pipes = []
    pipe_idx = 1
    connected_pairs = set()

    def add_pipe(n1, n2):
        nonlocal pipe_idx
        pair = tuple(sorted([n1, n2]))
        if pair not in connected_pairs and n1 != n2:
            connected_pairs.add(pair)
            pipes.append({
                "id": f"P-{pipe_idx}",
                "from": n1,
                "to": n2,
                "diameter_mm": random.choice([150, 200, 250, 300])
            })
            pipe_idx += 1

    for r in range(rows):
        for c in range(cols):
            cur = f"J-{10 + r * cols + c}"
            if c < cols - 1:
                add_pipe(cur, f"J-{10 + r * cols + c + 1}")
            if r < rows - 1:
                add_pipe(cur, f"J-{10 + (r + 1) * cols + c}")
            if r < rows - 1 and c < cols - 1 and (r + c) % 3 == 0:
                add_pipe(cur, f"J-{10 + (r + 1) * cols + c + 1}")

    # Nested sensor sets: 5 in 10 in 20
    sensors_5 = ["J-14", "J-21", "J-37", "J-52", "J-66"]
    sensors_10_extra = ["J-18", "J-29", "J-43", "J-58", "J-61"]
    sensors_10 = sensors_5 + sensors_10_extra
    sensors_20_extra = ["J-11", "J-16", "J-25", "J-32", "J-40", "J-48", "J-55", "J-63", "J-68", "J-69"]
    sensors_20 = sensors_10 + sensors_20_extra

    network = {
        "nodes": nodes,
        "pipes": pipes,
        "sensor_sets": {
            "5": sensors_5,
            "10": sensors_10,
            "20": sensors_20
        },
        "supply_windows": [[6, 9], [18, 21]]
    }
    
    return network, node_coords

def generate_scenarios(network, node_coords):
    nodes = [n["id"] for n in network["nodes"]]
    sensors_20 = network["sensor_sets"]["20"]
    sensors_10 = network["sensor_sets"]["10"]
    sensors_5 = network["sensor_sets"]["5"]

    adj = {nid: [] for nid in nodes}
    for p in network["pipes"]:
        adj[p["from"]].append(p["to"])
        adj[p["to"]].append(p["from"])

    def hop_distance(source):
        dist = {source: 0}
        q = [source]
        while q:
            curr = q.pop(0)
            d = dist[curr]
            for nxt in adj.get(curr, []):
                if nxt not in dist:
                    dist[nxt] = d + 1
                    q.append(nxt)
        return dist

    base_pressures = {}
    for s in sensors_20:
        x, y, elev = node_coords[s]
        base_pressures[s] = round(28.5 + (42.0 - elev) * 0.22 + random.uniform(-0.5, 0.5), 2)

    sensitivities = {s: round(-7.2 + random.uniform(-0.8, 0.8), 2) for s in sensors_20}

    leak_nodes_sample = [
        "J-12", "J-15", "J-19", "J-22", "J-26", "J-30",
        "J-33", "J-38", "J-41", "J-45", "J-49", "J-53",
        "J-57", "J-62", "J-64", "J-67", "J-20", "J-35",
        "J-44", "J-50", "J-28", "J-36", "J-54", "J-17"
    ]

    sizes_config = {
        "small": {"pct": 2.5, "flow_factor": 0.45},
        "medium": {"pct": 7.5, "flow_factor": 1.15},
        "large": {"pct": 14.0, "flow_factor": 2.40}
    }

    scenarios = {}

    for leak_node in leak_nodes_sample:
        dist_map = hop_distance(leak_node)
        
        for size_label, cfg in sizes_config.items():
            scen_id = f"{leak_node}_{size_label}"
            size_pct = cfg["pct"]
            flow = cfg["flow_factor"]
            start_cycle = 3
            n_cycles = 8

            cycle_demand_factors = [0.97, 1.07, 0.93, 1.08, 0.92, 1.05, 0.98, 1.03]
            
            cycles_data = []
            
            for c in range(n_cycles):
                g = cycle_demand_factors[c]
                is_leaking = (c >= start_cycle)
                cycle_pressures = {}

                for s in sensors_20:
                    bp = base_pressures[s]
                    sens = sensitivities[s]
                    demand_effect = sens * (g - 1.0)
                    
                    leak_effect = 0.0
                    if is_leaking:
                        h = dist_map.get(s, 8)
                        leak_effect = - (flow * 2.1) / (1.0 + 0.65 * h)
                    
                    noise = random.gauss(0, 0.06)
                    p_val = round(bp + demand_effect + leak_effect + noise, 2)
                    cycle_pressures[s] = p_val
                
                cycles_data.append({
                    "cycle": c,
                    "pressures": cycle_pressures,
                    "demand_factor": g
                })

            results = {}

            for count_str, s_list in [("5", sensors_5), ("10", sensors_10), ("20", sensors_20)]:
                thr = 1.10
                plain_thr = 1.65
                min_dist_to_sensor = min(dist_map.get(s, 9) for s in s_list)

                if count_str == "20":
                    mult = 1.0
                elif count_str == "10":
                    mult = 0.82
                else:
                    mult = 0.58

                d_series = []
                plain_d_series = []

                for c in range(n_cycles):
                    g = cycle_demand_factors[c]
                    # Demand fluctuation alone causes large raw pressure deviations
                    raw_demand_swing = abs(g - 1.0) * 7.2
                    
                    # Pre-leak noise for demand-cancelled statistic
                    base_noise = round(0.35 + random.uniform(-0.08, 0.08), 3)

                    if c < start_cycle:
                        d_val = base_noise
                        plain_d_val = round(raw_demand_swing * 0.95 + random.uniform(0.1, 0.25), 3)
                    else:
                        cycles_active = c - start_cycle + 1
                        raw_leak_sig = (flow * 0.85 * mult) / (1.0 + 0.20 * min_dist_to_sensor)
                        growth = min(1.35, 1.0 + 0.10 * (cycles_active - 1))
                        leak_sig = raw_leak_sig * growth
                        d_val = round(base_noise + leak_sig + random.uniform(-0.04, 0.04), 3)
                        # Plain threshold is confounded by both demand swing and leak
                        plain_d_val = round(raw_demand_swing + (flow * 0.9) / (1.0 + 0.3 * min_dist_to_sensor) + random.uniform(-0.1, 0.1), 3)

                    d_series.append(d_val)
                    plain_d_series.append(plain_d_val)

                # Determine detected cycle (persistence rule: d > thr in 2 of last 3 cycles)
                detected_cycle = None
                consec = 0
                for c in range(start_cycle, n_cycles):
                    if d_series[c] > thr:
                        consec += 1
                        if consec >= 2:
                            detected_cycle = c
                            break
                    else:
                        consec = max(0, consec - 1)

                # Plain detected cycle (often false alarms at cycle 1 or 3, or misses entirely)
                plain_detected_cycle = None
                for c in range(n_cycles):
                    if plain_d_series[c] > plain_thr:
                        plain_detected_cycle = c
                        break

                # Honesty tuning based on Plan A:
                if size_label == "small":
                    if count_str == "5":
                        detected_cycle = None
                        d_series = [round(min(0.85, v), 3) for v in d_series]
                    elif count_str == "10":
                        if min_dist_to_sensor > 2:
                            detected_cycle = None
                            d_series = [round(min(0.98, v), 3) for v in d_series]
                        else:
                            detected_cycle = 6
                    else: # 20 sensors
                        detected_cycle = 5 if min_dist_to_sensor <= 2 else 6

                # Top-k candidate scoring
                candidates = []
                for n in nodes:
                    h = dist_map.get(n, 10)
                    if count_str == "20":
                        score = max(0.04, 1.0 / (1.0 + 0.50 * h) + random.uniform(-0.05, 0.05))
                    elif count_str == "10":
                        score = max(0.04, 1.0 / (1.0 + 0.34 * h) + random.uniform(-0.10, 0.08))
                    else:
                        score = max(0.04, 1.0 / (1.0 + 0.22 * h) + random.uniform(-0.15, 0.12))
                    candidates.append({"node": n, "score": round(score, 3)})

                candidates.sort(key=lambda x: x["score"], reverse=True)
                top_k = candidates[:6]
                max_sc = top_k[0]["score"]
                if max_sc > 0:
                    for item in top_k:
                        item["score"] = round(min(0.98, item["score"] / max_sc * 0.95), 3)

                next_sensor = None
                if count_str == "5":
                    top_node = top_k[0]["node"]
                    near_nodes = [n for n in nodes if 1 <= dist_map.get(n, 99) <= 3 and n not in s_list]
                    next_sensor = random.choice(near_nodes) if near_nodes else "J-40"
                elif count_str == "10":
                    if random.random() < 0.65:
                        near_nodes = [n for n in nodes if 1 <= dist_map.get(n, 99) <= 2 and n not in s_list]
                        next_sensor = random.choice(near_nodes) if near_nodes else "J-32"
                    else:
                        next_sensor = None
                else:
                    next_sensor = None

                results[count_str] = {
                    "d_series": d_series,
                    "plain_d_series": plain_d_series,
                    "threshold": thr,
                    "plain_threshold": plain_thr,
                    "detected_cycle": detected_cycle,
                    "plain_detected_cycle": plain_detected_cycle,
                    "top_k": top_k,
                    "next_sensor": next_sensor
                }

            scenarios[scen_id] = {
                "id": scen_id,
                "leak_node": leak_node,
                "size_label": size_label,
                "size_pct_of_supply": size_pct,
                "start_cycle": start_cycle,
                "n_cycles": n_cycles,
                "cycles": cycles_data,
                "results": results
            }

    return scenarios

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    web_dir = os.path.join(base_dir, "web")
    os.makedirs(web_dir, exist_ok=True)

    print("Generating network.json...")
    network, node_coords = generate_network()
    with open(os.path.join(web_dir, "network.json"), "w", encoding="utf-8") as f:
        json.dump(network, f, indent=2)
    print(f"network.json generated: {len(network['nodes'])} nodes, {len(network['pipes'])} pipes.")

    print("Generating scenarios.json...")
    scenarios = generate_scenarios(network, node_coords)
    with open(os.path.join(web_dir, "scenarios.json"), "w", encoding="utf-8") as f:
        json.dump(scenarios, f, indent=2)
    print(f"scenarios.json generated: {len(scenarios)} scenarios.")

if __name__ == "__main__":
    main()
