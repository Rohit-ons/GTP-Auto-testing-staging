import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');
  
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="sidebar-logo" style={{ width: 48, height: 48, fontSize: '1.25rem' }}>P</div>
          <h1>Parametric Cable Engine</h1>
          <p>Sign in to your account to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
