import { useRef, useState } from "react";
import "./Record.css";

export default function VoiceRecorder() {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioURL, setAudioURL] = useState(null);
  const [error, setError] = useState("");

  const toggleRecording = async () => {
    if (!recording) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.start();
        setRecording(true);
        setError("");
        console.log("Recording started...");
      } catch (err) {
        console.error("Mic access error:", err);
        setError("Microphone access denied or unavailable.");
      }
    } else {
      // Stop recording
      setRecording(false);
      if (!mediaRecorderRef.current) {
        setError("MediaRecorder not initialized.");
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        try {
          console.log("Sending audio to Deepgram...");
          const response = await fetch(
            "https://api.deepgram.com/v1/listen?model=nova-2",
            {
              method: "POST",
              headers: {
                Authorization: `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
                "Content-Type": "audio/webm",
              },
              body: audioBlob,
            }
          );

          const data = await response.json();
          console.log("Deepgram response:", data);

          const text =
            data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
          setTranscript(text);
        } catch (err) {
          console.error("Deepgram error:", err);
          setError("Failed to process audio. Check your API key or audio format.");
        }
      };

      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", fontFamily: "Arial" }}>
      <h1>VoiceToTextRecorder</h1>
      <button
        onClick={toggleRecording}
        style={{
          padding: "14px 20px",
          fontSize: "16px",
          backgroundColor: recording ? "red" : "green",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {recording ? "Recording..." : "Start/Stop Recording"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {transcript && (
        <div style={{ marginTop: "20px" }}>
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}

      {audioURL && (
        <div style={{ marginTop: "20px" }}>
          <h3>Playback:</h3>
          <audio controls src={audioURL}></audio>
          <br />
          <a href={audioURL} download="voice_recording.webm">
            <button
              style={{
                padding: "10px 16px",
                marginTop: "10px",
                fontSize: "14px",
                borderRadius: "6px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Download Audio
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
