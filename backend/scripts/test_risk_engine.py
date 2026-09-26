from app.services.risk_engine import calculate_inventory_risk


result = calculate_inventory_risk(
    current_stock=183,
    daily_consumption=91,
    safety_stock=273,
    incoming_quantity=1346,
    lead_time_days=3
)

print("\nRESILICARE RISK ENGINE")
print("----------------------")

for key, value in result.items():
    print(f"{key}: {value}")