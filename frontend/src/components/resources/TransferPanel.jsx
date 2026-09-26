import { ArrowUpRight, Truck } from "lucide-react";
import { motion } from "framer-motion";

function TransferPanel({ transfers = [], loading = false }) {
  return (
    <section className="transfer-section">
      <div className="section-heading-row">
        <div>
          <span className="section-eyebrow">
            RESOURCE OPTIMIZATION
          </span>

          <h2>Recommended interventions</h2>
        </div>

        <div className="transfer-count">
          <Truck size={15} />
          {transfers.length} recommendations
        </div>
      </div>

      <div className="transfer-card">
        {loading ? (
          <div
            style={{
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            Calculating optimal resource transfers...
          </div>
        ) : transfers.length === 0 ? (
          <div
            style={{
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              opacity: 0.6,
              padding: "30px",
            }}
          >
            <div>
              <Truck
                size={24}
                style={{
                  margin: "0 auto 12px",
                  opacity: 0.5,
                }}
              />

              <strong
                style={{
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                No interventions calculated yet
              </strong>

              <span>
                Run a crisis simulation to calculate
                optimal resource redistribution.
              </span>
            </div>
          </div>
        ) : (
          transfers.map((transfer, index) => (
            <motion.div
              key={`${transfer.sourceCode}-${transfer.destinationCode}-${transfer.medicine}-${index}`}
              className="transfer-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.06,
              }}
            >
              <div className="transfer-index">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="transfer-location">
                <strong>
                  {transfer.sourceName}
                </strong>

                <span>
                  {transfer.sourceCode}
                </span>
              </div>

              <div className="transfer-arrow">
                <Truck size={15} />
              </div>

              <div className="transfer-location">
                <strong>
                  {transfer.destinationName}
                </strong>

                <span>
                  {transfer.destinationCode}
                </span>
              </div>

              <div className="transfer-medicine">
                <span>MEDICINE</span>
                <strong>
                  {transfer.medicine}
                </strong>
              </div>

              <div className="transfer-quantity">
                <span>TRANSFER</span>
                <strong>
                  {Number(
                    transfer.quantity || 0
                  ).toFixed(
                    Number.isInteger(
                      Number(transfer.quantity || 0)
                    )
                      ? 0
                      : 1
                  )}{" "}
                  units
                </strong>
              </div>

              <div className="transfer-distance">
                <span>DISTANCE</span>
                <strong>
                  {Number(
                    transfer.distanceKm || 0
                  ).toFixed(2)}{" "}
                  km
                </strong>
              </div>

              <button className="transfer-action">
                <ArrowUpRight size={15} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}

export default TransferPanel;