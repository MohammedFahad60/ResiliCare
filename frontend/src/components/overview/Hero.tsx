import { ArrowRight, BrainCircuit, Network, ShieldCheck } from "lucide-react";

interface HeroProps {
  onRunSimulation: () => void;
  onExploreNetwork: () => void;
  stockoutNodes?: number;
  facilityCount?: number;
}

function Hero({
  onRunSimulation,
  onExploreNetwork,
  stockoutNodes = 0,
  facilityCount = 0,
}: HeroProps) {
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
          ResiliCare forecasts demand, detects emerging shortages, simulates
          crisis scenarios, and recommends cross-facility interventions before
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
          <span>RESILICARE INTELLIGENCE LOOP</span>

          <div className="hero-live-status">
            <span />
            LIVE
          </div>
        </div>

        <div className="hero-loop">
          {/* DETECT */}
          <div className="hero-loop-step hero-loop-step-1">
            <div className="hero-step-number">01</div>

            <strong>DETECT</strong>

            <small>Monitor network signals</small>

            <div className="hero-step-glow" />
          </div>

          <div className="hero-loop-line">
            <span />
          </div>

          {/* PREDICT */}
          <div className="hero-loop-step hero-loop-step-2">
            <div className="hero-step-number">02</div>

            <strong>PREDICT</strong>

            <small>Forecast future demand</small>

            <div className="hero-step-glow" />
          </div>

          <div className="hero-loop-line">
            <span />
          </div>

          {/* SIMULATE */}
          <div className="hero-loop-step hero-loop-step-3">
            <div className="hero-step-number">03</div>

            <strong>SIMULATE</strong>

            <small>Stress-test the network</small>

            <div className="hero-step-glow" />
          </div>

          <div className="hero-loop-line">
            <span />
          </div>

          {/* ACT */}
          <div className="hero-loop-step hero-loop-step-4">
            <div className="hero-step-number">04</div>

            <strong>ACT</strong>

            <small>Recommend intervention</small>

            <div className="hero-step-glow" />
          </div>
        </div>

        <div className="hero-intelligence-footer">
          <span>Predict</span>
          <span className="hero-footer-arrow">→</span>
          <span>Prepare</span>
          <span className="hero-footer-arrow">→</span>
          <span>Protect</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
