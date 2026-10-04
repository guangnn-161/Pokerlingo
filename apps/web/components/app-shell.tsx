"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navigation = [
  { href: "/", icon: "◈", label: "Training lobby" },
  { href: "/practice/poker", icon: "♠", label: "Poker table" },
  { href: "/practice/gto", icon: "▦", label: "GTO tables" },
  { href: "/practice/blackjack", icon: "♣", label: "Blackjack table" },
  { href: "/practice/counting", icon: "±", label: "Card counting" },
  { href: "/training", icon: "◉", label: "Learning hub" },
  { href: "/learn", icon: "▤", label: "Learning library" },
  { href: "/math", icon: "ƒ", label: "Math lab" },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="Pokerlingo home">
          <span className="brand-mark">♠</span>
          <span>
            pokerlingo<span className="brand-dot">.</span>
          </span>
        </Link>
        <p className="nav-caption">YOUR PRACTICE ROOM</p>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`nav-item ${path === n.href || (n.href === "/training" && path.startsWith("/training")) || (n.href === "/learn" && path.startsWith("/learn/")) || (n.href === "/practice/poker" && (path === "/demo" || path.startsWith("/practice/poker/"))) ? "active" : ""}`}
              aria-current={path === n.href ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="small-orbit">↗</span>
          <strong>Play the decision.</strong>
          <p>
            The result is one hand.
            <br />
            The reasoning is the skill.
          </p>
          <Link href="/learn/expected-value">Understand expected value →</Link>
        </div>
        <div className="sidebar-bottom">
          <span className="avatar">G</span>
          <div>
            <strong>Practice profile</strong>
            <small>Progress on this device</small>
          </div>
          <Link href="/profile" aria-label="Open account profile">
            ↗
          </Link>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="breadcrumb">
            THE LEARNING CLUB <span>/</span>{" "}
            {path.startsWith("/training")
              ? "LEARNING HUB"
              : path.startsWith("/learn")
              ? "LIBRARY"
              : path === "/math"
                ? "MATH LAB"
                : "PRACTICE"}
          </span>
          <div className="topbar-right">
            <span className="practice-badge">
              <i />
              Practice chips only
            </span>
            <Link href="/login">Account ↗</Link>
          </div>
        </header>
        <main id="main-content" className="page-content">
          {children}
        </main>
        <footer className="site-footer">
          <span>
            POKERLINGO <b>♠</b> BETTER DECISIONS, ONE HAND AT A TIME.
          </span>
          <span>Educational simulations · No cash value</span>
        </footer>
      </div>
    </div>
  );
}
