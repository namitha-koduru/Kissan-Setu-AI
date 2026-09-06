"""
Agronomic Crop Knowledge Base for KissanSetuAI.
Stores structured, verified agronomic parameters for key Indian crops:
- Preferred pH range
- Compatible soil types
- Optimal temperature & rainfall requirements
- Season & growth duration
- Nutrient demands (NPK)
- Weather sensitivities & critical growth stages
"""

from typing import Dict, Any, List


CROP_KNOWLEDGE: Dict[str, Dict[str, Any]] = {
    "Tomato": {
        "scientific_name": "Solanum lycopersicum",
        "category": "Vegetable",
        "preferred_ph_min": 6.0,
        "preferred_ph_max": 7.5,
        "compatible_soils": ["Loamy", "Sandy", "Black", "Red", "Alluvial"],
        "ideal_temp_min": 18.0,
        "ideal_temp_max": 30.0,
        "rainfall_requirement_mm": [600, 1200],
        "primary_seasons": ["Kharif", "Rabi", "Zaid"],
        "duration_days": 110,
        "growth_stages": [
            {"name": "Nursery / Seedling", "days": (0, 25)},
            {"name": "Vegetative", "days": (25, 50)},
            {"name": "Flowering & Fruit Set", "days": (50, 75)},
            {"name": "Fruiting / Ripening", "days": (75, 100)},
            {"name": "Harvest-ready", "days": (100, 120)},
        ],
        "nutrient_demand": {
            "nitrogen": "medium",      # 100-120 kg/ha
            "phosphorus": "medium",    # 50-60 kg/ha
            "potassium": "high",       # 80-100 kg/ha
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "high",  # flower drop, fungal fruit rot, cracking
            "heat_stress_c": 36.0,
            "frost_sensitivity": "high",
            "waterlogging_tolerance": "low",
        },
        "market_demand_profile": "High Year-Round Mandi Demand",
    },
    "Onion": {
        "scientific_name": "Allium cepa",
        "category": "Vegetable / Bulb",
        "preferred_ph_min": 5.8,
        "preferred_ph_max": 7.2,
        "compatible_soils": ["Alluvial", "Loamy", "Sandy", "Black", "Red"],
        "ideal_temp_min": 13.0,
        "ideal_temp_max": 28.0,
        "rainfall_requirement_mm": [400, 800],
        "primary_seasons": ["Kharif", "Late Kharif", "Rabi"],
        "duration_days": 130,
        "growth_stages": [
            {"name": "Seedling / Translanting", "days": (0, 35)},
            {"name": "Vegetative Foliage Growth", "days": (35, 70)},
            {"name": "Bulb Initiation & Enlargement", "days": (70, 110)},
            {"name": "Neck Fall & Harvest Maturity", "days": (110, 140)},
        ],
        "nutrient_demand": {
            "nitrogen": "medium",      # 80-100 kg/ha
            "phosphorus": "medium",    # 40-50 kg/ha
            "potassium": "medium",     # 50-60 kg/ha
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "high",  # bulb rotting and purple blotch
            "heat_stress_c": 35.0,
            "frost_sensitivity": "medium",
            "waterlogging_tolerance": "very_low",
        },
        "market_demand_profile": "Extremely High Domestic & Export Trading Volume",
    },
    "Grapes": {
        "scientific_name": "Vitis vinifera",
        "category": "Fruit / Perennial",
        "preferred_ph_min": 6.5,
        "preferred_ph_max": 8.0,
        "compatible_soils": ["Black", "Loamy", "Sandy", "Red"],
        "ideal_temp_min": 15.0,
        "ideal_temp_max": 35.0,
        "rainfall_requirement_mm": [500, 900],
        "primary_seasons": ["October Pruning (Forward)", "April Pruning (Back)"],
        "duration_days": 160,
        "growth_stages": [
            {"name": "Bud Sprout & Shoot Growth", "days": (0, 30)},
            {"name": "Flowering & Cap Fall", "days": (30, 55)},
            {"name": "Berry Set & Cell Division", "days": (55, 80)},
            {"name": "Berry Elongation & Sugar Accumulation (Veraison)", "days": (80, 130)},
            {"name": "Harvest Maturity", "days": (130, 165)},
        ],
        "nutrient_demand": {
            "nitrogen": "medium",
            "phosphorus": "medium",
            "potassium": "high",       # critical for brix/sugar development
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "very_high",  # downy mildew, berry cracking, rot
            "heat_stress_c": 38.0,
            "frost_sensitivity": "high",
            "waterlogging_tolerance": "low",
        },
        "market_demand_profile": "Premium Domestic & Export Cold Chain Value",
    },
    "Chilli": {
        "scientific_name": "Capsicum annuum",
        "category": "Spice / Vegetable",
        "preferred_ph_min": 6.0,
        "preferred_ph_max": 7.5,
        "compatible_soils": ["Black", "Loamy", "Red", "Alluvial"],
        "ideal_temp_min": 20.0,
        "ideal_temp_max": 32.0,
        "rainfall_requirement_mm": [600, 1000],
        "primary_seasons": ["Kharif", "Rabi"],
        "duration_days": 150,
        "growth_stages": [
            {"name": "Nursery Seedling", "days": (0, 30)},
            {"name": "Vegetative Branching", "days": (30, 60)},
            {"name": "Flowering & Fruit Setting", "days": (60, 90)},
            {"name": "Green / Red Pod Harvesting", "days": (90, 160)},
        ],
        "nutrient_demand": {
            "nitrogen": "medium",
            "phosphorus": "medium",
            "potassium": "medium",
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "medium",
            "heat_stress_c": 38.0,
            "frost_sensitivity": "high",
            "waterlogging_tolerance": "low",
        },
        "market_demand_profile": "Steady Cash Crop Demand",
    },
    "Potato": {
        "scientific_name": "Solanum tuberosum",
        "category": "Tuber",
        "preferred_ph_min": 5.2,
        "preferred_ph_max": 6.8,
        "compatible_soils": ["Loamy", "Sandy", "Alluvial"],
        "ideal_temp_min": 15.0,
        "ideal_temp_max": 24.0,
        "rainfall_requirement_mm": [500, 700],
        "primary_seasons": ["Rabi"],
        "duration_days": 100,
        "growth_stages": [
            {"name": "Sprout Development", "days": (0, 20)},
            {"name": "Vegetative Canopy Growth", "days": (20, 45)},
            {"name": "Tuber Initiation & Bulking", "days": (45, 80)},
            {"name": "Skin Hardening & Maturity", "days": (80, 105)},
        ],
        "nutrient_demand": {
            "nitrogen": "high",
            "phosphorus": "high",
            "potassium": "high",
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "high",  # late blight risk in humid/wet conditions
            "heat_stress_c": 30.0,
            "frost_sensitivity": "medium",
            "waterlogging_tolerance": "very_low",
        },
        "market_demand_profile": "High Bulk Staple Consumption",
    },
    "Pomegranate": {
        "scientific_name": "Punica granatum",
        "category": "Fruit / Perennial",
        "preferred_ph_min": 6.5,
        "preferred_ph_max": 8.0,
        "compatible_soils": ["Loamy", "Sandy", "Black", "Alluvial", "Red"],
        "ideal_temp_min": 22.0,
        "ideal_temp_max": 38.0,
        "rainfall_requirement_mm": [400, 700],
        "primary_seasons": ["Mridag Bahar", "Ambe Bahar", "Hasta Bahar"],
        "duration_days": 180,
        "growth_stages": [
            {"name": "Flowering & Fruit Setting", "days": (0, 45)},
            {"name": "Fruit Growth & Aril Development", "days": (45, 120)},
            {"name": "Color Development & Maturity", "days": (120, 180)},
        ],
        "nutrient_demand": {
            "nitrogen": "medium",
            "phosphorus": "medium",
            "potassium": "high",
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "medium",  # bacterial blight (telya) risk in humid rains
            "heat_stress_c": 42.0,
            "frost_sensitivity": "low",
            "waterlogging_tolerance": "low",
        },
        "market_demand_profile": "High Value Export & Domestic Table Fruit",
    },
    "Wheat": {
        "scientific_name": "Triticum aestivum",
        "category": "Cereal Grain",
        "preferred_ph_min": 6.0,
        "preferred_ph_max": 7.5,
        "compatible_soils": ["Alluvial", "Clay", "Loamy", "Black"],
        "ideal_temp_min": 12.0,
        "ideal_temp_max": 25.0,
        "rainfall_requirement_mm": [350, 600],
        "primary_seasons": ["Rabi"],
        "duration_days": 120,
        "growth_stages": [
            {"name": "Crown Root & Tillering", "days": (0, 35)},
            {"name": "Jointing & Booting", "days": (35, 65)},
            {"name": "Heading & Flowering", "days": (65, 85)},
            {"name": "Grain Filling (Milk & Dough)", "days": (85, 110)},
            {"name": "Ripening & Harvest", "days": (110, 130)},
        ],
        "nutrient_demand": {
            "nitrogen": "high",
            "phosphorus": "medium",
            "potassium": "medium",
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "medium",  # lodging and grain discoloration near harvest
            "heat_stress_c": 32.0,
            "frost_sensitivity": "low",
            "waterlogging_tolerance": "low",
        },
        "market_demand_profile": "High Government MSP & Mandi Offtake",
    },
    "Cotton": {
        "scientific_name": "Gossypium hirsutum",
        "category": "Commercial Fibre",
        "preferred_ph_min": 6.0,
        "preferred_ph_max": 8.0,
        "compatible_soils": ["Black", "Alluvial", "Red", "Loamy"],
        "ideal_temp_min": 21.0,
        "ideal_temp_max": 35.0,
        "rainfall_requirement_mm": [600, 1100],
        "primary_seasons": ["Kharif"],
        "duration_days": 160,
        "growth_stages": [
            {"name": "Germination & Seedling", "days": (0, 25)},
            {"name": "Square Formation", "days": (25, 55)},
            {"name": "Flowering & Boll Development", "days": (55, 110)},
            {"name": "Boll Bursting & Picking", "days": (110, 170)},
        ],
        "nutrient_demand": {
            "nitrogen": "high",
            "phosphorus": "medium",
            "potassium": "high",
        },
        "weather_sensitivities": {
            "heavy_rain_risk": "high",  # boll drop during flowering, fibre discoloration
            "heat_stress_c": 40.0,
            "frost_sensitivity": "high",
            "waterlogging_tolerance": "very_low",
        },
        "market_demand_profile": "High Cash Crop Market",
    },
}


