import {
  ArrowRight,
  BrainCircuit,
  Network,
  ShieldCheck,
} from "lucide-react";

function Hero({
  onRunSimulation,
  onExploreNetwork,
  stockoutNodes = 0,
  facilityCount = 0,
}) {
  return (
    <section className="hero-section">

      {/* =====================================================
          HERO CONTENT
      ===================================================== */}

      <div className="hero-content">

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          AI-POWERED HEALTHCARE RESILIENCE
        </div>

        <h1 className="hero-title">
          Predict healthcare
          <br />
          <span>failures before they happen.</span>
        </h1>

        <p className="hero-description">
          ResiliCare forecasts demand, detects emerging
          shortages, simulates crisis scenarios, and
          recommends cross-facility interventions before
          healthcare systems reach a breaking point.
        </p>


        {/* =================================================
            ACTIONS
            ================================================= */}

        <div className="hero-actions">

          <button
            type="button"
            className="hero-primary-button"
            onClick={onExploreNetwork}
          >
            <Network size={17} />

            Explore healthcare network

            <ArrowRight size={16} />
          </button>


          <button
            type="button"
            className="hero-secondary-button"
            onClick={onRunSimulation}
          >
            <BrainCircuit size={17} />

            Simulate a crisis
          </button>

        </div>


        {/* =================================================
            TRUST / SCALE SIGNALS
            ================================================= */}

        <div className="hero-meta">

          <div className="hero-meta-item">

            <ShieldCheck size={15} />

            <div>
              <span>NETWORK COVERAGE</span>

              <strong>
                {Number(facilityCount).toLocaleString()} facilities
              </strong>
            </div>

          </div>


          <div className="hero-meta-divider" />


          <div className="hero-meta-item">

            <BrainCircuit size={15} />

            <div>
              <span>PREDICTIVE MONITORING</span>

              <strong>
                {Number(stockoutNodes).toLocaleString()} risk signals
              </strong>
            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          HERO INTELLIGENCE PANEL
          ===================================================== */}

      <div className="hero-intelligence">

        <div className="hero-intelligence-header">

          <span>
            RESILICARE INTELLIGENCE LOOP
          </span>

          <div className="hero-live-status">
            <span />
            LIVE
          </div>

        </div>


        <div className="hero-loop">

          <div className="hero-loop-step hero-loop-active">
            <span>01</span>
            <strong>DETECT</strong>
            <small>
              Monitor network signals
            </small>
          </div>

          <div className="hero-loop-line" />

          <div className="hero-loop-step">
            <span>02</span>
            <strong>PREDICT</strong>
            <small>
              Forecast future demand
            </small>
          </div>

          <div className="hero-loop-line" />

          <div className="hero-loop-step">
            <span>03</span>
            <strong>SIMULATE</strong>
            <small>
              Stress-test the network
            </small>
          </div>

          <div className="hero-loop-line" />

          <div className="hero-loop-step">
            <span>04</span>
            <strong>ACT</strong>
            <small>
              Recommend intervention
            </small>
          </div>

        </div>


        <div className="hero-intelligence-footer">

          <span>
            Predict
          </span>

          <span>→</span>

          <span>
            Prepare
          </span>

          <span>→</span>

          <span>
            Protect
          </span>

        </div>

      </div>

    </section>
  );
}

export default Hero;