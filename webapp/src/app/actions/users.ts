"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["ADMIN"];
const VALID_ROLES = ["ENGINEER", "SALES", "COSTING", "APPROVER", "MANAGEMENT", "ADMIN"];

/** Update own profile name. */
export async function updateProfile(name: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = (session.user as { id: string }).id;
  
  if (!name || name.trim().length < 2) return { success: false, error: "Name must be at least 2 characters" };
  
  await prisma.user.update({ where: { id: userId }, data: { name: name.trim() } });
  revalidatePath("/dashboard/profile");
  return { success: true };
}

/** Change own password. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Unauthorized" };
  const userId = (session.user as { id: string }).id;
  
  if (!newPassword || newPassword.length < 6) return { success: false, error: "Password must be at least 6 characters" };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) return { success: false, error: "User not found" };
  
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return { success: false, error: "Current password is incorrect" };
  
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return { success: true };
}

/** Admin: list all users. */
export async function listUsers() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ADMIN_ROLES.includes(role || "")) return { success: false, error: "Unauthorized", users: [] };
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      createdAt: true, lastLoginAt: true, department: true,
      _count: { select: { cablesCreated: true, cablesApproved: true } }
    }
  });
  return { success: true, users };
}

/** Admin: create a new user. */
export async function createUser(data: { name: string; email: string; role: string; password?: string }) {
  const session = await getServerSession(authOptions);
  const sRole = (session?.user as { role?: string })?.role;
  if (!session?.user || !ADMIN_ROLES.includes(sRole || "")) return { success: false, error: "Unauthorized" };
  
  if (!data.name || !data.email || !data.role) return { success: false, error: "Name, email, and role are required" };
  if (!VALID_ROLES.includes(data.role)) return { success: false, error: "Invalid role" };
  
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { success: false, error: "Email already exists" };
  
  const password = data.password || "changeme123";
  const hashed = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, role: data.role, password: hashed }
  });
  
  await prisma.auditLog.create({
    data: { userId: (session.user as { id: string }).id, entity: "User", entityId: user.id, action: "CREATE" }
  });
  
  revalidatePath("/dashboard/users");
  return { success: true, tempPassword: password };
}

/** Admin: update user role. */
export async function updateUserRole(userId: string, newRole: string) {
  const session = await getServerSession(authOptions);
  const sRole = (session?.user as { role?: string })?.role;
  if (!session?.user || !ADMIN_ROLES.includes(sRole || "")) return { success: false, error: "Unauthorized" };
  if (!VALID_ROLES.includes(newRole)) return { success: false, error: "Invalid role" };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };
  
  const oldRole = user.role;
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  
  await prisma.auditLog.create({
    data: { userId: (session.user as { id: string }).id, entity: "User", entityId: userId, action: "UPDATE", field: "role", oldValue: oldRole, newValue: newRole }
  });
  
  revalidatePath("/dashboard/users");
  return { success: true };
}

/** Admin: toggle user active status. */
export async function toggleUserActive(userId: string) {
  const session = await getServerSession(authOptions);
  const sRole = (session?.user as { role?: string })?.role;
  if (!session?.user || !ADMIN_ROLES.includes(sRole || "")) return { success: false, error: "Unauthorized" };
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };
  
  // Prevent self-deactivation
  if (userId === (session.user as { id: string }).id) return { success: false, error: "Cannot deactivate yourself" };
  
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  
  await prisma.auditLog.create({
    data: { userId: (session.user as { id: string }).id, entity: "User", entityId: userId, action: "UPDATE", field: "isActive", oldValue: String(user.isActive), newValue: String(!user.isActive) }
  });
  
  revalidatePath("/dashboard/users");
  return { success: true };
}
