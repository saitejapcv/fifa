"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { translateText, translateAudio } from "@/lib/gemini";
import { Badge, Button, Card, ViewHeader, Select } from "../ui";

const SOURCE_LANGUAGES = [
  { code: "en", name: "English", locale: "en-US" },
  { code: "es", name: "Spanish (Español)", locale: "es-ES" },
  { code: "fr", name: "French (Français)", locale: "fr-FR" },
  { code: "de", name: "German (Deutsch)", locale: "de-DE" },
  { code: "pt", name: "Portuguese (Português)", locale: "pt-PT" },
  { code: "zh", name: "Chinese (中文)", locale: "zh-CN" },
  { code: "ja", name: "Japanese (日本語)", locale: "ja-JP" },
  { code: "ko", name: "Korean (한국어)", locale: "ko-KR" },
];

const TARGET_LANGUAGES = [
  { code: "es", name: "Spanish (Español)", locale: "es-ES" },
  { code: "en", name: "English", locale: "en-US" },
  { code: "fr", name: "French (Français)", locale: "fr-FR" },
  { code: "de", name: "German (Deutsch)", locale: "de-DE" },
  { code: "pt", name: "Portuguese (Português)", locale: "pt-PT" },
  { code: "ar", name: "Arabic (العربية)", locale: "ar-SA" },
  { code: "zh", name: "Mandarin Chinese (中文)", locale: "zh-CN" },
  { code: "ja", name: "Japanese (日本語)", locale: "ja-JP" },
  { code: "ko", name: "Korean (한국어)", locale: "ko-KR" },
  { code: "hi", name: "Hindi (हिन्दी)", locale: "hi-IN" },
  { code: "it", name: "Italian (Italiano)", locale: "it-IT" },
  { code: "ru", name: "Russian (Русский)", locale: "ru-RU" },
];

const PHRASEBOOK = [
  {
    category: "General Help",
    phrases: [
      { en: "Excuse me, where is the nearest exit?", key: "exit" },
      { en: "I need medical assistance. Where is the first aid station?", key: "medical" },
      { en: "Can you help me? I am lost.", key: "lost" },
      { en: "Where is the restroom?", key: "restroom" },
    ]
  },
  {
    category: "Ticketing & Seating",
    phrases: [
      { en: "Where is Gate C? Is this the correct gate for Section 104?", key: "gate" },
      { en: "Can you help me find Section 108, Row F, Seat 12?", key: "seat" },
      { en: "Someone is sitting in my seat. What should I do?", key: "occupied" },
      { en: "Where is the wheelchair accessible seating?", key: "accessible" },
    ]
  },
  {
    category: "Transit & Amenities",
    phrases: [
      { en: "Where can I catch the shuttle bus or train?", key: "transit" },
      { en: "Is there a sensory room in this stadium?", key: "sensory" },
      { en: "Where can I buy food or bottled water?", key: "water" },
      { en: "Where is the lost and found office?", key: "lostfound" },
    ]
  }
];