def get_crop_knowledge(crop_name: str) -> Dict[str, Any]:
    """Retrieves agronomic profile for a crop with case-insensitive fallback."""
    for key, data in CROP_KNOWLEDGE.items():
        if key.lower() == crop_name.strip().lower():
            return {"name": key, **data}
    
    # Return default generic profile if not explicitly configured
    return {
        "name": crop_name,
        "scientific_name": "Agricultural Crop",
        "category": "General Crop",
        "preferred_ph_min": 6.0,
        "preferred_ph_max": 7.5,
        "compatible_soils": ["Loamy", "Alluvial", "Black", "Red"],
        "ideal_temp_min": 18.0,
        "ideal_temp_max": 32.0,
        "rainfall_requirement_mm": [500, 1000],
        "primary_seasons": ["Kharif", "Rabi"],
        "duration_days": 120,
        "growth_stages": [
            {"name": "Vegetative Stage", "days": (0, 45)},
            {"name": "Flowering / Reproductive", "days": (45, 80)},
            {"name": "Maturity / Harvest Ready", "days": (80, 120)},
        ],
        "nutrient_demand": {"nitrogen": "medium", "phosphorus": "medium", "potassium": "medium"},
        "weather_sensitivities": {"heavy_rain_risk": "medium", "heat_stress_c": 36.0, "frost_sensitivity": "medium", "waterlogging_tolerance": "low"},
        "market_demand_profile": "Standard Mandi Demand",
    }


def list_available_crops() -> List[str]:
    """Returns list of configured demo crops."""
    return list(CROP_KNOWLEDGE.keys())
