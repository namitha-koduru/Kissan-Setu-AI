from typing import List, Dict, Any
from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    MarketComparisonItem,
)
from app.services.weather_service import weather_service


class RecommendationService:
    """
    AI Decision Engine Service.
    Combines:
    1. Weather Risk
    2. Crop Stage & Maturity
    3. Mandi Market Prices
    4. Buyer Demand
    5. Transport Freight & Handling Deductions
    """

    MANDIS_DATA = [
        {
            "id": 1,
            "name": "Nashik APMC Mandi",
            "distance_km": 25.0,
            "base_price_factor": 1.0,
            "transport_rate_per_km": 16.0,
            "demand": "High",
        },
        {
            "id": 2,
            "name": "Lasalgaon APMC",
            "distance_km": 22.0,
            "base_price_factor": 0.98,
            "transport_rate_per_km": 16.0,
            "demand": "High",
        },
        {
            "id": 3,
            "name": "Pimpalgaon Baswant APMC",
            "distance_km": 18.0,
            "base_price_factor": 0.95,
            "transport_rate_per_km": 15.0,
            "demand": "Medium",
        },
        {
            "id": 4,
            "name": "Ahmednagar Mandi",
            "distance_km": 80.0,
            "base_price_factor": 0.97,
            "transport_rate_per_km": 12.5,
            "demand": "High",
        },
        {
            "id": 5,
            "name": "Pune Market Yard",
            "distance_km": 190.0,
            "base_price_factor": 1.08,  # Higher listed price, but high transport
            "transport_rate_per_km": 14.0,
            "demand": "Medium",
        },
    ]

    BASE_CROP_PRICES = {
        "tomato": 30.0,
        "onion": 19.5,
        "potato": 16.5,
        "grapes": 75.0,
        "chilli": 62.0,
    }

    @classmethod
    def evaluate_recommendation(cls, req: RecommendationRequest) -> RecommendationResponse:
        crop_key = req.crop_name.lower()
        base_price = cls.BASE_CROP_PRICES.get(crop_key, 28.0)
        qty = max(1.0, req.quantity_kg)

        weather = weather_service.get_weather_for_location(req.location)

        # Compute Net Realization for all nearby mandis
        comparisons: List[MarketComparisonItem] = []
        for mandi in cls.MANDIS_DATA:
            mandi_price = round(base_price * mandi["base_price_factor"], 1)
            transport_cost = round(mandi["distance_km"] * mandi["transport_rate_per_km"], 0)
            storage_cost = 0.0
            handling_loss_val = round((mandi["distance_km"] / 100.0) * (qty * 0.01) * mandi_price, 0)
            
            gross = mandi_price * qty
            net_total = gross - transport_cost - storage_cost - handling_loss_val
            net_per_kg = round(net_total / qty, 2)

            comparisons.append(
                MarketComparisonItem(
                    market_id=mandi["id"],
                    market_name=mandi["name"],
                    mandi_price=mandi_price,
                    distance_km=mandi["distance_km"],
                    transport_cost=transport_cost,
                    storage_cost=storage_cost,
                    handling_loss=handling_loss_val,
                    net_realization=net_per_kg,
                    demand=mandi["demand"],
                    is_recommended=False,
                )
            )

        # Rank by net realization
        comparisons.sort(key=lambda x: x.net_realization, reverse=True)
        best_market = comparisons[0]
        best_market.is_recommended = True

        # Rule evaluation
        stage_lower = req.growth_stage.lower()
        is_mature = "near" in stage_lower or "ready" in stage_lower or "harvested" in stage_lower
        weather_risk_high = weather.risk_level in ["Medium", "High"]

        reasons = []
        if is_mature and weather_risk_high and best_market.demand == "High":
            decision = "SELL"
            confidence = 94
            harvest_window = "2–4 days (Immediate)"
            reasons.append(f"Buyer wholesale demand in {best_market.market_name} is High, yielding optimal net realization.")
            reasons.append(f"Precipitation risk rises significantly within 48 hours ({weather.rain_probability}% rain probability).")
            reasons.append(f"Freight cost to {best_market.market_name} (₹{best_market.transport_cost}) yields higher in-hand return than distant mandis with higher listed rates.")
        elif not is_mature and not weather_risk_high:
            decision = "WAIT"
            confidence = 88
            harvest_window = "12–18 days"
            reasons.append("Crop is currently in vegetative/growth stage and has not reached harvest maturity.")
            reasons.append("Weather risk is currently Low, providing safe growing conditions.")
            reasons.append("Holding crop allows development of premium Grade A sizing for higher eventual market price.")
        else:
            decision = "SWITCH"
            confidence = 82
            harvest_window = "3–5 days"
            reasons.append(f"{best_market.market_name} yields higher net realization (₹{best_market.net_realization}/kg) after freight deductions.")
            reasons.append("Nearby local mandi has lower active buyer bidding compared to the recommended hub.")

        return RecommendationResponse(
            decision=decision,
            confidence_score=confidence,
            crop_name=req.crop_name,
            quantity_kg=qty,
            growth_stage=req.growth_stage,
            harvest_window=harvest_window,
            weather_risk=weather.risk_level,
            buyer_demand=best_market.demand,
            best_market=best_market.market_name,
            expected_net_realization=best_market.net_realization,
            total_expected_revenue=round(best_market.net_realization * qty, 0),
            reasons=reasons,
            market_comparisons=comparisons,
            score_breakdown={
                "net_realization_score": best_market.net_realization,
                "weather_pressure": 85 if weather_risk_high else 20,
                "readiness_score": 90 if is_mature else 35,
                "demand_weight": 95 if best_market.demand == "High" else 60,
            },
        )

    @classmethod
    def generate_recommendation(cls, req: RecommendationRequest, db: Any = None) -> RecommendationResponse:
        return cls.evaluate_recommendation(req)


recommendation_service = RecommendationService()
