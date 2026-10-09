"""
src/sensors.py
Sensor set management and optimal next sensor placement recommendation.
Handles nested sets (5 within 10 within 20) and greedy ambiguity reduction.
"""

import random

class SensorManager:
    def __init__(self, sensor_sets, graph_distances=None):
        self.sensor_sets = sensor_sets
        self.graph_distances = graph_distances or {}

    def get_sensors(self, count_str):
        return self.sensor_sets.get(str(count_str), self.sensor_sets["20"])

    def suggest_next_sensor(self, current_count_str, top_candidates, all_nodes):
        """
        Suggests an uninstrumented junction node that resolves ambiguity between top candidates.
        Returns node_id string, or None if 20 sensors are already active.
        """
        current_sensors = set(self.get_sensors(current_count_str))
        if len(current_sensors) >= 20:
            return None

        if not top_candidates:
            return None

        top_nodes = [c["node"] for c in top_candidates[:3]]
        
        # Find candidates within 1-2 hops of top nodes that do not currently have a sensor
        candidate_pool = []
        for n in all_nodes:
            if n in current_sensors:
                continue
            # Check proximity to top candidates
            min_dist = min(self.graph_distances.get(n, {}).get(cand, 99) for cand in top_nodes)
            if 1 <= min_dist <= 2:
                candidate_pool.append((n, min_dist))

        if candidate_pool:
            candidate_pool.sort(key=lambda x: x[1])
            return candidate_pool[0][0]
        
        # Fallback to an unmonitored node
        unmonitored = [n for n in all_nodes if n not in current_sensors]
        return unmonitored[0] if unmonitored else None
