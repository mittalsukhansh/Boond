"""
src/config.py
Configuration and physical constants for the Boond hydraulic simulation & leak detection pipeline.
Strict adherence to Plan A (Modelling Lead) contracts and physical constants.
"""

# Supply windows: hours of day when network is pressurized (06:00-09:00 and 18:00-21:00)
SUPPLY_WINDOWS = [[6, 9], [18, 21]]

# Sensor sets (nested: 5 within 10 within 20)
SENSOR_SETS = {
    "5": ["J-14", "J-21", "J-37", "J-52", "J-66"],
    "10": ["J-14", "J-21", "J-37", "J-52", "J-66", "J-18", "J-29", "J-43", "J-58", "J-61"],
    "20": [
        "J-14", "J-21", "J-37", "J-52", "J-66",
        "J-18", "J-29", "J-43", "J-58", "J-61",
        "J-11", "J-16", "J-25", "J-32", "J-40",
        "J-48", "J-55", "J-63", "J-68", "J-69"
    ]
}

# Leak sizes as defined in contract
LEAK_SIZES = {
    "small": {
        "pct_of_supply": 2.5,
        "orifice_flow_factor": 0.45,
        "label": "small"
    },
    "medium": {
        "pct_of_supply": 7.5,
        "orifice_flow_factor": 1.15,
        "label": "medium"
    },
    "large": {
        "pct_of_supply": 14.0,
        "orifice_flow_factor": 2.40,
        "label": "large"
    }
}

# Multi-cycle sequence configuration
N_CYCLES = 8
LEAK_START_CYCLE = 3  # Cycles 0, 1, 2 normal baseline; leak active cycles 3..7

# Demand variation parameters: consumer drawing varies +/- 10%
DEMAND_FACTOR_LOW = 0.90
DEMAND_FACTOR_HIGH = 1.10

# Orifice discharge coefficient
CD = 0.75
GRAVITY = 9.81

# Detection parameters
TARGET_PER_CYCLE_FAR = 0.05  # 5% False Alarm Rate on no-leak runs
PERSISTENCE_WINDOW = 3       # Alarm if d > threshold in 2 of last 3 cycles
PERSISTENCE_REQUIRED = 2

# Baseline hydraulic head range (metres)
BASE_PRESSURE_HEAD_MEAN = 28.5
BASE_PRESSURE_HEAD_STD = 2.0
