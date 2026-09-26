import {
  Bell,
  ChevronRight,
  Menu,
} from "lucide-react";

export default function TopBar({
  setMobileOpen,
}) {
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={22} />
      </button>

      <div className="breadcrumb">
        <span>ResiliCare</span>

        <ChevronRight size={14} />

        <strong>Overview</strong>
      </div>

      <div className="topbar-actions">
        <div className="live-pill">
          <span className="live-dot" />
          Live network
        </div>

        <button className="icon-button">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="user-avatar">
          MF
        </div>
      </div>
    </header>
  );
}