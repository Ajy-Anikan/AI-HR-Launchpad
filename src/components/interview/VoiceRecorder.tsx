import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Extend Window for webkitSpeechRecognition
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export default function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [liveText, setLiveText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const fullTextRef = useRef("");

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
    return () => stopRecording();
  }, []);

  const startRecording = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      // Start audio context for waveform visualization
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 128);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Start speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      fullTextRef.current = "";
      setLiveText("");

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let finalText = fullTextRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + " ";
            fullTextRef.current = finalText;
          } else {
            interim += result[0].transcript;
          }
        }

        const display = (finalText + interim).trim();
        setLiveText(display);
        onTranscript(display);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        if (e.error !== "aborted") {
          stopRecording();
        }
      };

      recognition.onend = () => {
        // Auto-restart if still recording (browser may stop it)
        if (isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [onTranscript, isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  if (!isSupported) {
    return (
      <div className="text-center p-4 rounded-lg bg-muted/50 border">
        <MicOff className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Voice input is not supported in this browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  // Waveform bars
  const bars = 12;

  return (
    <div className="space-y-4">
      {/* Waveform visualization */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 h-16 bg-muted/30 rounded-lg border">
          {Array.from({ length: bars }).map((_, i) => {
            const offset = Math.sin((i / bars) * Math.PI) * 0.5 + 0.5;
            const height = Math.max(4, audioLevel * 48 * offset + Math.random() * 8);
            return (
              <div
                key={i}
                className="w-1.5 rounded-full bg-primary transition-all duration-75"
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      )}

      {/* Live transcription preview */}
      {isRecording && liveText && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 max-h-32 overflow-y-auto">
          <p className="text-xs font-medium text-primary mb-1">Live Transcription</p>
          <p className="text-sm">{liveText}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={disabled}
            className="gradient-primary border-0 gap-2"
            size="lg"
          >
            <Mic className="h-5 w-5" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="gap-2"
            size="lg"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
      </div>

      {isRecording && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          🎙️ Listening... Speak your answer clearly
        </p>
      )}
    </div>
  );
}
