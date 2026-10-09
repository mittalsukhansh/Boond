"""
src/export.py
Exporter module producing deployment artifacts:
- web/network.json
- web/scenarios.json (and offline JS wrappers)
- lambda/model.npz (numpy-only lightweight model for AWS Lambda runtime)
"""

import json
import os
import numpy as np

def export_web_contract(network_dict, scenarios_dict, web_dir="web"):
    os.makedirs(web_dir, exist_ok=True)
    
    # 1. Export network.json
    net_path = os.path.join(web_dir, "network.json")
    with open(net_path, "w", encoding="utf-8") as f:
        json.dump(network_dict, f, indent=2)
    print(f"Exported {net_path}")

    # Fallback network.js
    with open(os.path.join(web_dir, "network.js"), "w", encoding="utf-8") as f:
        f.write("window.BOOND_NETWORK = " + json.dumps(network_dict) + ";\n")

    # 2. Export scenarios.json
    scen_path = os.path.join(web_dir, "scenarios.json")
    with open(scen_path, "w", encoding="utf-8") as f:
        json.dump(scenarios_dict, f, indent=2)
    print(f"Exported {scen_path} ({len(scenarios_dict)} scenarios)")

    # Fallback scenarios.js
    with open(os.path.join(web_dir, "scenarios.js"), "w", encoding="utf-8") as f:
        f.write("window.BOOND_SCENARIOS = " + json.dumps(scenarios_dict) + ";\n")

def export_lambda_model(baseline_dict, sensitivity_dict, signatures_matrix, node_list, thresholds_dict, lambda_dir="lambda"):
    os.makedirs(lambda_dir, exist_ok=True)
    model_path = os.path.join(lambda_dir, "model.npz")

    np.savez_compressed(
        model_path,
        node_list=np.array(node_list, dtype=str),
        signatures=signatures_matrix,
        baseline=np.array(list(baseline_dict.values()), dtype=np.float64),
        sensitivities=np.array(list(sensitivity_dict.values()), dtype=np.float64),
        cancelled_threshold=float(thresholds_dict.get("cancelled", 1.10)),
        plain_threshold=float(thresholds_dict.get("plain", 1.65))
    )
    print(f"Exported {model_path} (Lambda numpy-only model)")
