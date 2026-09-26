import { motion } from "framer-motion";
import { ArrowDownRight } from "lucide-react";

function ResiliencePanel({
  simulationActive,
  impactResult,
  currentRisk = 0,
}) {
  const hasImpact =
    Boolean(impactResult?.impact);

  const beforeRisk = hasImpact
    ? Number(
        impactResult.impact.before
          ?.average_risk_score ?? currentRisk
      )
    : Number(currentRisk || 0);

  const afterRisk = hasImpact
    ? Number(
        impactResult.impact.after
          ?.average_risk_score ?? currentRisk
      )
    : Number(currentRisk || 0);

  const riskImprovement =
    beforeRisk - afterRisk;

  const improvementPercent =
    beforeRisk > 0
      ? (riskImprovement / beforeRisk) * 100
      : 0;

  const displayRisk =
    hasImpact
      ? afterRisk
      : currentRisk;

  return (
    <div className="resilience-card">

      <div className="card-heading">

        <div>

          <span className="section-eyebrow">
            SYSTEM RESILIENCE
          </span>

          <h2>
            Before & after
          </h2>

        </div>

        <div className="simulation-badge">
          {simulationActive
            ? "Scenario applied"
            : "Live baseline"}
        </div>

      </div>

      <div className="resilience-score">

        <div className="score-ring">

          <svg viewBox="0 0 120 120">

            <circle
              className="score-track"
              cx="60"
              cy="60"
              r="49"
            />

            <motion.circle
              className="score-progress"
              cx="60"
              cy="60"
              r="49"
              initial={{
                strokeDashoffset: 308,
              }}
              animate={{
                strokeDashoffset:
                  308 -
                  308 *
                    (Math.min(
                      Math.max(
                        Number(displayRisk) || 0,
                        0
                      ),
                      100
                    ) / 100),
              }}
              transition={{
                duration: 1.1,
              }}
            />

          </svg>

          <div className="score-center">

            <strong>
              {Number(displayRisk).toFixed(2)}
            </strong>

            <span>
              risk
            </span>

          </div>

        </div>

        <div className="score-copy">

          <strong>
            {displayRisk >= 70
              ? "High pressure"
              : displayRisk >= 40
              ? "Moderate pressure"
              : "Stable network"}
          </strong>

          <p>
            {hasImpact
              ? "Resource redistribution has been evaluated against the simulated network condition."
              : "Current network risk based on live facility and inventory intelligence."}
          </p>

        </div>

      </div>

      <div className="comparison">

        <div>

          <span>
            {hasImpact
              ? "BEFORE"
              : "CURRENT"}
          </span>

          <strong>
            {beforeRisk.toFixed(2)}
          </strong>

        </div>

        <div className="comparison-arrow">

          <ArrowDownRight size={20} />

        </div>

        <div className="after-score">

          <span>
            {hasImpact
              ? "AFTER"
              : "PROJECTED"}
          </span>

          <strong>
            {afterRisk.toFixed(2)}
          </strong>

        </div>

        <div className="improvement">

          <span>
            CHANGE
          </span>

          <strong>
            {hasImpact
              ? `${riskImprovement >= 0 ? "-" : "+"}${Math.abs(
                  improvementPercent
                ).toFixed(2)}%`
              : "—"}
          </strong>

        </div>

      </div>

    </div>
  );
}

export default ResiliencePanel;