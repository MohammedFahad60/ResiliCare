import { AnimatePresence, motion } from "framer-motion";

import {
  ShieldCheck,
  X,
  SlidersHorizontal,
} from "lucide-react";

import { navItems } from "../../constants/navigation";

export default function Sidebar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck
              size={24}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <div className="brand-name">
              ResiliCare
            </div>

            <div className="brand-subtitle">
              Healthcare resilience
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">
          COMMAND CENTER
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected =
              active === item.label;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  selected ? "nav-active" : ""
                }`}
                onClick={() => {
                  setActive(item.label);
                  setMobileOpen(false);
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={1.9}
                />

                <span>{item.label}</span>

                {selected && (
                  <span className="nav-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <div className="system-status">
              <span className="status-dot" />
              Systems operational
            </div>

            <div className="system-text">
              Data refreshed 2 min ago
            </div>

            <div className="system-line">
              <span />
            </div>

            <div className="system-meta">
              <span>100 facilities</span>
              <span>1,000 nodes</span>
            </div>
          </div>

          <button className="settings-button">
            <SlidersHorizontal size={18} />
            <span>System settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}