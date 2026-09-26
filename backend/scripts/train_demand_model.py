from app.services.demand_forecaster import DemandForecaster


CSV_PATH = "data/generated/demand_history.csv"


print("\nRESILICARE DEMAND FORECASTER")
print("============================")

forecaster = DemandForecaster()

forecaster.train(CSV_PATH)

print("\nTraining complete.")