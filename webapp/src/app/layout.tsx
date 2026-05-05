import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import SignOutButton from "@/components/SignOutButton"; // I will create this

export const metadata: Metadata = {
  title: "Parametric Cable Model Generator",
  description: "Automate low/medium-voltage power cable design.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <header className="header glass">
          <div className="container header-content">
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              <span className="text-gradient">Parametric</span> Cable Engine
            </h1>
            <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {session?.user ? (
                <>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Hi, {session.user.name}
                  </span>
                  <SignOutButton />
                </>
              ) : (
                <Link href="/login" className="btn btn-outline">Sign In</Link>
              )}
            </nav>
          </div>
        </header>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
