import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  
  const userId = (session.user as { id: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      lastLoginAt: true, department: true, phone: true,
      _count: { select: { cablesCreated: true, cablesApproved: true } }
    }
  });
  
  if (!user) redirect("/login");
  
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-header-title">My Profile</h1>
          <p className="page-header-subtitle">Manage your account settings</p>
        </div>
      </div>
      <ProfileClient user={{
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      }} />
    </div>
  );
}
