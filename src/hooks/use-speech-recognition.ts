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
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartingRef = useRef(false);
  const activeSourceRef = useRef<AudioSource>("mic");

  const determineSpeaker = useCallback((): Speaker => {
    // Stable fallback behavior: only system-only mode maps to prospect.
    // Mic and both map to salesperson to avoid fragile diarization logic.
    return activeSourceRef.current === "system" ? "prospect" : "salesperson";
  }, []);

  const cleanup = useCallback(() => {
    restartingRef.current = false;

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }

    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((track) => track.stop());
      displayStreamRef.current = null;
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
          onTranscript(transcript, true, determineSpeaker());
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted" || event.error === "no-speech") return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onError?.("Microphone access denied. Please allow microphone permissions and try again.");
        cleanup();
        return;
      }

      onError?.(`Speech recognition error: ${event.error}`);
      cleanup();
    };

    recognition.onend = () => {
      if (!restartingRef.current) return;

      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!restartingRef.current) return;
        try {
          recognition.start();
        } catch {
          cleanup();
        }
      }, 250);
    };

    return recognition;
  }, [language, onTranscript, onError, cleanup, determineSpeaker]);

  const start = useCallback(
    async (source: AudioSource) => {
      cleanup();

      setAudioSource(source);
      activeSourceRef.current = source;

      // Preflight microphone permission for any mode that includes mic input.
      // This restores reliable behavior on browsers where SpeechRecognition
      // does not consistently trigger the permission prompt on its own.
      if (source === "mic" || source === "both") {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream.getTracks().forEach((track) => track.stop());
        } catch {
          if (window.self !== window.top) {
            onError?.("Microphone access is blocked in embedded preview. Open the app in a new tab and allow mic access.");
          } else {
            onError?.("Microphone access denied. Please allow microphone permissions and try again.");
          }
          cleanup();
          return;
        }
      }

      // Keep previous UX for system/both selection, but never block mic transcription.
      if (source === "system" || source === "both") {
        const inIframe = window.self !== window.top;

        if (inIframe) {
          if (source === "system") {
            onError?.("Tab audio capture is not available in embedded preview. Open the app in a new tab.");
            cleanup();
            return;
          }

          onError?.("Tab audio is unavailable in preview — continuing with microphone transcription.");
          setAudioSource("mic");
          activeSourceRef.current = "mic";
        } else {
          try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            });
            displayStreamRef.current = displayStream;

            // We only need audio if available.
            displayStream.getVideoTracks().forEach((track) => track.stop());
            displayStream.getAudioTracks().forEach((track) => {
              track.onended = () => cleanup();
            });
          } catch {
            if (source === "system") {
              onError?.("Screen/tab audio capture cancelled or not supported.");
              cleanup();
              return;
            }

            onError?.("Could not access tab audio — continuing with microphone transcription.");
            setAudioSource("mic");
            activeSourceRef.current = "mic";
          }
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
    [cleanup, onError, startRecognition]
  );

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, audioSource, start, stop, interimTranscript };
}

