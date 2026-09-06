import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Play, Pause, RotateCcw } from "lucide-react";

interface VoicePlaybackProps {
  audioUrl?: string | null;
  textToSpeak?: string;
  language?: string;
  autoPlay?: boolean;
}

export const VoicePlayback: React.FC<VoicePlaybackProps> = ({
  audioUrl,
  textToSpeak,
  language = "en",
  autoPlay = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [useBrowserTTS, setUseBrowserTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fullAudioUrl = audioUrl
    ? audioUrl.startsWith("http")
      ? audioUrl
      : `http://localhost:8000${audioUrl}`
    : null;

  useEffect(() => {
    if (fullAudioUrl) {
      const audio = new Audio(fullAudioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || 4);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        console.warn("[VoicePlayback] Remote audio error, falling back to browser speech synthesis");
        setUseBrowserTTS(true);
      };

      if (autoPlay) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }

      return () => {
        audio.pause();
        audio.src = "";
      };
    } else {
      setUseBrowserTTS(true);
    }
  }, [fullAudioUrl, autoPlay]);

  const speakWithBrowserTTS = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      hi: "hi-IN",
      te: "te-IN",
      ta: "ta-IN",
      mr: "mr-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      ml: "ml-IN",
      en: "en-IN",
    };
    utterance.lang = langMap[language] || "en-IN";
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (useBrowserTTS || !fullAudioUrl) {
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
      } else if (textToSpeak) {
        speakWithBrowserTTS(textToSpeak);
      }
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn("Audio play error", e);
        if (textToSpeak) {
          setUseBrowserTTS(true);
          speakWithBrowserTTS(textToSpeak);
        }
      });
    }
  };

  const restartPlay = () => {
    if (audioRef.current && !useBrowserTTS) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true));
    } else if (textToSpeak) {
      speakWithBrowserTTS(textToSpeak);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        background: isPlaying ? "rgba(23, 107, 69, 0.08)" : "#F4F7F3",
        border: isPlaying ? "1.5px solid var(--green-deep)" : "1px solid var(--line-strong)",
        borderRadius: "20px",
        padding: "4px 12px 4px 8px",
        marginTop: "8px",
        fontSize: "12px",
        transition: "all 0.2s ease",
      }}
    >
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--green-deep)",
          color: "#FFFFFF",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(23, 107, 69, 0.2)",
          flexShrink: 0,
        }}
        title={isPlaying ? "Pause Voice" : "Play Voice Advisory"}
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: "2px" }} />}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {isPlaying ? (
          <Volume2 size={15} color="var(--green-deep)" className="animate-pulse" />
        ) : (
          <VolumeX size={15} color="var(--ink-soft)" />
        )}
        <span style={{ fontWeight: 700, color: isPlaying ? "var(--green-deep)" : "var(--ink)" }}>
          {isPlaying ? "Playing Voice Response" : "Listen to Response"}
        </span>
      </div>

      {duration > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          <div style={{ width: "36px", height: "4px", background: "#D8E2D5", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "var(--green-deep)", borderRadius: "2px" }} />
          </div>
          <span style={{ color: "var(--ink-soft)", fontSize: "11px" }}>
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
        </div>
      )}

      {isPlaying && (
        <button
          type="button"
          onClick={restartPlay}
          style={{
            background: "none",
            border: "none",
            padding: "2px",
            color: "var(--ink-soft)",
            cursor: "pointer",
          }}
          title="Replay from start"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};

export default VoicePlayback;
