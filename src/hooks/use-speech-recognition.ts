import { useState, useRef, useCallback, useEffect } from "react";

export type AudioSource = "mic" | "system" | "both";
export type Speaker = "salesperson" | "prospect";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string, isFinal: boolean, speaker: Speaker) => void;
  onError?: (error: string) => void;
  language?: string;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  audioSource: AudioSource;
  start: (source: AudioSource) => void;
  stop: () => void;
  interimTranscript: string;
}

// Extend Window for webkit prefix
interface SpeechRecognitionType extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognitionType;
    SpeechRecognition: new () => SpeechRecognitionType;
  }
}

/**
 * Monitors RMS volume of an audio stream using an AnalyserNode.
 * Returns a ref that always holds the current RMS level (0–1).
 */
function createLevelMonitor(stream: MediaStream, audioCtx: AudioContext) {
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const dataArray = new Float32Array(analyser.frequencyBinCount);

  let level = 0;
  let rafId: number | null = null;

  function tick() {
    analyser.getFloatTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    level = Math.sqrt(sum / dataArray.length);
    rafId = requestAnimationFrame(tick);
  }

  tick();

  return {
    getLevel: () => level,
    stop: () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      source.disconnect();
    },
  };
}

export function useSpeechRecognition({
  onTranscript,
  onError,
  language = "en-US",
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>("mic");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const restartingRef = useRef(false);
  const activeSourceRef = useRef<AudioSource>("mic");

  // Audio level monitors
  const micMonitorRef = useRef<{ getLevel: () => number; stop: () => void } | null>(null);
  const systemMonitorRef = useRef<{ getLevel: () => number; stop: () => void } | null>(null);

  // Running average of levels to smooth out spikes
  const micLevelHistoryRef = useRef<number[]>([]);
  const systemLevelHistoryRef = useRef<number[]>([]);

  const determineSpeaker = useCallback((): Speaker => {
    const source = activeSourceRef.current;
    // If only one source, speaker is obvious
    if (source === "mic") return "salesperson";
    if (source === "system") return "prospect";

    // "both" mode — compare audio levels
    const micLevel = micMonitorRef.current?.getLevel() ?? 0;
    const sysLevel = systemMonitorRef.current?.getLevel() ?? 0;

    // Push to rolling history (last 10 samples ~ last few hundred ms)
    micLevelHistoryRef.current.push(micLevel);
    systemLevelHistoryRef.current.push(sysLevel);
    if (micLevelHistoryRef.current.length > 10) micLevelHistoryRef.current.shift();
    if (systemLevelHistoryRef.current.length > 10) systemLevelHistoryRef.current.shift();

    const avgMic = micLevelHistoryRef.current.reduce((a, b) => a + b, 0) / micLevelHistoryRef.current.length;
    const avgSys = systemLevelHistoryRef.current.reduce((a, b) => a + b, 0) / systemLevelHistoryRef.current.length;

    // If system audio is significantly louder, it's the prospect speaking
    // Use a threshold because mic may also pick up leaked system audio
    if (avgSys > avgMic * 1.5 && avgSys > 0.01) {
      return "prospect";
    }
    return "salesperson";
  }, []);

  const cleanup = useCallback(() => {
    restartingRef.current = false;
    micMonitorRef.current?.stop();
    micMonitorRef.current = null;
    systemMonitorRef.current?.stop();
    systemMonitorRef.current = null;
    micLevelHistoryRef.current = [];
    systemLevelHistoryRef.current = [];
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      onError?.("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const speaker = determineSpeaker();
          onTranscript(transcript, true, speaker);
        } else {
          interim += transcript;
        }
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (event.error === "not-allowed") {
        onError?.("Microphone access denied. Please allow mic permissions.");
        cleanup();
        return;
      }
      onError?.(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (restartingRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    return recognition;
  }, [language, onTranscript, onError, cleanup, determineSpeaker]);

  const start = useCallback(
    async (source: AudioSource) => {
      cleanup();
      setAudioSource(source);
      activeSourceRef.current = source;

      // For mic-only mode, skip all AudioContext/stream setup — just use speech recognition directly
      if (source === "mic") {
        const recognition = startRecognition();
        if (!recognition) return;
        recognitionRef.current = recognition;
        restartingRef.current = true;
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          onError?.("Failed to start speech recognition. Please allow microphone access.");
          cleanup();
        }
        return;
      }

      // For system/both modes, set up AudioContext and streams
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Get mic stream for level monitoring (in "both" mode)
      if (source === "both") {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
          micMonitorRef.current = createLevelMonitor(micStream, audioContext);
        } catch {
          // Fall through — mic level monitoring is optional for speaker detection
        }
      }

      // Capture tab/system audio
      try {
        if (window.self !== window.top) {
          throw new Error("iframe");
        }
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        displayStreamRef.current = displayStream;

        // Monitor system audio levels
        systemMonitorRef.current = createLevelMonitor(displayStream, audioContext);

        // Route system audio to speakers so mic captures it for speech recognition
        const systemSrc = audioContext.createMediaStreamSource(displayStream);
        systemSrc.connect(audioContext.destination);

        // Stop video track (we only need audio)
        displayStream.getVideoTracks().forEach((t) => t.stop());

        // Handle user stopping screen share
        displayStream.getAudioTracks().forEach((track) => {
          track.onended = () => cleanup();
        });
      } catch (err) {
        const isIframe = err instanceof Error && err.message === "iframe";
        if (source === "system") {
          onError?.(
            isIframe
              ? "Tab audio capture doesn't work in embedded preview. Open the app in a new tab, then try again."
              : "Screen/tab audio capture cancelled or not supported."
          );
          cleanup();
          return;
        }
        // For "both", fall back to mic only
        if (isIframe) {
          onError?.("Tab audio unavailable in preview — using mic only.");
        }
      }

      const recognition = startRecognition();
      if (!recognition) return;

      recognitionRef.current = recognition;
      restartingRef.current = true;

      try {
        recognition.start();
        setIsListening(true);
      } catch {
        onError?.("Failed to start speech recognition.");
        cleanup();
      }
    },
    [cleanup, startRecognition, onError]
  );

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, audioSource, start, stop, interimTranscript };
}
