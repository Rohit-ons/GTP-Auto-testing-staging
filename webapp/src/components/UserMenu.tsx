"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  ENGINEER: "Engineer",
  SALES: "Sales",
  COSTING: "Costing",
  APPROVER: "Approver",
  MANAGEMENT: "Management",
};

interface UserMenuProps {
  user: { name: string; email: string; role: string };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button
        className="user-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="avatar avatar-md avatar-blue">{initials}</div>
        <div className="user-dropdown-info">
          <div className="user-dropdown-name">{user.name}</div>
          <div className="user-dropdown-role">{roleLabel}</div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--text-muted)", flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div style={{ padding: "0.5rem 0.75rem" }}>
            <div className="user-dropdown-name">{user.name}</div>
            <div className="user-dropdown-role">{roleLabel}</div>
          </div>

          <div className="user-dropdown-separator" />

          <Link
            href="/dashboard/profile"
            className="user-dropdown-item"
            onClick={() => setIsOpen(false)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Profile
          </Link>

          <div className="user-dropdown-separator" />

          <button
            className="user-dropdown-item"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
