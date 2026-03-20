import { useState, useRef, useCallback, useEffect } from "react";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export const useSpeechRecognition = ({ lang = "en-US" } = {}) => {
  const [transcript,  setTranscript]  = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error,       setError]       = useState(null);
  const recRef = useRef(null);

  const isSupported = Boolean(SR);

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang             = lang;
    rec.continuous       = false;
    rec.interimResults   = false;
    rec.maxAlternatives  = 1;

    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      setTranscript(text);
    };
    rec.onerror = (e) => { setError(e.error); setIsListening(false); };
    rec.onend   = ()  => setIsListening(false);

    recRef.current = rec;
    return () => rec.abort();
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recRef.current || isListening) return;
    setTranscript("");
    setError(null);
    try { recRef.current.start(); setIsListening(true); } catch { /* already started */ }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recRef.current || !isListening) return;
    recRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => setTranscript(""), []);

  return { transcript, isListening, isSupported, error, startListening, stopListening, resetTranscript };
};