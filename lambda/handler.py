"""
AWS Lambda Handler for Boond Leak Detection API
Runtime: Python 3.12
Handles:
  - GET /network
  - GET /scenario?node={node}&size={size}
  - GET /health
  - OPTIONS /* (CORS Preflight)
"""

import json
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Module-level cache to persist across warm invocations
CACHED_NETWORK: Optional[Dict[str, Any]] = None
CACHED_SCENARIOS: Optional[Dict[str, Any]] = None

S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_NETWORK_KEY = os.environ.get("S3_NETWORK_KEY", "network.json")
S3_SCENARIOS_KEY = os.environ.get("S3_SCENARIOS_KEY", "scenarios.json")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Content-Type": "application/json"
}

def build_response(status_code: int, body: Any) -> Dict[str, Any]:
    """Build standard API Gateway HTTP response."""
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body) if not isinstance(body, str) else body
    }

def load_data_from_s3_or_local():
    """Load network and scenario data, trying S3 first then local fallback."""
    global CACHED_NETWORK, CACHED_SCENARIOS

    if CACHED_NETWORK is not None and CACHED_SCENARIOS is not None:
        return

    # 1. Attempt loading from Amazon S3 if S3_BUCKET configured
    if S3_BUCKET:
        try:
            import boto3
            s3 = boto3.client("s3")
            logger.info(f"Loading datasets from S3 bucket: {S3_BUCKET}")
            
            net_obj = s3.get_object(Bucket=S3_BUCKET, Key=S3_NETWORK_KEY)
            CACHED_NETWORK = json.loads(net_obj["Body"].read().decode("utf-8"))
            
            scen_obj = s3.get_object(Bucket=S3_BUCKET, Key=S3_SCENARIOS_KEY)
            CACHED_SCENARIOS = json.loads(scen_obj["Body"].read().decode("utf-8"))
            logger.info("Successfully loaded data from S3.")
            return
        except Exception as e:
            logger.warning(f"Could not load data from S3 ({e}). Falling back to local bundle.")

    # 2. Local file fallback (checks current dir, data/ subdir, or ../web)
    search_dirs = [
        os.path.dirname(os.path.abspath(__file__)),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
    ]

    for d in search_dirs:
        net_path = os.path.join(d, "network.json")
        scen_path = os.path.join(d, "scenarios.json")
        if os.path.isfile(net_path) and os.path.isfile(scen_path):
            try:
                with open(net_path, "r", encoding="utf-8") as f:
                    CACHED_NETWORK = json.load(f)
                with open(scen_path, "r", encoding="utf-8") as f:
                    CACHED_SCENARIOS = json.load(f)
                logger.info(f"Loaded datasets from local path: {d}")
                return
            except Exception as e:
                logger.error(f"Error reading local files at {d}: {e}")

    logger.error("Failed to find network.json or scenarios.json in S3 or local fallbacks.")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main AWS Lambda handler supporting API Gateway HTTP and REST APIs."""
    # Determine HTTP Method
    http_method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "GET"
    ).upper()

    # Preflight CORS
    if http_method == "OPTIONS":
        return build_response(200, {"message": "CORS preflight OK"})

    # Determine Request Path
    raw_path = (
        event.get("rawPath")
        or event.get("path")
        or "/"
    )
    # Strip stage if present (e.g., /prod/network -> /network)
    path = raw_path.split("?")[-1]
    if path.startswith("/prod"):
        path = path[5:]
    elif path.startswith("/dev"):
        path = path[4:]

    # Parse query parameters
    query_params = event.get("queryStringParameters") or {}

    # Ensure dataset is loaded into cache
    load_data_from_s3_or_local()

    # Route: GET /health or GET /
    if path in ["/", "/health"]:
        return build_response(200, {
            "status": "healthy",
            "service": "Boond Leak Detection API",
            "runtime": "AWS Lambda (Python 3.12)",
            "network_loaded": CACHED_NETWORK is not None,
            "scenarios_loaded": CACHED_SCENARIOS is not None,
            "scenario_count": len(CACHED_SCENARIOS) if isinstance(CACHED_SCENARIOS, (list, dict)) else 0
        })

    # Route: GET /network
    if path.rstrip("/") == "/network":
        if CACHED_NETWORK is None:
            return build_response(503, {"error": "Network topology dataset unavailable."})
        return build_response(200, CACHED_NETWORK)

    # Route: GET /scenario
    if path.rstrip("/") == "/scenario":
        if CACHED_SCENARIOS is None:
            return build_response(503, {"error": "Scenarios dataset unavailable."})

        node = query_params.get("node")
        size = query_params.get("size", "medium").lower()

        if not node:
            return build_response(400, {
                "error": "Missing required query parameter: 'node' (e.g., ?node=J-12&size=medium)"
            })

        scenario_id = f"{node}_{size}"
        matched_scenario = None

        if isinstance(CACHED_SCENARIOS, dict):
            matched_scenario = CACHED_SCENARIOS.get(scenario_id)
        elif isinstance(CACHED_SCENARIOS, list):
            for sc in CACHED_SCENARIOS:
                if sc.get("id") == scenario_id or (sc.get("leak_node") == node and sc.get("size_label") == size):
                    matched_scenario = sc
                    break

        if not matched_scenario:
            return build_response(404, {
                "error": f"Scenario '{scenario_id}' not found.",
                "requested_node": node,
                "requested_size": size
            })

        return build_response(200, matched_scenario)

    # Unknown route
    return build_response(404, {
        "error": f"Path '{path}' not found.",
        "supported_routes": ["/health", "/network", "/scenario?node={id}&size={size}"]
    })
