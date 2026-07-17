"use client";

import { useEffect, useState } from "react";
import { StadiumAI } from "@/lib/ai-engine";
import { useApp } from "@/context/app-context";
import { Button, Card, ViewHeader } from "../ui";

export function AccessibilityView() {
  const {
    state,
    currentStadium,
    pushToast,
    setHighContrast,
    setLargeText,
  } = useApp();

  // Voice announcement preferences
  const [voiceAnnounce, setVoiceAnnounce] = useState(false);

  // Assistance dispatch simulator state
  const [assistanceStatus, setAssistanceStatus] = useState<"idle" | "requesting" | "dispatched">("idle");
  const [helperName, setHelperName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVoiceAnnounce(localStorage.getItem("fifa_voice_announce") === "true");
    }
  }, []);

  const toggleVoiceAnnounce = (val: boolean) => {
    setVoiceAnnounce(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("fifa_voice_announce", String(val));
    }
    pushToast(
      "Voice Reader",
      val ? "Text-to-Speech Assistance enabled." : "Text-to-Speech Assistance disabled.",
      "info"
    );
    if (val && typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("Text-to-Speech Assistance enabled.");
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSpeech = (text: string) => {
    if (voiceAnnounce && typeof window !== "undefined" && window.speechSynthesis) {
      // Cancel ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const plan = StadiumAI.planEvacuationRoute({}, state.blockedExits);

  const handleRequestAssistance = () => {
    setAssistanceStatus("requesting");
    pushToast("Contacting Dispatch", "Looking for nearest accessibility volunteer...", "info");
    handleSpeech("Contacting dispatch. Looking for the nearest accessibility volunteer.");

    setTimeout(() => {
      setAssistanceStatus("dispatched");
      const helpers = ["Sarah Jenkins", "Michael Chang", "Amara Okafor", "Mateo Silva"];
      const selectedHelper = helpers[Math.floor(Math.random() * helpers.length)];
      setHelperName(selectedHelper);
      pushToast(
        "Escort Dispatched",
        `Volunteer ${selectedHelper} is heading to Section ${state.myTicket?.section || "104"}.`,
        "success"
      );
      handleSpeech(`Assistance escort dispatched. Volunteer ${selectedHelper} is heading to your section.`);
    }, 2000);
  };

  const handleCancelAssistance = () => {
    setAssistanceStatus("idle");
    setHelperName("");
    pushToast("Request Cancelled", "Your assistance escort request has been cancelled.", "info");
    handleSpeech("Request cancelled.");
  };

  // Helper to map accessibility amenities to icons and descriptions
  const getAmenityDetails = (amenity: string) => {
    const text = amenity.toLowerCase();
    if (text.includes("elevator")) {
      return { icon: "🛗", desc: "Located at all entry gates and elevator lobbies for level changes." };
    }
    if (text.includes("ramp") || text.includes("step-free")) {
      return { icon: "♿", desc: "Available at Gates A, B, and C for seamless wheelchair navigation." };
    }
    if (text.includes("restroom") || text.includes("toilet")) {
      return { icon: "🚻", desc: "Equipped with grab bars, low sinks, and emergency call cords." };
    }
    if (text.includes("sensory") || text.includes("quiet")) {
      return { icon: "🎧", desc: "Quiet zones located near Section 108 for sensory relief." };
    }
    if (text.includes("audio") || text.includes("narration")) {
      return { icon: "🔊", desc: "Assistance narration headsets available at the Information Desk." };
    }
    if (text.includes("wheelchair rental")) {
      return { icon: "♿", desc: "Complimentary manual wheelchair rentals available at Gate A entrance." };
    }
    return { icon: "✨", desc: "Specialized accessibility facility verified for this stadium." };
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Accessibility Center"
        subtitle="Visual preferences, screen narration, and step-free navigation guides"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Controls & Visual Preferences */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="h-fit">
            <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink flex items-center gap-2">
              <span>⚙️</span> Display & Audio Settings
            </h2>
            <div className="space-y-4">
              {/* High Contrast Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-claude-border bg-claude-bg/50">
                <div>
                  <label htmlFor="high-contrast-toggle" className="font-semibold text-sm text-claude-ink block">
                    High Contrast Mode
                  </label>
                  <span className="text-xs text-claude-ink-secondary">
                    Increases readability with high contrast colors.
                  </span>
                </div>
                <button
                  id="high-contrast-toggle"
                  type="button"
                  aria-pressed={state.highContrast}
                  onClick={() => {
                    const nextVal = !state.highContrast;
                    setHighContrast(nextVal);
                    pushToast("High Contrast", nextVal ? "High contrast enabled." : "High contrast disabled.", "info");
                    handleSpeech(nextVal ? "High contrast mode activated." : "High contrast mode deactivated.");
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    state.highContrast ? "bg-claude-accent" : "bg-claude-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      state.highContrast ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Large Text Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-claude-border bg-claude-bg/50">
                <div>
                  <label htmlFor="large-text-toggle" className="font-semibold text-sm text-claude-ink block">
                    Large Font Size
                  </label>
                  <span className="text-xs text-claude-ink-secondary">
                    Enlarges text size across the application.
                  </span>
                </div>
                <button
                  id="large-text-toggle"
                  type="button"
                  aria-pressed={state.largeText}
                  onClick={() => {
                    const nextVal = !state.largeText;
                    setLargeText(nextVal);
                    pushToast("Large Text", nextVal ? "Large text enabled." : "Large text disabled.", "info");
                    handleSpeech(nextVal ? "Large font size enabled." : "Large font size disabled.");
                  }}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    state.largeText ? "bg-claude-accent" : "bg-claude-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      state.largeText ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Text-to-Speech Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-claude-border bg-claude-bg/50">
                <div>
                  <label htmlFor="narration-toggle" className="font-semibold text-sm text-claude-ink block">
                    Audio Announcements
                  </label>
                  <span className="text-xs text-claude-ink-secondary">
                    Speaks alerts and navigation guides out loud.
                  </span>
                </div>
                <button
                  id="narration-toggle"
                  type="button"
                  aria-pressed={voiceAnnounce}
                  onClick={() => toggleVoiceAnnounce(!voiceAnnounce)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    voiceAnnounce ? "bg-claude-accent" : "bg-claude-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      voiceAnnounce ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Volunteer Ground Support Panel */}
          <Card>
            <h2 className="mb-2 font-serif text-lg font-bold text-claude-ink flex items-center gap-2">
              <span>🙋‍♂️</span> Ground Support Assist
            </h2>
            <p className="text-xs text-claude-ink-secondary mb-4">
              Need assistance getting to your seat, restroom, or navigating the gates? Request a dedicated stadium volunteer escort.
            </p>

            {assistanceStatus === "idle" && (
              <Button onClick={handleRequestAssistance} className="w-full">
                Request Assistance Escort
              </Button>
            )}

            {assistanceStatus === "requesting" && (
              <div className="space-y-3 rounded-xl border border-claude-warning/30 bg-claude-warning/5 p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-claude-ink font-semibold text-sm">
                  <span className="h-2 w-2 rounded-full bg-claude-warning animate-ping" />
                  Contacting Dispatch...
                </div>
                <p className="text-xs text-claude-ink-secondary">
                  Locating nearby accessibility coordinators.
                </p>
                <div className="h-1 w-full bg-claude-border rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-claude-warning animate-pulse w-full" />
                </div>
              </div>
            )}

            {assistanceStatus === "dispatched" && (
              <div className="space-y-4 rounded-xl border border-claude-success/30 bg-claude-success/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-claude-success flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-claude-success" />
                    Escort Dispatched
                  </span>
                  <span className="text-[10px] text-claude-ink-secondary font-semibold">ETA: ~3 mins</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-claude-accent text-white font-bold text-sm">
                    {helperName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-claude-ink">{helperName}</h4>
                    <p className="text-xs text-claude-ink-secondary">Accessibility Escort Volunteer</p>
                  </div>
                </div>
                <p className="text-[11px] text-claude-ink-secondary leading-tight">
                  Volunteer is heading to <strong>Section {state.myTicket?.section || "104"}</strong>. Please remain at your seat or gate entry area.
                </p>
                <Button variant="ghost" size="sm" onClick={handleCancelAssistance} className="w-full text-rose-600 hover:bg-rose-50 border border-rose-200">
                  Cancel Request
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Step-free evac guide & Facility Grid */}
        <div className="space-y-6 lg:col-span-2">
          {/* Evacuation Route visualizer */}
          <Card>
            <div className="flex items-center justify-between border-b border-claude-border pb-4 mb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-claude-ink flex items-center gap-2">
                  <span>♿</span> Step-Free Evacuation Route
                </h2>
                <p className="text-xs text-claude-ink-secondary">
                  Custom step-free pathway generated based on live sensor feed
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  pushToast("Accessible route", `Use exit ${plan.exit.name}. ${plan.instructions[1]}`, "success");
                  handleSpeech(`Your step free exit route: Use exit ${plan.exit.name}. ${plan.instructions.join(" ")}`);
                }}
                className="border border-claude-border"
              >
                🔊 Read Aloud
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="rounded-xl border border-claude-border bg-claude-bg/40 p-3">
                <span className="text-xs text-claude-ink-secondary block">Exit Gate</span>
                <span className="font-serif text-lg font-bold text-claude-ink">{plan.exit.name}</span>
              </div>
              <div className="rounded-xl border border-claude-border bg-claude-bg/40 p-3">
                <span className="text-xs text-claude-ink-secondary block">Route Type</span>
                <span className="font-serif text-lg font-bold text-claude-success">100% Step-Free</span>
              </div>
              <div className="rounded-xl border border-claude-border bg-claude-bg/40 p-3">
                <span className="text-xs text-claude-ink-secondary block">Obstructions</span>
                <span className="font-serif text-lg font-bold text-amber-600">
                  {state.blockedExits.length} Avoided
                </span>
              </div>
            </div>

            {/* Visual steps */}
            <div className="relative border-l border-claude-border pl-6 ml-3 space-y-5 my-6">
              {plan.instructions.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step Dot */}
                  <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                    idx === 0
                      ? "bg-claude-accent border-claude-accent"
                      : idx === plan.instructions.length - 1
                      ? "bg-claude-success border-claude-success"
                      : "bg-white border-claude-border"
                  }`}>
                    {idx === plan.instructions.length - 1 && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold text-claude-ink block">Step {idx + 1}</span>
                    <span className="text-claude-ink-secondary leading-relaxed">{step}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-claude-accent-soft/30 p-3 text-[11px] text-claude-ink-secondary border border-claude-accent/20">
              ℹ️ In the event of an emergency, all elevators default to override control. Accessibility guides and stadium staff will assist visitors at every level-change ramp.
            </div>
          </Card>

          {/* Facility Amenities Grid */}
          <Card>
            <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink flex items-center gap-2">
              <span>🏟️</span> {currentStadium?.name || "Stadium"} Accessibility Amenities
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(currentStadium?.accessibility || []).length === 0 ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-claude-border p-6 text-center text-xs text-claude-ink-muted">
                  No specialized accessibility amenities catalogued for this venue.
                </div>
              ) : (
                (currentStadium?.accessibility || []).map((amenity) => {
                  const details = getAmenityDetails(amenity);
                  return (
                    <div
                      key={amenity}
                      className="flex gap-3 p-3 rounded-xl border border-claude-border bg-white hover:bg-claude-bg/20 transition-all"
                    >
                      <span className="text-2xl select-none">{details.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-claude-ink">{amenity}</h4>
                        <p className="text-[10px] text-claude-ink-secondary leading-tight mt-1">
                          {details.desc}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
