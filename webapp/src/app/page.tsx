import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <>
      {/* Public Header */}
      <header className="public-header">
        <div className="public-header-content">
          <div className="public-header-brand">
            <div className="sidebar-logo">P</div>
            <span>Parametric Cable Engine</span>
          </div>
          <Link href="/login" className="btn btn-primary">Sign In</Link>
        </div>
      </header>

      <main>
        <div className="container">
          {/* Hero */}
          <section className="landing-hero animate-slide-up">
            <h1>Design Compliant Cables<br /><span className="text-gradient">Faster &amp; Accurately</span></h1>
            <p>Automate low and medium-voltage power cable design. Instantly calculate electrical parameters, dimension build-ups, and ensure compliance with IS 7098 and IS 8130 standards.</p>
            <div className="landing-ctas">
              <Link href="/login" className="btn btn-primary btn-lg">Get Started</Link>
              <a href="#features" className="btn btn-outline btn-lg">Learn More</a>
            </div>
          </section>

          {/* Stats */}
          <section className="landing-stats stagger">
            <div className="landing-stat">
              <div className="landing-stat-value text-gradient">38+</div>
              <div className="landing-stat-label">GTP Parameters</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value text-gradient">2</div>
              <div className="landing-stat-label">IS Standards Integrated</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value text-gradient">&lt;5 min</div>
              <div className="landing-stat-label">Per Cable Design</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value text-gradient">±1%</div>
              <div className="landing-stat-label">Calculation Accuracy</div>
            </div>
          </section>

          {/* Features */}
          <section id="features">
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Everything You Need</h2>
              <p style={{ color: "var(--text-secondary)" }}>A complete platform for cable engineering</p>
            </div>
            <div className="landing-features stagger">
              {/* Feature 1: Calculation Engine */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--primary-50)", color: "var(--primary-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <h3>Calculation Engine</h3>
                <p>Auto-compute DC/AC resistance, overall diameter, weight, and short-circuit ratings from IS standards.</p>
              </div>

              {/* Feature 2: Standards Validation */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--emerald-50)", color: "var(--emerald-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                </div>
                <h3>Standards Validation</h3>
                <p>Built-in IS 7098 and IS 8130 compliance checks catch insulation and dimension violations instantly.</p>
              </div>

              {/* Feature 3: GTP Sheet Export */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--amber-50)", color: "var(--amber-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                </div>
                <h3>GTP Sheet Export</h3>
                <p>Generate beautiful, standardized GTP datasheets as PDF or Excel — matching your exact company template.</p>
              </div>

              {/* Feature 4: Live Design Workbench */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--violet-50)", color: "var(--violet-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <h3>Live Design Workbench</h3>
                <p>Tweak design inputs and see the full GTP sheet update in real-time with live standards lookups.</p>
              </div>

              {/* Feature 5: Role-Based Access */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--red-50)", color: "var(--red-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3>Role-Based Access</h3>
                <p>Six distinct roles with granular permissions — Engineer, Sales, Costing, Approver, Management, Admin.</p>
              </div>

              {/* Feature 6: Full Audit Trail */}
              <div className="feature-card">
                <div className="feature-icon" style={{ background: "var(--primary-50)", color: "var(--primary-600)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3>Full Audit Trail</h3>
                <p>Every design change, override, and approval is logged with full traceability for regulatory compliance.</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <div style={{ textAlign: "center", marginBottom: "1rem", marginTop: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>How It Works</h2>
              <p style={{ color: "var(--text-secondary)" }}>Three simple steps to a compliant cable design</p>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-number">1</div>
                <h3>Configure Parameters</h3>
                <p>Select conductor material, size, cores, insulation, and armour type from the design workbench.</p>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <h3>Auto-Calculate</h3>
                <p>The engine fetches IS standard dimensions and computes all derived parameters in real-time.</p>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <h3>Export &amp; Approve</h3>
                <p>Generate the GTP sheet, submit for approval, and export as PDF or Excel for your clients.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="landing-cta-section">
            <h2>Ready to Streamline Your Cable Design?</h2>
            <p>Join your engineering team on the Parametric Cable Engine platform and start generating compliant GTP sheets in minutes.</p>
            <Link href="/login" className="btn btn-lg" style={{ background: "white", color: "var(--primary-700)", fontWeight: 700 }}>Sign In to Your Account</Link>
          </section>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="container">
            <p>© 2026 Parametric Cable Engine · Built for Open Network Solutions</p>
          </div>
        </footer>
      </main>
    </>
  );
}
