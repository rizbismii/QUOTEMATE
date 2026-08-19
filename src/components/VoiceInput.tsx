"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "./Button";
import { Textarea } from "./Field";

type SpeechRec = {
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  lang: string;
  interimResults: boolean;
  continuous: boolean;
};

export function VoiceInput({
  value,
  onChange,
  country,
}: {
  value: string;
  onChange: (value: string) => void;
  country: "NZ" | "AU";
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const rec = useRef<SpeechRec | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const Ctor = (window as Window & {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const instance = new Ctor();
    instance.lang = country === "NZ" ? "en-NZ" : "en-AU";
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onChangeRef.current(transcript);
    };
    instance.onend = () => setListening(false);
    rec.current = instance;
  }, [country]);

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Say or type: “Replace 6 metres of fencing”'
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={listening ? "danger" : "dark"}
          onClick={() => {
            if (!rec.current) return;
            if (listening) {
              rec.current.stop();
              setListening(false);
            } else {
              rec.current.start();
              setListening(true);
            }
          }}
          disabled={!supported}
        >
          {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Stop" : "Hold to talk"}
        </Button>
        <p className="text-xs text-steel">
          {supported
            ? "Uses your phone mic. You can also type."
            : "Voice isn’t available in this browser — type the job instead."}
        </p>
      </div>
    </div>
  );
}