export function TranslateView() {
  const { pushToast } = useApp();
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [largeDisplayPhrase, setLargeDisplayPhrase] = useState("");

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup recorders on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const handleTranslate = async (textToTranslate = sourceText) => {
    const queryText = textToTranslate || sourceText;
    if (!queryText.trim()) return;
    setTranslating(true);
    try {
      const srcName = SOURCE_LANGUAGES.find((l) => l.code === sourceLang)?.name || "English";
      const targetName = TARGET_LANGUAGES.find((l) => l.code === targetLang)?.name || "Spanish";
      
      const prompt = `Translate this text from ${srcName} to ${targetName}: "${queryText}"`;
      const result = await translateText(prompt, targetName);
      setTranslatedText(result);
      pushToast("Translated Successfully", `${srcName} ➔ ${targetName}`, "success");
      return result;
    } catch (err) {
      pushToast("Translation Failed", err instanceof Error ? err.message : "Check your network or Gemini API Key.", "danger");
    } finally {
      setTranslating(false);
    }
  };

  const handleQuickTranslatePhrase = async (englishText: string) => {
    setSourceLang("en");
    setSourceText(englishText);
    setTranslating(true);
    try {
      const targetName = TARGET_LANGUAGES.find((l) => l.code === targetLang)?.name || "Spanish";
      const prompt = `Translate this text from English to ${targetName}: "${englishText}"`;
      const result = await translateText(prompt, targetName);
      setTranslatedText(result);
    } catch (err) {
      pushToast("Translation Failed", err instanceof Error ? err.message : "Translation lookup failed.", "danger");
    } finally {
      setTranslating(false);
    }
  };

  const handleSpeak = (textToSpeak: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      pushToast("Voice Output Unsupported", "Your browser does not support Speech Synthesis.", "warning");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    startGeminiVoiceRecording();
  };

  const startWebSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      startGeminiVoiceRecording();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      const currentSourceLocale = SOURCE_LANGUAGES.find((l) => l.code === sourceLang)?.locale || "en-US";
      
      recognition.lang = currentSourceLocale;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        pushToast("Listening...", "Speak into your microphone now.", "info");
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSourceText(transcript);
          setTranslating(true);
          
          const srcName = SOURCE_LANGUAGES.find((l) => l.code === sourceLang)?.name || "English";
          const targetName = TARGET_LANGUAGES.find((l) => l.code === targetLang)?.name || "Spanish";
          
          try {
            const prompt = `Translate this text from ${srcName} to ${targetName}: "${transcript}"`;
            const result = await translateText(prompt, targetName);
            setTranslatedText(result);
            pushToast("Voice Translated", `${srcName} ➔ ${targetName}`, "success");
            
            // Automatically play output speech response
            setTimeout(() => {
              handleSpeak(result);
            }, 300);
          } catch (err) {
            pushToast("Translation Failed", err instanceof Error ? err.message : "Voice translation failed.", "danger");
          } finally {
            setTranslating(false);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e.error || e);
        
        if (e.error === "network") {
          pushToast(
            "Speech Service Offline",
            "Browser Speech Recognition failed. Falling back to Gemini Voice Input...",
            "info"
          );
          startGeminiVoiceRecording();
        } else {
          setIsListening(false);
          if (e.error === "no-speech") {
            pushToast("No speech detected", "Please speak clearly into the microphone.", "info");
          } else if (e.error === "not-allowed") {
            pushToast("Microphone Blocked", "Please allow microphone access in your browser settings.", "danger");
          } else if (e.error === "aborted") {
            // Normal abort
          } else {
            pushToast("Voice Input Error", `Error: ${e.error || "unknown"}`, "danger");
          }
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      startGeminiVoiceRecording();
    }
  };

  const startGeminiVoiceRecording = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      pushToast("Voice Input Unsupported", "Your browser does not support audio recording.", "warning");
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current = null;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsListening(true);
        pushToast("GenAI Audio Recording...", "Recording audio. Click the microphone again to stop and translate.", "info");
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        if (audioBlob.size === 0) {
          pushToast("No audio recorded", "Audio recording was empty.", "warning");
          setIsListening(false);
          return;
        }

        setTranslating(true);
        pushToast("Processing Voice...", "Transcribing and translating your voice with Gemini...", "info");

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(",")[1];
            const mimeType = audioBlob.type.split(";")[0] || "audio/webm";

            const srcName = SOURCE_LANGUAGES.find((l) => l.code === sourceLang)?.name || "English";
            const targetName = TARGET_LANGUAGES.find((l) => l.code === targetLang)?.name || "Spanish";

            const result = await translateAudio(base64Data, mimeType, srcName, targetName);
            if (result.transcript) {
              setSourceText(result.transcript);
            }
            if (result.translation) {
              setTranslatedText(result.translation);
              pushToast("Voice Translated", `${srcName} ➔ ${targetName}`, "success");
              setTimeout(() => {
                handleSpeak(result.translation);
              }, 300);
            } else {
              pushToast("Could not translate audio", "Gemini could not detect or translate any speech in the audio.", "warning");
            }
            setTranslating(false);
          };
        } catch (error) {
          console.error("Gemini audio translation error:", error);
          pushToast("Voice Translation Failed", "Failed to process audio with Gemini.", "danger");
          setTranslating(false);
        }

        setIsListening(false);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      pushToast("Microphone Blocked", "Please allow microphone access in your browser settings.", "danger");
      setIsListening(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    pushToast("Copied to Clipboard", "Translated text copied successfully.", "success");
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="GenAI Live Translator"
        subtitle="Translate text or voice in real-time. Record speech to automatically speak replies."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Translation Console */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-claude-ink">Translation Tool</h2>
              <Badge tone={isListening ? "danger" : "info"}>
                {isListening ? "🎙️ Recording Live" : "Ready"}
              </Badge>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-claude-ink-muted mb-1">Source Language</label>
                <Select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                  {SOURCE_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-claude-ink-muted mb-1">Target Language</label>
                <Select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                  {TARGET_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-claude-ink-muted mb-1">Original Text</label>
              <div className="relative">
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-claude-border bg-white pl-3.5 pr-12 py-2 text-sm text-claude-ink focus:border-claude-accent focus:outline-none focus:ring-1 focus:ring-claude-accent"
                  placeholder="Type here, or click the microphone to speak..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-claude-surface text-claude-ink-secondary hover:bg-claude-accent-soft hover:text-claude-accent"
                  }`}
                  title="Speak to translate"
                >
                  🎙️
                </button>
              </div>
            </div>

            {translatedText && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-claude-ink-muted mb-0.5">Translation</label>
                <div className="min-h-[80px] w-full rounded-xl border border-claude-border/80 bg-claude-bg/50 px-4 py-3 text-sm text-claude-ink leading-relaxed">
                  {translatedText}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCopyToClipboard}>
                    📋 Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleSpeak(translatedText)}>
                    🔊 Listen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLargeDisplayPhrase(translatedText)}>
                    🔍 Show Large
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-claude-border flex justify-between items-center">
            <p className="text-[10px] text-claude-ink-muted">
              * Auto-speak plays translated voice output instantly after recording.
            </p>
            <Button size="sm" onClick={() => handleTranslate()} disabled={translating || !sourceText.trim()}>
              {translating ? "Translating..." : "Translate"}
            </Button>
          </div>
        </Card>

        {/* Stadium Phrasebook */}
        <Card>
          <h2 className="mb-4 font-serif text-lg font-bold text-claude-ink">Stadium Phrasebook</h2>
          <p className="text-xs text-claude-ink-secondary mb-4">
            Click any essential phrase below to quickly translate it, listen to it, or display it in large text to host staff.
          </p>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {PHRASEBOOK.map((group) => (
              <div key={group.category} className="space-y-2">
                <h3 className="text-xs font-bold text-claude-accent uppercase tracking-wider">
                  {group.category}
                </h3>
                <div className="space-y-1.5">
                  {group.phrases.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleQuickTranslatePhrase(p.en)}
                      className="w-full text-left rounded-xl border border-claude-border/60 hover:border-claude-accent/40 bg-claude-surface/30 px-3 py-2.5 text-xs text-claude-ink-secondary hover:text-claude-ink transition-all duration-300"
                    >
                      {p.en}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Large Show Modal */}
      {largeDisplayPhrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 border-claude-accent/30 shadow-lift flex flex-col justify-between max-h-[90vh]">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <Badge tone="info">Display Helper</Badge>
                <button
                  onClick={() => setLargeDisplayPhrase("")}
                  className="h-6 w-6 text-claude-ink-muted hover:text-claude-ink transition flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-claude-ink-secondary">Show this screen to stadium staff or helpers:</p>
              <div className="rounded-xl border border-claude-border bg-claude-surface/40 p-6 text-2xl font-serif font-bold text-center text-claude-ink leading-relaxed break-words">
                {largeDisplayPhrase}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-claude-border flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleSpeak(largeDisplayPhrase)}>
                🔊 Speak Audio
              </Button>
              <Button size="sm" onClick={() => setLargeDisplayPhrase("")}>
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
