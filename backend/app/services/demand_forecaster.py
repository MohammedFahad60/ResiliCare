import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


MODEL_PATH = "data/generated/demand_model.joblib"


class DemandForecaster:

    def __init__(self):

        self.model = RandomForestRegressor(
            n_estimators=150,
            max_depth=12,
            random_state=42,
            n_jobs=-1
        )

        self.trained = False

    # --------------------------------------------------
    # Feature Engineering
    # --------------------------------------------------

    def create_features(self, df):

        df = df.copy()

        df["date"] = pd.to_datetime(
            df["date"]
        )

        df["day_of_week"] = (
            df["date"].dt.dayofweek
        )

        df["day_of_month"] = (
            df["date"].dt.day
        )

        df["month"] = (
            df["date"].dt.month
        )

        # Previous day's consumption
        df["lag_1"] = (
            df.groupby(
                ["facility_code", "medicine"]
            )["consumption"]
            .shift(1)
        )

        # Same day one week earlier
        df["lag_7"] = (
            df.groupby(
                ["facility_code", "medicine"]
            )["consumption"]
            .shift(7)
        )

        # 7-day rolling average
        df["rolling_7"] = (
            df.groupby(
                ["facility_code", "medicine"]
            )["consumption"]
            .transform(
                lambda x:
                x.shift(1)
                .rolling(7)
                .mean()
            )
        )

        # 14-day rolling average
        df["rolling_14"] = (
            df.groupby(
                ["facility_code", "medicine"]
            )["consumption"]
            .transform(
                lambda x:
                x.shift(1)
                .rolling(14)
                .mean()
            )
        )

        return df

    # --------------------------------------------------
    # Train Model
    # --------------------------------------------------

    def train(self, csv_path):

        print("\nLoading demand history...")

        df = pd.read_csv(
            csv_path
        )

        print(
            f"Loaded {len(df)} records."
        )

        df = self.create_features(df)

        # Remove rows where lag/rolling
        # features are unavailable
        df = df.dropna()

        features = [
            "day_of_week",
            "day_of_month",
            "month",
            "lag_1",
            "lag_7",
            "rolling_7",
            "rolling_14"
        ]

        X = df[features]

        y = df["consumption"]

        print(
            f"Training samples: {len(X)}"
        )

        print(
            "Training Random Forest model..."
        )

        self.model.fit(
            X,
            y
        )

        self.trained = True

        # Make sure output directory exists
        os.makedirs(
            os.path.dirname(MODEL_PATH),
            exist_ok=True
        )

        joblib.dump(
            self.model,
            MODEL_PATH
        )

        print(
            f"Model saved to: {MODEL_PATH}"
        )

    # --------------------------------------------------
    # Load Model
    # --------------------------------------------------

    def load(self):

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Train the model first."
            )

        self.model = joblib.load(
            MODEL_PATH
        )

        self.trained = True

    # --------------------------------------------------
    # Predict Next Day
    # --------------------------------------------------

    def predict_next_day(
        self,
        recent_data
    ):

        if not self.trained:
            self.load()

        recent_data = recent_data.copy()

        recent_data["date"] = pd.to_datetime(
            recent_data["date"]
        )

        recent_data = recent_data.sort_values(
            "date"
        )

        last_date = (
            recent_data["date"].max()
        )

        next_date = (
            last_date +
            pd.Timedelta(days=1)
        )

        consumption_values = (
            recent_data["consumption"]
            .tolist()
        )

        if len(consumption_values) < 14:
            raise ValueError(
                "At least 14 days of historical "
                "data are required for prediction."
            )

        lag_1 = consumption_values[-1]

        lag_7 = consumption_values[-7]

        rolling_7 = sum(
            consumption_values[-7:]
        ) / 7

        rolling_14 = sum(
            consumption_values[-14:]
        ) / 14

        features = pd.DataFrame([
            {
                "day_of_week":
                    next_date.dayofweek,

                "day_of_month":
                    next_date.day,

                "month":
                    next_date.month,

                "lag_1":
                    lag_1,

                "lag_7":
                    lag_7,

                "rolling_7":
                    rolling_7,

                "rolling_14":
                    rolling_14
            }
        ])

        prediction = self.model.predict(
            features
        )[0]

        return round(
            max(0, prediction),
            2
        )