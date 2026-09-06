import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, X, AlertCircle } from "lucide-react";

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  onCancel: () => void;
  language?: string;
  maxSeconds?: number;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioRecorded,
  onCancel,
  language: _language = "en",
  maxSeconds = 60,
}) => {
  const [, setIsRecording] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    setSecondsElapsed(0);
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => {
        if (prev + 1 >= maxSeconds) {
          stopRecording();
          return maxSeconds;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Microphone access is not supported by your browser. You can continue typing your question.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "";
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (audioBlob.size > 32) {
          onAudioRecorded(audioBlob);
        } else {
          setErrorMsg("No audio signal recorded. Please try again.");
        }
      };

      recorder.start(250); // collect in 250ms chunks
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.warn("Microphone access denied or error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone permission was denied. Please allow microphone access in your browser settings to speak.");
      } else {
        setErrorMsg("Could not connect to microphone. You can continue using text chat.");
      }
    }
  };

  const stopRecording = () => {
    stopTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancel = () => {
    stopTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    onCancel();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (errorMsg) {
    return (
      <div
        style={{
          background: "#FFF4E5",
          border: "1px solid #FFE2B8",
          borderRadius: "12px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          fontSize: "13px",
          color: "#8B4700",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} color="#B06000" />
          <span>{errorMsg}</span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={handleCancel}
          style={{ padding: "4px 8px", fontSize: "12px" }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, #176B45 0%, #0F4C2E 100%)",
        color: "#FFFFFF",
        borderRadius: "14px",
        padding: "10px 16px",
        boxShadow: "0 4px 14px rgba(23, 107, 69, 0.25)",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Pulsing red mic dot */}
        <div
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "#FF5252",
            boxShadow: "0 0 8px #FF5252",
            animation: "pulse 1.2s infinite",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Mic size={17} color="#FFF" />
          <span style={{ fontWeight: 800, fontSize: "14px" }}>Listening to your voice...</span>
        </div>

        <span
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "monospace",
          }}
        >
          {formatTime(secondsElapsed)} / 01:00
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={stopRecording}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#FFFFFF",
            color: "var(--green-deep)",
            border: "none",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <Square size={13} fill="var(--green-deep)" /> Send Audio
        </button>

        <button
          type="button"
          onClick={handleCancel}
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Cancel Voice Recording"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;
