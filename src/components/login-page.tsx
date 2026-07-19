/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input, Label } from "./ui";
import type { Role } from "@/lib/types";

export function LoginPage({ isInitialized }: { isInitialized: boolean }) {
  const { login, pushToast } = useApp();
  const [activeTab, setActiveTab] = useState<Role>("fan");

  // Form states
  const [ticketNo, setTicketNo] = useState("");
  const [volunteerName, setVolunteerName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [orgUsername, setOrgUsername] = useState("");
  const [orgPassword, setOrgPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isInitialized) return;
    let success = false;

    if (activeTab === "fan") {
      success = login("fan", { ticketNo });
    } else if (activeTab === "volunteer") {
      success = login("volunteer", { id: volunteerName });
    } else if (activeTab === "staff") {
      success = login("staff", { id: staffId, password: staffPassword });
    } else if (activeTab === "organizer") {
      success = login("organizer", {
        id: orgId,
        username: orgUsername,
        password: orgPassword,
      });
    }

    if (!success) {
      pushToast(
        "Login Failed",
        "Invalid credentials. Please use the quick-fill helper below for testing.",
        "danger"
      );
    }
  };

  const handleQuickFill = (role: Role) => {
    // Demo-only: pre-fill placeholder credentials so reviewers/contributors can
    // test the app without first seeding the local DB. These are NOT production
    // secrets — all auth state lives in localStorage and is reset on logout.
    setActiveTab(role);
    if (role === "fan") {
      setTicketNo("TICKET-METLIFE");
    } else if (role === "volunteer") {
      setVolunteerName("Emma Watson");
    } else if (role === "staff") {
      setStaffId("STAFF-001");
      setStaffPassword("staffpass123");
    } else if (role === "organizer") {
      setOrgId("ORG-001");
      setOrgUsername("admin");
      setOrgPassword("adminpass123");
    }
    pushToast(
      "Credentials Filled",
      `${role[0].toUpperCase() + role.slice(1)} testing credentials filled. Click sign in!`,
      "info"
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-claude-bg px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic blurred background shapes */}
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-claude-accent/10 blur-[120px]" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-claude-info/10 blur-[150px]" />
      <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-claude-success/5 blur-[100px]" />

      <div className="relative w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-claude-surface shadow-soft">
            <img src="/logo.png" alt="FIFA 26 Logo" className="h-full w-full object-contain p-1" />
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-claude-ink sm:text-4xl">
            FIFA World Cup 2026™
          </h1>
          <p className="mt-2 text-sm text-claude-ink-secondary">
            Smart Stadium Operations & Fan Portal
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="border border-claude-border/80 bg-white/70 shadow-lift backdrop-blur-xl">
          {/* Custom Tabs */}
          <div className="mb-6 flex rounded-xl bg-claude-surface p-1">
            {(["fan", "volunteer", "staff", "organizer"] as Role[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className="relative flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 focus:outline-none"
                >
                  {active && (
                    <motion.div
                      layoutId="active-login-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-soft"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 block transition-colors duration-300 ${
                      active ? "text-claude-accent" : "text-claude-ink-muted hover:text-claude-ink"
                    }`}
                  >
                    {tab === "organizer" ? "Organizer" : tab}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === "fan" && (
                <motion.div
                  key="fan"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="ticketNo">Ticket Number</Label>
                    <Input
                      id="ticketNo"
                      type="text"
                      required
                      placeholder="e.g. TICKET-XXXXX"
                      value={ticketNo}
                      onChange={(e) => setTicketNo(e.target.value)}
                      className="bg-white/80"
                    />
                    <p className="mt-1 text-[11px] text-claude-ink-muted">
                      Your match ticket ID validates your access.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "volunteer" && (
                <motion.div
                  key="volunteer"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="volunteerName">Volunteer Full Name</Label>
                    <Input
                      id="volunteerName"
                      type="text"
                      required
                      placeholder="e.g. Emma Watson"
                      value={volunteerName}
                      onChange={(e) => setVolunteerName(e.target.value)}
                      className="bg-white/80"
                    />
                    <p className="mt-1 text-[11px] text-claude-ink-muted">
                      Enter your full name to see your stadium dispatch assignments and directions.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "staff" && (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="staffId">Staff Identification ID</Label>
                    <Input
                      id="staffId"
                      type="text"
                      required
                      placeholder="e.g. STAFF-XXX"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="staffPassword">Password</Label>
                    <Input
                      id="staffPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="bg-white/80"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === "organizer" && (
                <motion.div
                  key="organizer"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="orgId">Organizer ID</Label>
                    <Input
                      id="orgId"
                      type="text"
                      required
                      placeholder="e.g. ORG-XXX"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgUsername">Admin Username</Label>
                    <Input
                      id="orgUsername"
                      type="text"
                      required
                      placeholder="e.g. admin"
                      value={orgUsername}
                      onChange={(e) => setOrgUsername(e.target.value)}
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgPassword">Password</Label>
                    <Input
                      id="orgPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={orgPassword}
                      onChange={(e) => setOrgPassword(e.target.value)}
                      className="bg-white/80"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full justify-center" disabled={!isInitialized}>
              {isInitialized ? "Sign In to System" : "Preparing secure sign-in…"}
            </Button>
          </form>
        </Card>

        {/* Demo Helper Widget */}
        <Card className="border border-claude-border/50 bg-claude-surface/30 p-4 shadow-sm backdrop-blur-md">
          <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
            Testing Credentials (Quick-Fill)
          </div>
          <p className="mb-3 text-center text-[11px] text-claude-ink-muted">
            Click a button below to load keys. Fan tickets map directly to real stadiums:
            <br />
            <span className="font-semibold text-claude-accent font-serif">TICKET-METLIFE</span> (MetLife) · <span className="font-semibold text-claude-accent font-serif">TICKET-SOFI</span> (SoFi) · <span className="font-semibold text-claude-accent font-serif">TICKET-AZTECA</span> (Azteca)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickFill("fan")}
              className="text-[10px] px-1 hover:bg-white"
            >
              Fan
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickFill("volunteer")}
              className="text-[10px] px-1 hover:bg-white"
            >
              Volunteer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickFill("staff")}
              className="text-[10px] px-1 hover:bg-white"
            >
              Staff
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickFill("organizer")}
              className="text-[10px] px-1 hover:bg-white"
            >
              Organizer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
