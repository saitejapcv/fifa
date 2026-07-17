"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, ViewHeader } from "../ui";
import {
  teamsData, // local static roster data
  Player,
} from "@/lib/tournament-data";
import { motion, AnimatePresence } from "framer-motion";

// API Interface Types
interface ApiTeam {
  _id: string;
  id: string;
  name_en: string;
  name_fa?: string;
  flag: string;
  fifa_code: string;
  iso2?: string;
  groups: string;
}

interface ApiGroupTeam {
  team_id: string;
  mp: string;
  w: string;
  l: string;
  d: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
  _id: string;
}

interface ApiGroup {
  _id: string;
  name: string;
  teams: ApiGroupTeam[];
}

interface ApiGame {
  _id: string;
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_team_label?: string;
  away_team_label?: string;
  venue?: string;
}

export function MatchesView() {
  const [activeTab, setActiveTab] = useState<"live" | "schedule" | "standings" | "knockout">("live");
  const [scheduleFilter, setScheduleFilter] = useState<"past" | "future">("past");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // API State
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [teamsRes, groupsRes, gamesRes] = await Promise.all([
          fetch("/api/worldcup?endpoint=teams", { signal: controller.signal }),
          fetch("/api/worldcup?endpoint=groups", { signal: controller.signal }),
          fetch("/api/worldcup?endpoint=games", { signal: controller.signal }),
        ]);

        if (!teamsRes.ok || !groupsRes.ok || !gamesRes.ok) {
          throw new Error("Failed to load FIFA World Cup data. The server API might be rate-limited.");
        }

        const teamsDataJson = await teamsRes.json();
        const groupsDataJson = await groupsRes.json();
        const gamesDataJson = await gamesRes.json();

        setTeams(teamsDataJson.teams || []);
        setGroups(groupsDataJson.groups || []);
        setGames(gamesDataJson.games || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error loading World Cup data:", err);
        setError(err instanceof Error ? err.message : "Failed to load tournament data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
    return () => controller.abort();
  }, []);

  // Helper: Look up team info by API ID
  const getTeamDetails = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      return {
        name: team.name_en,
        code: team.fifa_code,
        flagUrl: team.flag,
      };
    }
    return null;
  };

  // Helper: Parse scorers string from API
  const parseScorers = (scorersStr: string | null) => {
    if (!scorersStr || scorersStr === "null" || scorersStr === "undefined") return [];
    try {
      // Clean up postgres curly braces/quotes
      const cleaned = scorersStr
        .replace(/[“]/g, '"')
        .replace(/[”]/g, '"')
        .replace(/\\"/g, '"');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object") return Object.values(parsed) as string[];
      return [String(parsed)];
    } catch (e) {
      const cleaned = scorersStr.replace(/[{}"[\]]/g, "").trim();
      if (!cleaned) return [];
      return cleaned.split(",").map((s) => s.replace(/["']/g, "").trim()).filter(Boolean);
    }
  };

  // Helper: Get roster for a team (leveraging local static database)
  const getRosterForTeam = (code: string, name: string) => {
    // Find static matches in local list
    const staticTeam = teamsData.find(
      (t) => t.code.toUpperCase() === code.toUpperCase() || t.name.toLowerCase() === name.toLowerCase()
    );
    if (staticTeam) {
      return staticTeam.players;
    }
    // High-fidelity fallback generator if not in static list
    return [
      { number: 1, name: `${name} Goalkeeper`, position: "Goalkeeper" },
      { number: 4, name: `${name} Captain`, position: "Defender", keyPlayer: true },
      { number: 8, name: `${name} Midfielder`, position: "Midfielder" },
      { number: 10, name: `${name} Playmaker`, position: "Forward", keyPlayer: true },
      { number: 9, name: `${name} Striker`, position: "Forward" },
    ] as Player[];
  };

  // Find selected team details
  const selectedApiTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedTeamRoster = selectedApiTeam
    ? getRosterForTeam(selectedApiTeam.fifa_code, selectedApiTeam.name_en)
    : [];

  // Filter games for Live Tab
  const liveGames = games.filter((g) => g.finished === "FALSE" && g.time_elapsed !== "notstarted");

  // Determine latest completed matchday if no live games are available
  const completedGames = games.filter((g) => g.finished === "TRUE");
  const latestMatchday = completedGames.reduce((max, g) => {
    const md = parseInt(g.matchday) || 1;
    return md > max ? md : max;
  }, 1);
  const latestCompletedGames = completedGames.filter((g) => (parseInt(g.matchday) || 1) === latestMatchday);

  // Group standings by Name A-L sorted alphabetically
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  // Filter games for Knockout Round Bracket
  const knockoutRounds = [
    { name: "Round of 32", matches: games.filter((g) => g.type === "r32") },
    { name: "Round of 16", matches: games.filter((g) => g.type === "r16") },
    { name: "Quarter-Finals", matches: games.filter((g) => g.type === "qf") },
    { name: "Semi-Finals", matches: games.filter((g) => g.type === "sf") },
    { name: "Final & 3rd Place", matches: games.filter((g) => g.type === "final" || g.type === "third_place") },
  ];

  return (
    <div className="relative min-h-[calc(100vh-120px)] pb-12">
      <ViewHeader
        title="Tournament Match Center"
        subtitle="Live match updates, fixture schedules, 2026 group tables, knockout brackets, and squad rosters"
      />

      {/* Main Tabs */}
      <div className="mb-6 flex border-b border-claude-border pb-px overflow-x-auto space-x-6">
        {([
          { id: "live", label: "🔴 Live Center" },
          { id: "schedule", label: "📅 Schedule & Results" },
          { id: "standings", label: "🏆 Standings & Rosters" },
          { id: "knockout", label: "🌲 Knockout Stage" },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTeamId(null);
              }}
              className={`relative py-3 text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap focus:outline-none ${
                active ? "text-claude-accent font-bold" : "text-claude-ink-muted hover:text-claude-ink"
              }`}
            >
              {tab.label}
              {active && (
                <motion.div
                  layoutId="matches-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-claude-accent/20 border-t-claude-accent" />
          <p className="text-sm font-medium text-claude-ink-secondary">Retrieving real-time FIFA 2026 World Cup data...</p>
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50/50 p-6 text-center text-red-800">
          <p className="font-semibold mb-2">Failed to Sync World Cup Data</p>
          <p className="text-xs text-red-600/90">{error}</p>
        </Card>
      ) : (
        <AnimatePresence mode="wait">
          {/* 🔴 LIVE CENTER */}
          {activeTab === "live" && (
            <motion.div
              key="live-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {liveGames.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {liveGames.map((match) => {
                    const home = getTeamDetails(match.home_team_id);
                    const away = getTeamDetails(match.away_team_id);
                    const homeScorers = parseScorers(match.home_scorers);
                    const awayScorers = parseScorers(match.away_scorers);

                    return (
                      <Card key={match.id} className="relative overflow-hidden border border-claude-accent/20 bg-white shadow-lift">
                        <div className="absolute left-0 top-0 flex h-1 w-full bg-claude-surface">
                          <div className="h-full bg-claude-accent animate-pulse" style={{ width: "75%" }} />
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-claude-accent flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-claude-accent animate-ping" />
                            Live • Group {match.group || "Knockout"}
                          </span>
                          <Badge tone="info" className="font-semibold">{match.time_elapsed}&apos;</Badge>
                        </div>

                        <div className="my-6 grid grid-cols-7 items-center text-center">
                          <div className="col-span-2 flex flex-col items-center">
                            {home?.flagUrl ? (
                              <img src={home.flagUrl} alt={`${home.name} Flag`} className="h-10 w-14 object-cover rounded shadow-sm border mb-2" />
                            ) : (
                              <span className="text-4xl mb-2">🏳️</span>
                            )}
                            <span className="font-serif text-base font-bold text-claude-ink truncate max-w-[100px]">{home?.name || match.home_team_name_en}</span>
                            <span className="text-xs text-claude-ink-muted mt-0.5">{home?.code || "TBD"}</span>
                          </div>

                          <div className="col-span-3 flex flex-col items-center justify-center">
                            <div className="font-serif text-3xl font-extrabold tracking-widest text-claude-ink tabular-nums">
                              {match.home_score} - {match.away_score}
                            </div>
                            <span className="text-[9px] text-claude-ink-muted uppercase tracking-wider mt-2 truncate max-w-[150px]">{match.venue || "FIFA Stadium"}</span>
                          </div>

                          <div className="col-span-2 flex flex-col items-center">
                            {away?.flagUrl ? (
                              <img src={away.flagUrl} alt={`${away.name} Flag`} className="h-10 w-14 object-cover rounded shadow-sm border mb-2" />
                            ) : (
                              <span className="text-4xl mb-2">🏳️</span>
                            )}
                            <span className="font-serif text-base font-bold text-claude-ink truncate max-w-[100px]">{away?.name || match.away_team_name_en}</span>
                            <span className="text-xs text-claude-ink-muted mt-0.5">{away?.code || "TBD"}</span>
                          </div>
                        </div>

                        {/* Scorers */}
                        {(homeScorers.length > 0 || awayScorers.length > 0) && (
                          <div className="grid grid-cols-7 text-[10px] text-claude-ink-muted mt-2 border-t border-claude-border/30 pt-2">
                            <div className="col-span-3 text-left pl-2 space-y-0.5">
                              {homeScorers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span>⚽</span>
                                  <span className="truncate">{s}</span>
                                </div>
                              ))}
                            </div>
                            <div className="col-span-1" />
                            <div className="col-span-3 text-right pr-2 space-y-0.5">
                              {awayScorers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1 justify-end">
                                  <span className="truncate">{s}</span>
                                  <span>⚽</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-claude-surface/30 border border-dashed border-claude-border p-4 text-center text-xs text-claude-ink-secondary">
                    🔴 No live matches in progress right now. Showing recent results from **Matchday {latestMatchday}**.
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {latestCompletedGames.map((match) => {
                      const home = getTeamDetails(match.home_team_id);
                      const away = getTeamDetails(match.away_team_id);
                      const homeScorers = parseScorers(match.home_scorers);
                      const awayScorers = parseScorers(match.away_scorers);

                      return (
                        <Card key={match.id} className="bg-white border shadow-soft hover:shadow-lift transition-all duration-300">
                          <div className="flex items-center justify-between text-[10px] text-claude-ink-muted mb-2 font-semibold">
                            <span>Group {match.group || "Knockout"} • Matchday {match.matchday}</span>
                            <span>Finished</span>
                          </div>

                          <div className="my-4 grid grid-cols-7 items-center text-center">
                            <div className="col-span-2 flex flex-col items-center">
                              {home?.flagUrl ? (
                                <img src={home.flagUrl} alt={`${home.name} Flag`} className="h-8 w-11 object-cover rounded shadow-sm border mb-1.5" />
                              ) : (
                                <span className="text-3xl mb-1.5">🏳️</span>
                              )}
                              <span className="font-serif text-sm font-bold text-claude-ink truncate max-w-[90px]">{home?.name || match.home_team_name_en}</span>
                            </div>

                            <div className="col-span-3 flex flex-col items-center justify-center">
                              <div className="font-serif text-2xl font-extrabold tracking-widest text-claude-ink tabular-nums">
                                {match.home_score} - {match.away_score}
                              </div>
                              <span className="text-[8px] text-claude-ink-muted truncate max-w-[130px] mt-1">{match.venue || "FIFA Stadium"}</span>
                            </div>

                            <div className="col-span-2 flex flex-col items-center">
                              {away?.flagUrl ? (
                                <img src={away.flagUrl} alt={`${away.name} Flag`} className="h-8 w-11 object-cover rounded shadow-sm border mb-1.5" />
                              ) : (
                                <span className="text-3xl mb-1.5">🏳️</span>
                              )}
                              <span className="font-serif text-sm font-bold text-claude-ink truncate max-w-[90px]">{away?.name || match.away_team_name_en}</span>
                            </div>
                          </div>

                          {/* Scorers */}
                          {(homeScorers.length > 0 || awayScorers.length > 0) && (
                            <div className="grid grid-cols-7 text-[10px] text-claude-ink-muted mt-2 border-t border-claude-border/30 pt-2">
                              <div className="col-span-3 text-left pl-1 space-y-0.5">
                                {homeScorers.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span>⚽</span>
                                    <span className="truncate max-w-[100px]" title={s}>{s}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="col-span-1" />
                              <div className="col-span-3 text-right pr-1 space-y-0.5">
                                {awayScorers.map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-1 justify-end">
                                    <span className="truncate max-w-[100px]" title={s}>{s}</span>
                                    <span>⚽</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 📅 SCHEDULE & RESULTS */}
          {activeTab === "schedule" && (
            <motion.div
              key="schedule-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex gap-2 bg-claude-surface p-1 rounded-xl w-fit">
                <Button
                  variant={scheduleFilter === "past" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setScheduleFilter("past")}
                >
                  Past Results
                </Button>
                <Button
                  variant={scheduleFilter === "future" ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setScheduleFilter("future")}
                >
                  Upcoming Fixtures
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {games
                  .filter((m) => (scheduleFilter === "past" ? m.finished === "TRUE" : m.finished !== "TRUE"))
                  .sort((a, b) => {
                    // Sort past matches newest first, future matches oldest/closest first
                    const diff = new Date(a.local_date).getTime() - new Date(b.local_date).getTime();
                    return scheduleFilter === "past" ? -diff : diff;
                  })
                  .map((match) => {
                    const home = getTeamDetails(match.home_team_id);
                    const away = getTeamDetails(match.away_team_id);
                    const homeScorers = parseScorers(match.home_scorers);
                    const awayScorers = parseScorers(match.away_scorers);

                    return (
                      <Card key={match.id} className="hover:border-claude-border-strong transition-all duration-300">
                        <div className="flex items-center justify-between text-[10px] text-claude-ink-muted mb-3 font-semibold uppercase tracking-wider">
                          <span>Group {match.group || "Knockout"} • Matchday {match.matchday} • {match.venue || "FIFA Stadium"}</span>
                          <span>{match.local_date.split(" ")[0]}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 w-5/12">
                            {home?.flagUrl ? (
                              <img src={home.flagUrl} alt={`${home?.name || match.home_team_name_en} Flag`} className="h-6 w-9 object-cover rounded shadow-sm border" />
                            ) : (
                              <span className="text-xl">🏳️</span>
                            )}
                            <span className="font-serif text-sm font-bold text-claude-ink truncate">{home?.name || match.home_team_name_en}</span>
                          </div>

                          <div className="w-2/12 text-center font-bold font-serif text-sm bg-claude-surface/60 rounded px-2 py-1 select-none text-claude-ink">
                            {match.finished === "TRUE" ? (
                              <span className="tabular-nums">{match.home_score} - {match.away_score}</span>
                            ) : (
                              <span className="text-[8px] font-sans font-medium uppercase text-claude-accent whitespace-nowrap">
                                {match.local_date.split(" ")[1] || "18:00"}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-3 w-5/12 text-right">
                            <span className="font-serif text-sm font-bold text-claude-ink truncate">{away?.name || match.away_team_name_en}</span>
                            {away?.flagUrl ? (
                              <img src={away.flagUrl} alt={`${away?.name || match.away_team_name_en} Flag`} className="h-6 w-9 object-cover rounded shadow-sm border" />
                            ) : (
                              <span className="text-xl">🏳️</span>
                            )}
                          </div>
                        </div>

                        {match.finished === "TRUE" && (homeScorers.length > 0 || awayScorers.length > 0) && (
                          <div className="grid grid-cols-7 text-[10px] text-claude-ink-muted mt-3 border-t border-claude-border/30 pt-2">
                            <div className="col-span-3 text-left space-y-0.5">
                              {homeScorers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <span>⚽</span>
                                  <span className="truncate max-w-[120px]">{s}</span>
                                </div>
                              ))}
                            </div>
                            <div className="col-span-1" />
                            <div className="col-span-3 text-right space-y-0.5">
                              {awayScorers.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1 justify-end">
                                  <span className="truncate max-w-[120px]">{s}</span>
                                  <span>⚽</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {/* 🏆 STANDINGS & ROSTERS */}
          {activeTab === "standings" && (
            <motion.div
              key="standings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 lg:grid-cols-2 relative"
            >
              {/* Standings Grid */}
              <div className="space-y-6">
                {sortedGroups.map((group) => (
                  <Card key={group._id || group.name} className="p-4 shadow-sm border border-claude-border/80">
                    <div className="mb-3 flex items-center justify-between border-b border-claude-border/70 pb-2">
                      <h3 className="font-serif text-base font-bold text-claude-ink">Group {group.name}</h3>
                      <Badge tone="success" className="text-[9px] font-bold">Top 2 Qualify</Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-claude-ink-muted border-b border-claude-border/40 pb-2 font-medium">
                            <th className="py-1.5 pr-2">Team</th>
                            <th className="py-1.5 px-2 text-center">PL</th>
                            <th className="py-1.5 px-1 text-center">W</th>
                            <th className="py-1.5 px-1 text-center">D</th>
                            <th className="py-1.5 px-1 text-center">L</th>
                            <th className="py-1.5 px-2 text-center">GD</th>
                            <th className="py-1.5 pl-2 text-center font-semibold">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-claude-border/30">
                          {group.teams.map((groupTeam, index) => {
                            const details = getTeamDetails(groupTeam.team_id);
                            const isTopTwo = index < 2;
                            const isSelected = selectedTeamId === groupTeam.team_id;
                            return (
                              <tr
                                key={groupTeam.team_id}
                                onClick={() => setSelectedTeamId(groupTeam.team_id)}
                                className={`cursor-pointer hover:bg-claude-accent-soft/20 transition-colors ${
                                  isSelected ? "bg-claude-accent-soft/40" : ""
                                }`}
                              >
                                <td className="py-2.5 pr-2 font-medium text-claude-ink flex items-center gap-2">
                                  <span className="text-[10px] text-claude-ink-muted w-3 font-semibold text-center">{index + 1}</span>
                                  {details?.flagUrl ? (
                                    <img src={details.flagUrl} alt={`${details?.name || "Country"} Flag`} className="h-4 w-6 object-cover rounded border shadow-sm" />
                                  ) : (
                                    <span className="text-lg">🏳️</span>
                                  )}
                                  <span className={`truncate max-w-[120px] ${isTopTwo ? "font-semibold" : ""}`}>{details?.name || `Team ${groupTeam.team_id}`}</span>
                                </td>
                                <td className="py-2.5 px-2 text-center tabular-nums text-claude-ink-secondary">{groupTeam.mp}</td>
                                <td className="py-2.5 px-1 text-center tabular-nums text-claude-ink-muted">{groupTeam.w}</td>
                                <td className="py-2.5 px-1 text-center tabular-nums text-claude-ink-muted">{groupTeam.d}</td>
                                <td className="py-2.5 px-1 text-center tabular-nums text-claude-ink-muted">{groupTeam.l}</td>
                                <td className="py-2.5 px-2 text-center tabular-nums text-claude-ink-secondary">{parseInt(groupTeam.gd) > 0 ? `+${groupTeam.gd}` : groupTeam.gd}</td>
                                <td className="py-2.5 pl-2 text-center font-bold tabular-nums text-claude-ink">{groupTeam.pts}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-[10px] text-claude-ink-muted text-right">
                      💡 Click a team row to open squad roster.
                    </p>
                  </Card>
                ))}
              </div>

              {/* Roster Slide Panel */}
              <div className="lg:sticky lg:top-4 h-fit">
                <AnimatePresence mode="wait">
                  {selectedApiTeam ? (
                    <motion.div
                      key={selectedApiTeam.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border border-claude-accent/30 bg-claude-card p-5 shadow-lift relative">
                        <button
                          onClick={() => setSelectedTeamId(null)}
                          className="absolute right-4 top-4 h-7 w-7 flex items-center justify-center rounded-lg border border-claude-border text-claude-ink-muted hover:text-claude-ink hover:bg-claude-surface transition"
                          title="Close Roster"
                        >
                          ✕
                        </button>

                        <div className="flex items-center gap-3 border-b border-claude-border pb-4 mb-4">
                          {selectedApiTeam.flag ? (
                            <img src={selectedApiTeam.flag} alt={`${selectedApiTeam.name_en} Flag`} className="h-8 w-12 object-cover rounded shadow border" />
                          ) : (
                            <span className="text-4xl select-none">🏳️</span>
                          )}
                          <div>
                            <h3 className="font-serif text-xl font-bold text-claude-ink">{selectedApiTeam.name_en} Squad</h3>
                            <p className="text-xs text-claude-ink-secondary capitalize">Group {selectedApiTeam.groups} • Code: {selectedApiTeam.fifa_code}</p>
                          </div>
                        </div>

                        {/* Players by position */}
                        <div className="space-y-4">
                          {(["Goalkeeper", "Defender", "Midfielder", "Forward"] as const).map((pos) => {
                            const players = selectedTeamRoster.filter((p) => p.position === pos);
                            if (players.length === 0) return null;
                            return (
                              <div key={pos}>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-claude-accent mb-1.5">{pos}s</h4>
                                <div className="space-y-1">
                                  {players.map((player) => (
                                    <div
                                      key={player.number}
                                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-claude-surface/30 border border-transparent hover:border-claude-border/40 transition"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 font-semibold text-claude-ink-muted tabular-nums text-right">{player.number}</span>
                                        <span className="font-medium text-claude-ink">{player.name}</span>
                                      </div>
                                      {player.keyPlayer && (
                                        <Badge tone="warning" className="text-[8px] font-extrabold uppercase">⭐️ Key Player</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-roster"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hidden lg:block rounded-2xl border border-dashed border-claude-border bg-claude-surface/20 p-12 text-center text-xs text-claude-ink-muted"
                    >
                      Select a team from the standings tables to browse their full player roster and squad stats here.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* 🌲 KNOCKOUT STAGE */}
          {activeTab === "knockout" && (
            <motion.div
              key="knockout-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="overflow-x-auto pb-6"
            >
              <div className="flex gap-8 min-w-[1100px] p-2 items-stretch justify-between">
                {knockoutRounds.map((round) => (
                  <div key={round.name} className="flex flex-col flex-1 justify-around gap-4 min-w-[220px]">
                    <div className="border-b border-claude-border pb-2 text-center mb-4">
                      <h3 className="font-serif text-sm font-bold text-claude-ink">{round.name}</h3>
                      <span className="text-[9px] text-claude-ink-muted uppercase tracking-wider font-semibold">
                        {round.matches.length} Match{round.matches.length > 1 ? "es" : ""}
                      </span>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col justify-around">
                      {round.matches.map((match) => {
                        const home = getTeamDetails(match.home_team_id);
                        const away = getTeamDetails(match.away_team_id);
                        
                        const homeName = match.home_team_name_en || match.home_team_label || "TBD";
                        const awayName = match.away_team_name_en || match.away_team_label || "TBD";

                        const homeScore = parseInt(match.home_score);
                        const awayScore = parseInt(match.away_score);
                        const isHomeWinner = match.finished === "TRUE" && homeScore > awayScore;
                        const isAwayWinner = match.finished === "TRUE" && awayScore > homeScore;

                        return (
                          <div
                            key={match.id}
                            className="rounded-xl border border-claude-border bg-white shadow-soft p-2.5 relative hover:border-claude-accent/30 transition-all select-none"
                          >
                            <div className="text-[9px] text-claude-ink-muted flex justify-between mb-2">
                              <span className="font-semibold uppercase tracking-wider">{match.venue ? match.venue.split(" ")[0] : "FIFA"}</span>
                              <span>{match.local_date ? match.local_date.split(" ")[0].replace("2026-", "") : ""}</span>
                            </div>

                            <div className="space-y-1.5">
                              {/* Home Team */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                                  {home?.flagUrl ? (
                                    <img src={home.flagUrl} alt={`${homeName} Flag`} className="h-3 w-4.5 object-cover rounded border" />
                                  ) : (
                                    <span>🏳️</span>
                                  )}
                                  <span className={isHomeWinner ? "font-bold text-claude-ink" : "text-claude-ink-secondary"}>
                                    {homeName}
                                  </span>
                                </div>
                                {match.finished === "TRUE" && (
                                  <span className={`font-serif tabular-nums font-bold ${isHomeWinner ? "text-claude-accent" : "text-claude-ink-muted"}`}>
                                    {match.home_score}
                                  </span>
                                )}
                              </div>

                              {/* Away Team */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                                  {away?.flagUrl ? (
                                    <img src={away.flagUrl} alt={`${awayName} Flag`} className="h-3 w-4.5 object-cover rounded border" />
                                  ) : (
                                    <span>🏳️</span>
                                  )}
                                  <span className={isAwayWinner ? "font-bold text-claude-ink" : "text-claude-ink-secondary"}>
                                    {awayName}
                                  </span>
                                </div>
                                {match.finished === "TRUE" && (
                                  <span className={`font-serif tabular-nums font-bold ${isAwayWinner ? "text-claude-accent" : "text-claude-ink-muted"}`}>
                                    {match.away_score}
                                  </span>
                                )}
                              </div>
                            </div>

                            {match.finished !== "TRUE" && (
                              <div className="mt-2 text-center text-[9px] text-claude-accent font-medium bg-claude-accent-soft/30 rounded py-0.5 uppercase tracking-wider">
                                {match.local_date ? match.local_date.split(" ")[1] : "Kickoff"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
