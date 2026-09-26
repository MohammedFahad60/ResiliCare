import pandas as pd

from .demand_forecaster import DemandForecaster


class ForecastService:

    def __init__(self):

        self.forecaster = DemandForecaster()
        self.forecaster.load()

    def forecast_7_days(self, historical_data):

        data = historical_data.copy()

        data["date"] = pd.to_datetime(
            data["date"]
        )

        data = data.sort_values(
            "date"
        ).reset_index(drop=True)

        if len(data) < 14:
            raise ValueError(
                "At least 14 historical days "
                "are required."
            )

        predictions = []

        working_data = data.copy()

        for _ in range(7):

            prediction = (
                self.forecaster.predict_next_day(
                    working_data
                )
            )

            last_date = (
                working_data["date"].max()
            )

            next_date = (
                last_date +
                pd.Timedelta(days=1)
            )

            predictions.append({
                "date": next_date.strftime(
                    "%Y-%m-%d"
                ),
                "predicted_demand": float(prediction)
            })

            # Add prediction to history so that
            # the following prediction can use it.
            new_row = {
                "date": next_date,
                "consumption": prediction
            }

            working_data = pd.concat(
                [
                    working_data,
                    pd.DataFrame([new_row])
                ],
                ignore_index=True
            )

        total_demand = sum(
            item["predicted_demand"]
            for item in predictions
        )

        average_daily_demand = (
            total_demand / 7
        )

        return {
            "forecast_days": 7,
            "predictions": predictions,
            "total_predicted_demand": float(round(
                total_demand,
                2
            )),
            "average_daily_demand": float(round(
                average_daily_demand,
                2
            )),
        }