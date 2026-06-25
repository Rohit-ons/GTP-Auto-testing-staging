import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user?.name || "User",
    email: session.user?.email || "",
    role: (session.user as { role?: string })?.role || "ENGINEER",
  };

  return (
    <SessionProviderWrapper>
      <AppShell user={user}>{children}</AppShell>
    </SessionProviderWrapper>
  );
}
