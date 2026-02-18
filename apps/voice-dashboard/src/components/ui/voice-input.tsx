"use client";

import { useState, useCallback, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";
import { Button } from "./button";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function VoiceInput({ onTranscript, placeholder = "Premi il microfono e parla...", className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition non supportato");
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = "it-IT";
    
    recognizer.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        const newTranscript = transcript + finalTranscript;
        setTranscript(newTranscript);
        onTranscript(newTranscript);
      }
    };
    
    recognizer.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Errore: ${event.error}`);
      setIsListening(false);
    };
    
    recognizer.onend = () => setIsListening(false);
    
    setRecognition(recognizer);
    
    return () => recognizer.stop();
  }, [onTranscript, transcript]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      setError("Microfono non disponibile");
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognition.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={toggleListening}
          className={isListening ? "animate-pulse" : ""}
        >
          {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1">
          {isListening ? (
            <span className="text-sm text-green-600 font-medium">Sto ascoltando... parla ora</span>
          ) : transcript ? (
            <span className="text-sm text-gray-700">{transcript}</span>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
      </div>
      
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      
      {transcript && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setTranscript("");
            onTranscript("");
          }}
        >
          Cancella
        </Button>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
