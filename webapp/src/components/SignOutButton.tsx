"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button 
      onClick={() => signOut()} 
      className="btn btn-outline"
      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
    >
      Sign Out
    </button>
  );
}
