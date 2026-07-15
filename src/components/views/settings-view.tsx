"use client";

import { useEffect, useState } from "react";
import {
  clearGeminiKey,
  getStoredGeminiKey,
  saveGeminiKey,
} from "@/lib/gemini";
import { useApp } from "@/context/app-context";
import { Button, Card, Input, Label, ViewHeader } from "../ui";

export function SettingsView() {
  const {
    state,
    mutateSimulation,
    pushToast,
    staffCredentials,
    changeOrganizerPassword,
    addStaffCredential,
    updateStaffCredential,
    deleteStaffCredential,
  } = useApp();
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);

  // Organizer settings state
  const [newOrgPass, setNewOrgPass] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editingStaffPass, setEditingStaffPass] = useState("");

  useEffect(() => {
    const stored = getStoredGeminiKey();
    setHasKey(Boolean(stored));
    if (stored) setKey("••••••••••••••••••••");
  }, []);

  const save = () => {
    try {
      if (key.includes("•")) {
        pushToast("API key", "Enter a new key to replace the stored one.", "info");
        return;
      }
      saveGeminiKey(key);
      setHasKey(true);
      setKey("••••••••••••••••••••");
      pushToast("API key saved", "Gemini is ready. Keys stay in this browser only.", "success");
    } catch (e) {
      pushToast("Invalid key", e instanceof Error ? e.message : "Try again", "danger");
    }
  };

  const clear = () => {
    clearGeminiKey();
    setHasKey(false);
    setKey("");
    pushToast("API key cleared", "Local fallback engine is active.", "info");
  };

  const handleUpdateOrgPass = () => {
    if (!newOrgPass) {
      pushToast("Validation Error", "Password cannot be empty", "warning");
      return;
    }
    changeOrganizerPassword(newOrgPass);
    setNewOrgPass("");
  };

  const handleAddStaff = () => {
    if (!newStaffId.trim() || !newStaffPass) {
      pushToast("Validation Error", "ID and Password cannot be empty", "warning");
      return;
    }
    const success = addStaffCredential(newStaffId, newStaffPass);
    if (success) {
      setNewStaffId("");
      setNewStaffPass("");
    }
  };

  const handleSaveStaffPass = (id: string) => {
    if (!editingStaffPass) {
      pushToast("Validation Error", "Password cannot be empty", "warning");
      return;
    }
    const success = updateStaffCredential(id, editingStaffPass);
    if (success) {
      setEditingStaffId(null);
      setEditingStaffPass("");
    }
  };

  return (
    <div>
      <ViewHeader title="Settings" subtitle="API keys and simulation controls" />

      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <h2 className="mb-1 font-serif text-xl text-claude-ink">Gemini API</h2>
          <p className="mb-4 text-xs text-claude-ink-secondary">
            Stored in localStorage only. Without a key, the local rules engine answers.
          </p>
          <Label htmlFor="gemini">API key</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="gemini"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Stored locally in this browser"
              className="flex-1"
              autoComplete="off"
            />
            <Button onClick={save}>Save</Button>
            <Button variant="ghost" onClick={clear}>
              Clear
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-claude-ink-secondary">
            <span
              className={`h-2 w-2 rounded-full ${hasKey ? "bg-claude-success" : "bg-claude-warning"}`}
            />
            {hasKey ? "Gemini key configured." : "Local fallback engine active."}
          </div>
        </Card>

        <Card delay={0.08}>
          <h2 className="mb-4 font-serif text-xl text-claude-ink">Simulation controls</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="ghost" onClick={() => mutateSimulation("surge")}>
              Crowd surge
            </Button>
            <Button variant="ghost" onClick={() => mutateSimulation("gate-delay")}>
              Gate delay
            </Button>
            <Button variant="soft" onClick={() => mutateSimulation("clear")}>
              Clear state
            </Button>
          </div>
        </Card>

        {state.role === "organizer" && (
          <>
            <Card delay={0.16}>
              <h2 className="mb-1 font-serif text-xl text-claude-ink">Change Organizer Password</h2>
              <p className="mb-4 text-xs text-claude-ink-secondary">
                Update the Event Organizer credentials.
              </p>
              <div className="space-y-3 max-w-md">
                <div>
                  <Label htmlFor="new-org-pass">New Admin Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-org-pass"
                      type="password"
                      placeholder="Enter new password"
                      value={newOrgPass}
                      onChange={(e) => setNewOrgPass(e.target.value)}
                    />
                    <Button onClick={handleUpdateOrgPass}>Update</Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card delay={0.24}>
              <h2 className="mb-1 font-serif text-xl text-claude-ink">Staff Credentials Management</h2>
              <p className="mb-4 text-xs text-claude-ink-secondary">
                Register, update, or remove credentials for stadium staff members.
              </p>

              {/* Add Staff Form */}
              <div className="mb-6 rounded-xl border border-claude-border bg-claude-surface/30 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                  Add New Staff Member
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="new-staff-id">Staff ID</Label>
                    <Input
                      id="new-staff-id"
                      type="text"
                      placeholder="e.g. STAFF-002"
                      value={newStaffId}
                      onChange={(e) => setNewStaffId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-staff-pass">Password</Label>
                    <Input
                      id="new-staff-pass"
                      type="password"
                      placeholder="••••••••"
                      value={newStaffPass}
                      onChange={(e) => setNewStaffPass(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddStaff} className="w-full">
                      Add Staff
                    </Button>
                  </div>
                </div>
              </div>

              {/* Staff List */}
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                Active Staff Accounts ({staffCredentials.length})
              </h3>
              {staffCredentials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-claude-border py-6 text-center text-xs text-claude-ink-muted">
                  No staff accounts registered.
                </div>
              ) : (
                <div className="divide-y divide-claude-border overflow-hidden rounded-xl border border-claude-border bg-white">
                  {staffCredentials.map((staff) => {
                    const isEditing = editingStaffId === staff.id;
                    return (
                      <div
                        key={staff.id}
                        className="flex flex-wrap items-center justify-between gap-4 p-3.5 hover:bg-claude-surface/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-claude-accent-soft font-semibold text-claude-accent text-xs">
                            ID
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-claude-ink">{staff.id}</div>
                            <div className="text-[10px] text-claude-ink-muted">
                              Password: {isEditing ? "Editing..." : "••••••••"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Input
                                type="password"
                                placeholder="New Password"
                                value={editingStaffPass}
                                onChange={(e) => setEditingStaffPass(e.target.value)}
                                className="h-8 w-36 px-2 text-xs"
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveStaffPass(staff.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingStaffId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingStaffId(staff.id);
                                  setEditingStaffPass("");
                                }}
                              >
                                Edit Pass
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => deleteStaffCredential(staff.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
