import { useState } from "react";
import Recorder from "./Recorder";

export default function App() {
  const [text, setText] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <Recorder onTranscript={setText} />
    </div>
  );
}
