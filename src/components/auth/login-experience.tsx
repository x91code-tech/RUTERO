"use client";

import { useEffect, useState, type ReactNode } from "react";

type LoginPhase = "loading" | "welcome" | "closing" | "login";

export function LoginExperience({
  intro,
  children
}: {
  intro: ReactNode;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<LoginPhase>("loading");
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const welcomeTimer = window.setTimeout(() => setPhase("welcome"), reduceMotion ? 100 : 1_000);
    const splashTimer = window.setTimeout(
      () => setSplashVisible(false),
      reduceMotion ? 180 : 1_450
    );
    const closingTimer = window.setTimeout(
      () => setPhase("closing"),
      reduceMotion ? 950 : 3_500
    );
    const loginTimer = window.setTimeout(
      () => setPhase("login"),
      reduceMotion ? 1_100 : 4_150
    );

    return () => {
      window.clearTimeout(welcomeTimer);
      window.clearTimeout(splashTimer);
      window.clearTimeout(closingTimer);
      window.clearTimeout(loginTimer);
    };
  }, []);

  return (
    <main className={`login-page login-phase-${phase} min-h-screen bg-carbon-950 px-4 py-5 sm:px-6 lg:px-8`}>
      <div className="login-experience-layout">
        {phase === "welcome" ? intro : null}
        {phase === "closing" ? <div className="login-intro-exit">{intro}</div> : null}
        <div className="login-experience-form" inert={phase === "loading" || splashVisible}>
          {children}
        </div>
      </div>
      {splashVisible ? (
        <div
          className="login-splash"
          role="status"
          aria-label="Preparando RUTERO"
          aria-hidden={phase !== "loading"}
        >
          <div className="login-splash-content">
            <div className="login-splash-mark">
              <span className="login-splash-orbit" />
              <span className="login-splash-orbit login-splash-orbit-inner" />
              <span className="login-splash-letter">R</span>
            </div>
            <p className="login-splash-brand">RUTERO</p>
            <p className="login-splash-message">Cada paso cuenta.</p>
            <svg className="login-splash-route" viewBox="0 0 240 34" fill="none" aria-hidden="true">
              <path d="M5 17H235" />
              <circle cx="6" cy="17" r="3" />
              <circle cx="234" cy="17" r="3" />
            </svg>
            <div className="login-splash-progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
