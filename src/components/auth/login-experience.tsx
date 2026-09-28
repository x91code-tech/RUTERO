import type { ReactNode } from "react";

export function LoginExperience({
  children
}: {
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="login-page login-phase-login min-h-screen bg-carbon-950 px-4 py-5 sm:px-6 lg:px-8">
      <div className="login-experience-layout">
        <div className="login-experience-form">
          {children}
        </div>
      </div>
    </main>
  );
}
