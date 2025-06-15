import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { toast } from 'sonner';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  className?: string;
  language?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  isDisabled = false, 
  className = "",
  language = "de-DE"
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("🎤 Voice recognition started");
        setIsListening(true);
        toast.success("Voice recognition activated - speak now!");
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update local transcript for preview
        setTranscript(finalTranscript + interimTranscript);

        // Send final transcript to parent
        if (finalTranscript) {
          console.log("📝 Final transcript:", finalTranscript);
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error("🚫 Speech recognition error:", event.error);
        setIsListening(false);
        setTranscript("");
        
        switch (event.error) {
          case 'no-speech':
            toast.error("No speech detected. Please try again.");
            break;
          case 'audio-capture':
            toast.error("Microphone access denied or unavailable.");
            break;
          case 'not-allowed':
            toast.error("Microphone permission denied. Please allow microphone access.");
            break;
          case 'network':
            toast.error("Network error during speech recognition.");
            break;
          default:
            toast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log("🎤 Voice recognition ended");
        setIsListening(false);
        setTranscript("");
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn("🚫 Speech Recognition not supported in this browser");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript]);

  const startListening = async () => {
    if (!recognitionRef.current || isDisabled) return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript("");
      recognitionRef.current.start();
    } catch (error) {
      console.error("Microphone access denied:", error);
      toast.error("Microphone access denied. Please allow access in your browser settings.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={`${className} opacity-50`}
        title="Speech recognition is not supported in this browser"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={isDisabled}
        className={`${className} ${isListening ? 'animate-pulse' : ''}`}
        title={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <>
            <Square className="h-4 w-4 mr-1" />
            Stop
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-1" />
            Speak
          </>
        )}
      </Button>
      
      {/* Live transcript preview */}
      {isListening && transcript && (
        <div className="flex-1 text-xs text-gray-600 italic truncate max-w-xs">
          "{transcript}..."
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 