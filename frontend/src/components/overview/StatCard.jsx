import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  tone = "neutral",
  trend,
}) {
  return (
    <motion.div
      className={`stat-card stat-${tone}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="stat-top">
        <div className="stat-icon">
          <Icon size={20} />
        </div>

        {trend && (
          <div className="stat-trend">
            {trend.direction === "up" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {trend.text}
          </div>
        )}
      </div>

      <div className="stat-value">
        <AnimatedNumber value={value} decimals={suffix === "%" ? 1 : 0} />
        {suffix && <small>{suffix}</small>}
      </div>

      <div className="stat-label">{label}</div>
      <div className="stat-description">{description}</div>
    </motion.div>
  );
}

export default StatCard;