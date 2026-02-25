import { useState, useRef, useCallback, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Captures system audio via getDisplayMedia, extracts PCM 16-bit mono at 16 kHz,
 * and sends base64 chunks to ElevenLabs Scribe via sendAudio callback.
 */
function createSystemAudioCapture(
  onChunk: (base64: string) => void,
  onEnded: () => void,
) {
  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let processor: ScriptProcessorNode | null = null;

  const start = async () => {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // Stop video tracks — we only need audio
    stream.getVideoTracks().forEach((t) => t.stop());

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error("No audio track in the shared screen. Make sure to check 'Share audio' when sharing your tab.");
    }

    audioTracks[0].onended = onEnded;

    audioCtx = new AudioContext({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);

    // ScriptProcessorNode for raw PCM access (deprecated but widely supported)
    processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const float32 = e.inputBuffer.getChannelData(0);
      // Convert float32 → int16
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      // Convert to base64
      const bytes = new Uint8Array(int16.buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      onChunk(btoa(binary));
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
  };

  const stop = () => {
    if (processor) {
      processor.disconnect();
      processor = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  };

  return { start, stop };
}

export function useSpeechRecognition({
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>("mic");
  const [interimTranscript, setInterimTranscript] = useState("");

  const activeSourceRef = useRef<AudioSource>("mic");
  const systemCaptureRef = useRef<ReturnType<typeof createSystemAudioCapture> | null>(null);
  const isConnectedRef = useRef(false);

  // Mic scribe — handles salesperson voice via built-in microphone
  const micScribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      setInterimTranscript(data.text);
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim(), true, "salesperson");
        setInterimTranscript("");
      }
    },
  });

  // System scribe — handles prospect voice from Zoom / tab audio
  const systemScribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onPartialTranscript: (data) => {
      // Only show system partial if mic isn't producing one
      if (activeSourceRef.current === "system") {
        setInterimTranscript(data.text);
      }
    },
    onCommittedTranscript: (data) => {
      if (data.text.trim()) {
        onTranscript(data.text.trim(), true, "prospect");
        setInterimTranscript("");
      }
    },
  });

  const cleanup = useCallback(() => {
    isConnectedRef.current = false;

    try { micScribe.disconnect(); } catch {}
    try { systemScribe.disconnect(); } catch {}

    if (systemCaptureRef.current) {
      systemCaptureRef.current.stop();
      systemCaptureRef.current = null;
    }

    setIsListening(false);
    setInterimTranscript("");
  }, [micScribe, systemScribe]);

  const start = useCallback(
    async (source: AudioSource) => {
      cleanup();
      setAudioSource(source);
      activeSourceRef.current = source;

      try {
        // Get tokens from edge function
        const needsTwo = source === "both";
        const { data, error } = await supabase.functions.invoke(
          "elevenlabs-scribe-token",
          { body: { count: needsTwo ? 2 : 1 } }
        );

        if (error || (!data?.token && !data?.tokens)) {
          throw new Error("Failed to get transcription token. Please check your API key.");
        }

        const micToken = needsTwo ? data.tokens[0] : data.token;
        const systemToken = needsTwo ? data.tokens[1] : data.token;

        // Start mic transcription
        if (source === "mic" || source === "both") {
          await micScribe.connect({
            token: micToken,
            microphone: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        }

        // Start system audio transcription (for Zoom / prospect voice)
        if (source === "system" || source === "both") {
          // First connect the scribe session
          await systemScribe.connect({ token: systemToken });

          // Then capture system audio and pipe it
          const capture = createSystemAudioCapture(
            (base64) => {
              try {
                systemScribe.sendAudio(base64);
              } catch {}
            },
            () => {
              // System audio sharing ended
              if (activeSourceRef.current === "system") {
                cleanup();
              }
            }
          );

          systemCaptureRef.current = capture;

          try {
            await capture.start();
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to capture system audio";
            if (source === "system") {
              onError?.(msg);
              cleanup();
              return;
            }
            // "both" mode — continue with mic only
            onError?.("Could not capture tab audio — continuing with microphone only.");
            setAudioSource("mic");
            activeSourceRef.current = "mic";
          }
        }

        isConnectedRef.current = true;
        setIsListening(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to start transcription";
        onError?.(msg);
        cleanup();
      }
    },
    [cleanup, onError, micScribe, systemScribe]
  );

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { isListening, audioSource, start, stop, interimTranscript };
}
