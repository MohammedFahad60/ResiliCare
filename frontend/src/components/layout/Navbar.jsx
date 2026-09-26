import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X, Settings, ShieldCheck } from "lucide-react";

import { navItems } from "../../constants/navigation";

export default function Navbar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 20);
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [active, setMobileOpen]);

  return (
    <header>
      <nav
        data-state={mobileOpen ? "active" : undefined}
        className="group fixed z-50 w-full pt-2"
      >
        <div
          className={[
            "mx-auto max-w-7xl rounded-3xl px-6",
            "transition-all duration-300 lg:px-12",
            scrolled
              ? "bg-[#071014]/70 backdrop-blur-2xl border border-white/10"
              : "",
          ].join(" ")}
        >
          <motion.div
            animate={{
              paddingTop: scrolled ? 16 : 24,
              paddingBottom: scrolled ? 16 : 24,
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0"
          >
            {/* =====================================================
                BRAND
            ====================================================== */}

            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <button
                type="button"
                aria-label="Go to Overview"
                onClick={() => setActive("Overview")}
                className="flex items-center gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <ShieldCheck
                    size={20}
                    strokeWidth={2}
                  />
                </div>

                <div className="flex flex-col items-start">
                  <span className="text-[15px] font-semibold tracking-tight text-white">
                    ResiliCare
                  </span>

                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/40">
                    Predict. Prepare. Protect.
                  </span>
                </div>
              </button>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={
                  mobileOpen
                    ? "Close Menu"
                    : "Open Menu"
                }
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  className={[
                    "m-auto h-6 w-6 transition-all duration-200",
                    mobileOpen
                      ? "scale-0 rotate-180 opacity-0"
                      : "scale-100 rotate-0 opacity-100",
                  ].join(" ")}
                />

                <X
                  className={[
                    "absolute inset-0 m-auto h-6 w-6 transition-all duration-200",
                    mobileOpen
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 -rotate-180 opacity-0",
                  ].join(" ")}
                />
              </button>

              {/* Desktop navigation */}
              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {navItems.map((item) => {
                    const selected =
                      active === item.label;

                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() =>
                            setActive(item.label)
                          }
                          className={[
                            "relative block py-2",
                            "transition-colors duration-150",
                            selected
                              ? "text-white"
                              : "text-white/45 hover:text-white",
                          ].join(" ")}
                        >
                          <span>
                            {item.label}
                          </span>

                          {selected && (
                            <motion.span
                              layoutId="resilicare-nav-active"
                              className="absolute -bottom-1 left-0 right-0 h-px rounded-full bg-cyan-300"
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              }}
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* =====================================================
                RIGHT SIDE
            ====================================================== */}

            <div
              className={[
                "bg-[#071014]",
                "group-data-[state=active]:block",
                "lg:group-data-[state=active]:flex",
                "mb-6 hidden w-full flex-wrap",
                "items-center justify-end",
                "space-y-8 rounded-3xl border",
                "border-white/10 p-6 shadow-2xl",
                "md:flex-nowrap",
                "lg:m-0 lg:flex lg:w-fit",
                "lg:gap-4 lg:space-y-0",
                "lg:border-transparent",
                "lg:bg-transparent lg:p-0",
                "lg:shadow-none",
                "dark:lg:bg-transparent",
              ].join(" ")}
            >
              {/* Mobile navigation */}
              <div className="w-full lg:hidden">
                <ul className="space-y-5 text-base">
                  {navItems.map((item) => {
                    const selected =
                      active === item.label;

                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => {
                            setActive(item.label);
                            setMobileOpen(false);
                          }}
                          className={[
                            "block w-full text-left",
                            "transition-colors duration-150",
                            selected
                              ? "text-white"
                              : "text-white/50 hover:text-white",
                          ].join(" ")}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* System status */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0 md:w-fit">
                <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                  <span>
                    Systems operational
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="System settings"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* =========================================================
          MOBILE MENU ANIMATION
      ========================================================== */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-x-3 top-24 z-40 lg:hidden"
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            transition={{
              duration: 0.2,
            }}
          />
        )}
      </AnimatePresence>
    </header>
  );
}