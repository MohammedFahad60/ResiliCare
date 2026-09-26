import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Database,
  LockKeyhole,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value || 0)
  );
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getRegionInitials(name) {
  return String(name || "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Federated() {
  const [data, setData] = useState(null);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadFederatedData() {
    try {
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/federated/summary`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load federated intelligence: ${response.status}`
        );
      }

      const result = await response.json();

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Failed to load federated data:",
        err
      );

      setError(
        err.message ||
          "Unable to load federated intelligence."
      );
    }
  }

  async function runFederatedTraining() {
    try {
      setTraining(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/federated/train`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Federated training failed: ${response.status}`
        );
      }

      const result = await response.json();

      /*
       * The training endpoint returns the newly
       * aggregated global model. Merge the result
       * into the current page state.
       */

      setData((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          federated_learning: {
            ...previous.federated_learning,
            global_accuracy:
              result.global_model?.accuracy ??
              previous.federated_learning
                .global_accuracy,

            baseline_accuracy:
              result.global_model?.previous_accuracy ??
              previous.federated_learning
                .baseline_accuracy,

            accuracy_improvement:
              result.global_model?.improvement ??
              previous.federated_learning
                .accuracy_improvement,

            round:
              result.round ??
              previous.federated_learning.round,
          },
        };
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Federated training failed:",
        err
      );

      setError(
        err.message ||
          "Unable to run federated training."
      );
    } finally {
      setTraining(false);
    }
  }

  useEffect(() => {
    loadFederatedData();
  }, []);

  const regions = data?.regions || [];

  const federation = data?.federated_learning || {};

  const globalAccuracy = Number(
    federation.global_accuracy || 0
  );

  const baselineAccuracy = Number(
    federation.baseline_accuracy || 0
  );

  const improvement = Number(
    federation.accuracy_improvement || 0
  );

  const maxContribution = useMemo(() => {
    if (!regions.length) {
      return 1;
    }

    return Math.max(
      ...regions.map((region) =>
        Number(region.contribution || 0)
      )
    );
  }, [regions]);

  if (error && !data) {
    return (
      <main className="page-content federated-page">
        <section className="federated-state">
          <div className="federated-state-icon">
            <Activity size={22} />
          </div>

          <h2>
            Federated Intelligence unavailable
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="federated-retry-button"
            onClick={loadFederatedData}
          >
            <RefreshCw size={15} />
            Retry connection
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-content federated-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="federated-hero">

        <div className="federated-hero-copy">

          <div className="federated-eyebrow">
            <span className="federated-live-dot" />
            FEDERATED INTELLIGENCE
          </div>

          <h1>
            Learn together.
            <br />
            <span>Keep data local.</span>
          </h1>

          <p>
            ResiliCare simulates privacy-preserving
            collaborative learning across regional
            healthcare networks without centralizing
            the underlying operational data.
          </p>

        </div>

        <div className="federated-hero-status">

          <div className="federated-status-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <span>NETWORK STATUS</span>
            <strong>
              {data?.status === "ready"
                ? "FEDERATION READY"
                : "INITIALIZING"}
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          KPI GRID
          ===================================================== */}

      <section className="federated-kpi-grid">

        <article className="federated-kpi federated-kpi-primary">

          <div className="federated-kpi-top">
            <span>GLOBAL MODEL</span>
            <BrainCircuit size={17} />
          </div>

          <strong>
            {formatPercent(globalAccuracy)}
          </strong>

          <div className="federated-kpi-meta">
            <span>
              Baseline{" "}
              {formatPercent(baselineAccuracy)}
            </span>

            <b>
              +{improvement.toFixed(1)} pts
            </b>
          </div>

        </article>


        <article className="federated-kpi">

          <div className="federated-kpi-top">
            <span>REGIONAL NODES</span>
            <Network size={17} />
          </div>

          <strong>
            {federation.nodes || 0}
          </strong>

          <span className="federated-kpi-description">
            Participating regional models
          </span>

        </article>


        <article className="federated-kpi">

          <div className="federated-kpi-top">
            <span>FACILITIES</span>
            <Server size={17} />
          </div>

          <strong>
            {formatNumber(
              federation.facilities
            )}
          </strong>

          <span className="federated-kpi-description">
            Healthcare facilities represented
          </span>

        </article>


        <article className="federated-kpi">

          <div className="federated-kpi-top">
            <span>TRAINING SAMPLES</span>
            <Database size={17} />
          </div>

          <strong>
            {formatNumber(
              federation.samples
            )}
          </strong>

          <span className="federated-kpi-description">
            Distributed local observations
          </span>

        </article>


        <article className="federated-kpi">

          <div className="federated-kpi-top">
            <span>RAW DATA SHARED</span>
            <LockKeyhole size={17} />
          </div>

          <strong className="federated-safe-value">
            NO
          </strong>

          <span className="federated-kpi-description">
            Model updates only
          </span>

        </article>

      </section>


      {/* =====================================================
          FEDERATED PIPELINE
          ===================================================== */}

      <section className="federated-pipeline-section">

        <div className="federated-section-heading">

          <div>
            <span>HOW RESILICARE LEARNS</span>

            <h2>
              Distributed intelligence,
              <br />
              one shared model.
            </h2>
          </div>

          <p>
            Each region trains locally. Only model
            updates participate in aggregation.
          </p>

        </div>


        <div className="federated-pipeline">

          <div className="federated-pipeline-node">

            <div className="federated-pipeline-icon">
              <Server size={21} />
            </div>

            <span>01</span>

            <strong>
              LOCAL DATA
            </strong>

            <p>
              Healthcare data remains within
              its regional environment.
            </p>

          </div>


          <div className="federated-pipeline-line">
            <span />
          </div>


          <div className="federated-pipeline-node">

            <div className="federated-pipeline-icon">
              <BrainCircuit size={21} />
            </div>

            <span>02</span>

            <strong>
              LOCAL TRAINING
            </strong>

            <p>
              Each regional node trains its
              own resilience model.
            </p>

          </div>


          <div className="federated-pipeline-line">
            <span />
          </div>


          <div className="federated-pipeline-node">

            <div className="federated-pipeline-icon">
              <Network size={21} />
            </div>

            <span>03</span>

            <strong>
              FEDERATED AGGREGATION
            </strong>

            <p>
              Model updates are combined using
              federated averaging.
            </p>

          </div>


          <div className="federated-pipeline-line">
            <span />
          </div>


          <div className="federated-pipeline-node federated-pipeline-final">

            <div className="federated-pipeline-icon">
              <Sparkles size={21} />
            </div>

            <span>04</span>

            <strong>
              GLOBAL MODEL
            </strong>

            <p>
              A shared model improves network-wide
              resilience intelligence.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          REGIONAL MODELS
          ===================================================== */}

      <section className="federated-regions-section">

        <div className="federated-section-heading">

          <div>
            <span>LOCAL MODEL NETWORK</span>

            <h2>
              Regional intelligence nodes
            </h2>
          </div>

          <button
            type="button"
            className="federated-train-button"
            onClick={runFederatedTraining}
            disabled={training}
          >
            <RefreshCw
              size={15}
              className={
                training
                  ? "federated-spin"
                  : ""
              }
            />

            {training
              ? "Aggregating..."
              : "Run training round"}
          </button>

        </div>


        <div className="federated-region-grid">

          {regions.map((region) => {

            const contribution =
              Number(
                region.contribution || 0
              );

            const contributionWidth =
              Math.max(
                8,
                (contribution /
                  maxContribution) *
                  100
              );

            return (
              <article
                className="federated-region-card"
                key={region.id}
              >

                <div className="federated-region-top">

                  <div className="federated-region-avatar">
                    {getRegionInitials(
                      region.name
                    )}
                  </div>

                  <div className="federated-region-name">
                    <strong>
                      {region.name}
                    </strong>

                    <span>
                      {region.facilities} facilities
                    </span>
                  </div>

                  <CheckCircle2
                    size={17}
                    className="federated-region-check"
                  />

                </div>


                <div className="federated-region-accuracy">

                  <div>
                    <span>
                      LOCAL ACCURACY
                    </span>

                    <strong>
                      {formatPercent(
                        region.local_accuracy
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      RISK INDEX
                    </span>

                    <strong>
                      {Number(
                        region.local_risk || 0
                      ).toFixed(1)}
                    </strong>
                  </div>

                </div>


                <div className="federated-region-samples">

                  <div className="federated-region-samples-row">
                    <span>
                      Training samples
                    </span>

                    <strong>
                      {formatNumber(
                        region.samples
                      )}
                    </strong>
                  </div>

                  <div className="federated-contribution-track">
                    <span
                      style={{
                        width: `${contributionWidth}%`,
                      }}
                    />
                  </div>

                  <div className="federated-region-samples-row">
                    <span>
                      Model contribution
                    </span>

                    <strong>
                      {contribution.toFixed(1)}%
                    </strong>
                  </div>

                </div>

              </article>
            );
          })}

        </div>

      </section>


      {/* =====================================================
          AGGREGATION STATUS
          ===================================================== */}

      <section className="federated-aggregation">

        <div className="federated-aggregation-main">

          <div className="federated-aggregation-icon">
            <Network size={22} />
          </div>

          <div>

            <span>
              FEDERATED AGGREGATION
            </span>

            <h3>
              Round{" "}
              {federation.round || 0}
              {" "}
              of{" "}
              {federation.total_rounds || 0}
            </h3>

            <p>
              Model updates from{" "}
              {federation.local_models || 0}
              {" "}
              regional nodes have been
              incorporated into the shared model.
            </p>

          </div>

        </div>


        <div className="federated-aggregation-metrics">

          <div>
            <span>METHOD</span>
            <strong>
              Federated Averaging
            </strong>
          </div>

          <div>
            <span>DATA EXCHANGE</span>
            <strong>
              Model Updates
            </strong>
          </div>

          <div>
            <span>RAW DATA</span>
            <strong>
              Protected
            </strong>
          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER STATUS
          ===================================================== */}

      <section className="federated-footer">

        <div>
          <LockKeyhole size={15} />

          <span>
            Raw healthcare data remains local
          </span>
        </div>

        {lastUpdated && (
          <span>
            Updated{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </span>
        )}

      </section>

    </main>
  );
}