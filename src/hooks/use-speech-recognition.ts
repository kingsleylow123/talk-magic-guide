import { useState, useRef, useCallback, useEffect } from "react";

export type AudioSource = "mic" | "system" | "both";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const restartingRef = useRef(false);

  const cleanup = useCallback(() => {
    restartingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach((t) => t.stop());
      displayStreamRef.current = null;
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
          onTranscript(transcript, true);
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
      // Auto-restart if still supposed to be listening
      if (restartingRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    return recognition;
  }, [language, onTranscript, onError, cleanup]);

  const start = useCallback(
    async (source: AudioSource) => {
      cleanup();
      setAudioSource(source);

      // For system/both: capture tab audio so it plays through speakers and mic picks it up
      if (source === "system" || source === "both") {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // required by some browsers
            audio: true,
          });
          displayStreamRef.current = displayStream;

          // Route system audio to speakers so mic captures it
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          const systemSource = audioContext.createMediaStreamSource(displayStream);
          systemSource.connect(audioContext.destination);

          // Stop video track (we only need audio)
          displayStream.getVideoTracks().forEach((t) => t.stop());

          // Handle user stopping screen share
          displayStream.getAudioTracks().forEach((track) => {
            track.onended = () => {
              cleanup();
            };
          });
        } catch (err) {
          if (source === "system") {
            onError?.("Screen/tab audio capture cancelled or not supported.");
            return;
          }
          // For "both", continue with mic only
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
