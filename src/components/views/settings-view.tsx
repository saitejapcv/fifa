"use client";

import { useEffect, useState } from "react";
import {
  clearGeminiKey,
  getStoredGeminiKey,
  saveGeminiKey,
  parseRosterData,
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
    stadiums,
    tickets,
    addTicket,
    deleteTicket,
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

    const [games, setGames] = useState<any[]>([]);

    // Ticket states
    const [ticketNo, setTicketNo] = useState("");
    const [selStadium, setSelStadium] = useState("");
    const [selMatch, setSelMatch] = useState("");
    const [selSection, setSelSection] = useState("101");
    const [seatNo, setSeatNo] = useState("Row A, Seat 1");
    const [selGate, setSelGate] = useState("A");
    const [selBatch, setSelBatch] = useState(1);
    const [ticketStaff, setTicketStaff] = useState("");
    const [ticketVols, setTicketVols] = useState("");
    const [isParsing, setIsParsing] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        setIsParsing(true);
        pushToast("GenAI Processing", "Analyzing roster file structure...", "info");
        try {
          const parsed = await parseRosterData(text, stadiums, games);
          let ticketsAddedCount = 0;
          let staffAddedCount = 0;

          if (parsed.tickets && parsed.tickets.length > 0) {
            parsed.tickets.forEach((t) => {
              const success = addTicket({
                ticketNo: String(t.ticketNo || "").toUpperCase(),
                matchId: String(t.matchId || "1"),
                stadiumId: String(t.stadiumId || "11"),
                section: String(t.section || "104"),
                seatNo: String(t.seatNo || "Row G, Seat 8"),
                assignedGate: String(t.assignedGate || "A"),
                batch: Number(t.batch) || 1,
                date: String(t.date || "06/15/2026"),
                matchLabel: String(t.matchLabel || "Tournament Game"),
                staff: Array.isArray(t.staff) ? t.staff.map(String) : [],
                volunteers: Array.isArray(t.volunteers) ? t.volunteers.map(String) : [],
              });
              if (success) ticketsAddedCount++;
            });
          }

          if (parsed.staff && parsed.staff.length > 0) {
            parsed.staff.forEach((s) => {
              const success = addStaffCredential(String(s.id || ""), String(s.password || "staffpass123"));
              if (success) staffAddedCount++;
            });
          }

          if (ticketsAddedCount > 0 || staffAddedCount > 0) {
            pushToast(
              "Bulk Import Successful",
              `Parsed & added ${ticketsAddedCount} tickets and ${staffAddedCount} staff accounts.`,
              "success"
            );
          } else {
            pushToast(
              "Import Finished",
              "No new unique tickets or staff members were found in the file.",
              "warning"
            );
          }
        } catch (error) {
          console.error(error);
          pushToast("Parser Error", "Failed to parse roster file.", "danger");
        } finally {
          setIsParsing(false);
          e.target.value = "";
        }
      };
      reader.readAsText(file);
    };

    // Load matches from API proxy
    useEffect(() => {
      async function fetchGames() {
        try {
          const res = await fetch("/api/worldcup?endpoint=games");
          if (res.ok) {
            const data = await res.json();
            setGames(data.games || []);
          }
        } catch (e) {
          console.error("Failed to load games in SettingsView:", e);
        }
      }
      fetchGames();
    }, []);

    // Set form defaults when games/stadiums load
    useEffect(() => {
      if (stadiums.length > 0 && !selStadium) {
        setSelStadium(stadiums[0].id);
      }
    }, [stadiums, selStadium]);

    useEffect(() => {
      if (games.length > 0 && !selMatch) {
        setSelMatch(games[0].id);
      }
    }, [games, selMatch]);

    const handleRegisterTicket = () => {
      if (!ticketNo.trim()) {
        pushToast("Validation Error", "Ticket number cannot be empty", "warning");
        return;
      }

      const matchObj = games.find((g) => g.id === selMatch);
      const matchLabel = matchObj
        ? `${matchObj.home_team_name_en} vs. ${matchObj.away_team_name_en}`
        : "Tournament Match";
      const matchDate = matchObj ? matchObj.local_date.split(" ")[0] : "06/15/2026";

      const newTicket = {
        ticketNo: ticketNo.trim().toUpperCase(),
        matchId: selMatch,
        stadiumId: selStadium,
        section: selSection,
        seatNo: seatNo.trim(),
        assignedGate: selGate,
        batch: selBatch,
        date: matchDate,
        matchLabel,
        staff: ticketStaff.split(",").map((s) => s.trim()).filter(Boolean),
        volunteers: ticketVols.split(",").map((v) => v.trim()).filter(Boolean),
      };

      const success = addTicket(newTicket);
      if (success) {
        setTicketNo("");
        setTicketStaff("");
        setTicketVols("");
      }
    };

    return (
      <div>
        <ViewHeader title="Settings" subtitle="API keys and simulation controls" />

        <div className="mx-auto max-w-4xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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

            <Card>
              <h2 className="mb-4 font-serif text-xl text-claude-ink">Simulation controls</h2>
              <p className="mb-4 text-xs text-claude-ink-secondary">
                Simulate crowds, gate delays, or clear sensors.
              </p>
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
          </div>

          {state.role === "organizer" && (
            <>
              {/* Ticket Gating and allocation Console */}
              <Card>
                <h2 className="mb-1 font-serif text-xl text-claude-ink">Ticket & Stadium Allocation Console</h2>
                <p className="mb-4 text-xs text-claude-ink-secondary">
                  Register match ticket entries, map them to host venues, and allocate operations staff and guest volunteers.
                </p>

                {/* GenAI Bulk File Upload Dropzone */}
                <div className="mb-6 rounded-xl border-2 border-dashed border-claude-accent/30 bg-claude-accent-soft/5 hover:bg-claude-accent-soft/10 transition p-6 text-center relative">
                  <input
                    type="file"
                    id="bulk-roster-upload"
                    accept=".csv,.json,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isParsing}
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-2xl">✨</span>
                    <span className="text-sm font-semibold text-claude-ink">
                      {isParsing ? "GenAI is parsing your file..." : "GenAI Bulk Roster Upload"}
                    </span>
                    <span className="text-xs text-claude-ink-secondary max-w-md mx-auto">
                      Drag & drop or click to upload any CSV, JSON, or text file. The GenAI will analyze the file structure, extract tickets, staff IDs, and volunteers, and store them directly in the database.
                    </span>
                    {isParsing && (
                      <div className="h-1 w-32 bg-claude-border rounded-full overflow-hidden mt-3 mx-auto">
                        <div className="h-full bg-claude-accent animate-pulse w-full" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration Form */}
                <div className="mb-6 rounded-xl border border-claude-border bg-claude-surface/30 p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                    Register New Ticket & Route
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-3 mb-3">
                    <div>
                      <Label htmlFor="ticket-no">Ticket ID</Label>
                      <Input
                        id="ticket-no"
                        type="text"
                        placeholder="e.g. TICKET-FINAL"
                        value={ticketNo}
                        onChange={(e) => setTicketNo(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-stadium">Target Host Stadium</Label>
                      <select
                        id="ticket-stadium"
                        value={selStadium}
                        onChange={(e) => setSelStadium(e.target.value)}
                        className="text-xs font-semibold w-full px-2 py-2 rounded-lg border border-claude-border bg-white"
                      >
                        {stadiums.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ticket-match">Assigned Match</Label>
                      <select
                        id="ticket-match"
                        value={selMatch}
                        onChange={(e) => setSelMatch(e.target.value)}
                        className="text-xs font-semibold w-full px-2 py-2 rounded-lg border border-claude-border bg-white"
                      >
                        {games.map((g) => (
                          <option key={g.id} value={g.id}>
                            Match {g.id}: {g.home_team_name_en} vs. {g.away_team_name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4 mb-3">
                    <div>
                      <Label htmlFor="ticket-section">Seating Section</Label>
                      <select
                        id="ticket-section"
                        value={selSection}
                        onChange={(e) => setSelSection(e.target.value)}
                        className="text-xs font-semibold w-full px-2 py-2 rounded-lg border border-claude-border bg-white"
                      >
                        {["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112"].map((s) => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ticket-seat">Seat number</Label>
                      <Input
                        id="ticket-seat"
                        type="text"
                        placeholder="Row G, Seat 8"
                        value={seatNo}
                        onChange={(e) => setSeatNo(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ticket-gate">Assigned entry gate</Label>
                      <select
                        id="ticket-gate"
                        value={selGate}
                        onChange={(e) => setSelGate(e.target.value)}
                        className="text-xs font-semibold w-full px-2 py-2 rounded-lg border border-claude-border bg-white"
                      >
                        {["A", "B", "C", "D"].map((g) => (
                          <option key={g} value={g}>Gate {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="ticket-batch">Phased entry batch</Label>
                      <select
                        id="ticket-batch"
                        value={selBatch}
                        onChange={(e) => setSelBatch(Number(e.target.value))}
                        className="text-xs font-semibold w-full px-2 py-2 rounded-lg border border-claude-border bg-white"
                      >
                        {[1, 2, 3].map((b) => (
                          <option key={b} value={b}>Batch #{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="ticket-staff">Operations Staff (comma separated)</Label>
                      <Input
                        id="ticket-staff"
                        type="text"
                        placeholder="John Smith (ID: STAFF-001), David Miller"
                        value={ticketStaff}
                        onChange={(e) => setTicketStaff(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleRegisterTicket} className="w-full">
                        Register & Map Ticket
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ticket-vols">Guest Volunteers (comma separated)</Label>
                    <Input
                      id="ticket-vols"
                      type="text"
                      placeholder="Emma Watson, Alex Green, Ned Leeds"
                      value={ticketVols}
                      onChange={(e) => setTicketVols(e.target.value)}
                    />
                  </div>
                </div>

                {/* Ticket Registry Table */}
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                  Active Tickets & Allocated Personnel ({tickets.length})
                </h3>
                {tickets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-claude-border py-8 text-center text-xs text-claude-ink-muted">
                    No tickets registered in the database.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-claude-border bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-claude-surface text-claude-ink-muted border-b border-claude-border font-medium">
                          <th className="p-3">Ticket ID</th>
                          <th className="p-3">Match Detail</th>
                          <th className="p-3">Venue Stadium</th>
                          <th className="p-3 text-center">Seat / Gate</th>
                          <th className="p-3">Staff / Volunteers</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-claude-border">
                        {tickets.map((t) => {
                          const stadiumObj = stadiums.find((s) => s.id === t.stadiumId);
                          return (
                            <tr key={t.ticketNo} className="hover:bg-claude-surface/30">
                              <td className="p-3 font-mono font-bold text-claude-ink">{t.ticketNo}</td>
                              <td className="p-3">
                                <div className="font-semibold">{t.matchLabel}</div>
                                <div className="text-[10px] text-claude-ink-muted">Date: {t.date}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-claude-ink">{stadiumObj?.name || `ID: ${t.stadiumId}`}</div>
                                <div className="text-[10px] text-claude-ink-muted">{stadiumObj?.city || "Unknown City"}</div>
                              </td>
                              <td className="p-3 text-center">
                                <div>Sec {t.section}, {t.seatNo}</div>
                                <div className="text-[10px] font-bold text-claude-success">Gate {t.assignedGate} (Batch #{t.batch})</div>
                              </td>
                              <td className="p-3 space-y-1">
                                <div className="text-[10px] text-claude-ink-secondary leading-tight">
                                  <strong>Staff:</strong> {t.staff.join(", ") || "None"}
                                </div>
                                <div className="text-[10px] text-claude-ink-secondary leading-tight">
                                  <strong>Vols:</strong> {t.volunteers.join(", ") || "None"}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => deleteTicket(t.ticketNo)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Organizer and Staff credentials manager */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <h2 className="mb-1 font-serif text-xl text-claude-ink">Change Organizer Password</h2>
                  <p className="mb-4 text-xs text-claude-ink-secondary">
                    Update the Event Organizer credentials.
                  </p>
                  <div className="space-y-3">
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

                <Card>
                  <h2 className="mb-1 font-serif text-xl text-claude-ink">Staff Credentials Management</h2>
                  <p className="mb-4 text-xs text-claude-ink-secondary">
                    Register, update, or remove credentials for stadium staff members.
                  </p>

                  <div className="mb-4 rounded-xl border border-claude-border bg-claude-surface/30 p-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                      Add New Staff Member
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        type="text"
                        placeholder="Staff ID"
                        value={newStaffId}
                        onChange={(e) => setNewStaffId(e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={newStaffPass}
                        onChange={(e) => setNewStaffPass(e.target.value)}
                      />
                      <Button onClick={handleAddStaff} className="w-full">
                        Add Staff
                      </Button>
                    </div>
                  </div>

                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-claude-ink-secondary">
                    Active Staff Accounts ({staffCredentials.length})
                  </h3>
                  {staffCredentials.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-claude-border py-4 text-center text-xs text-claude-ink-muted">
                      No staff accounts registered.
                    </div>
                  ) : (
                    <div className="divide-y divide-claude-border overflow-hidden rounded-xl border border-claude-border bg-white max-h-48 overflow-y-auto">
                      {staffCredentials.map((staff) => {
                        const isEditing = editingStaffId === staff.id;
                        return (
                          <div
                            key={staff.id}
                            className="flex items-center justify-between p-2 hover:bg-claude-surface/20 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-claude-ink">{staff.id}</div>
                              <div className="text-[10px] text-claude-ink-muted">
                                Password: {isEditing ? "Editing..." : "••••••••"}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isEditing ? (
                                <>
                                  <Input
                                    type="password"
                                    placeholder="New"
                                    value={editingStaffPass}
                                    onChange={(e) => setEditingStaffPass(e.target.value)}
                                    className="h-7 w-24 px-1.5 text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveStaffPass(staff.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingStaffId(null)}
                                  >
                                    ✕
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
                                    Edit
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
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

