// Import React hooks:
// useRef  → to access DOM elements (video, canvas)
// useState → to manage component state
import { useRef, useState } from "react";

// Import classic desktop CSS
import "./index.css";

// 🔑 Gemini API key
const API_KEY = "AIzaSyClHsogOH6u7fBA2uWDDfWCCzqRBzXmUmI";

// Main React component
function App() {

  // Camera video reference
  const videoRef = useRef(null);

  // Canvas reference
  const canvasRef = useRef(null);

  // State variables (UNCHANGED)
  const [image, setImage] = useState(null);
  const [testText, setTestText] = useState(null);
  const [testVision, setTestVision] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingVision, setLoadingVision] = useState(false);

  // ================================
  // 🎥 START CAMERA
  // ================================
  const startCamera = async () => {
    setImage(null);
    setTestVision(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch {
      alert("Cannot use camera. Check permissions.");
    }
  };

  // ==================================
  // 📸 CAPTURE IMAGE & ANALYZE
  // ==================================
  const captureAndTestVision = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      alert("No video or canvas element!");
      return;
    }

    canvas.width = 320;
    canvas.height = 240;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 320, 240);

    const img = canvas.toDataURL("image/jpeg", 0.9);
    setImage(img);

    const base64 = img.split(",")[1];
    testGeminiVision(base64);
  };

  // ==========================
  // 📝 GEMINI TEXT TEST
  // ==========================
  const testGeminiText = async () => {
    setLoadingText(true);
    setTestText(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: "Say: This key works for text." }] }
            ]
          })
        }
      );

      const data = await res.json();
      setTestText(data);
    } catch (err) {
      setTestText({ error: err.message });
    }

    setLoadingText(false);
  };

  // ==========================
  // 👁️ GEMINI VISION
  // ==========================
  const testGeminiVision = async (base64Data) => {
    setLoadingVision(true);
    setTestVision(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Describe this image in three to 2 or 3 sentences. And Use case of that one also."
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64Data
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await res.json();
      setTestVision(data);

      const spoken = extractVisionDescription(data);
      if (spoken && !data.error) speakText(spoken);

    } catch (err) {
      setTestVision({ error: err.message });
    }

    setLoadingVision(false);
  };

  // ==========================
  // 🔊 TEXT TO SPEECH
  // ==========================
  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  // ==========================
  // 🧠 EXTRACT RESPONSE
  // ==========================
  function extractVisionDescription(resp) {
    return resp?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  // ==========================
  // 🎨 UI
  // ==========================
  return (
    <div className="app">
      <header className="header">Snap & Speak</header>

      <main className="container">

        {/* LEFT PANEL */}
        <section className="card">
          {/* <button onClick={testGeminiText} disabled={loadingText} className="btn">
            {loadingText ? "Loading..." : "Test Text API"}
          </button> */}

          {testText && (
            <pre className="code-block">
              {JSON.stringify(testText, null, 2)}
            </pre>
          )}

          <button onClick={startCamera} className="btn primary">
            Start Camera
          </button>

          <video ref={videoRef} autoPlay />

          <canvas ref={canvasRef} className="hidden" />

          <button
            onClick={captureAndTestVision}
            disabled={loadingVision}
            className="btn"
          >
            {loadingVision ? "Analyzing..." : "Capture & Analyze"}
          </button>
        </section>

        {/* RIGHT PANEL */}
        <section className="card center">
          {image && <img src={image} alt="Captured" className="preview" />}

          {testVision && (
            <>
              <p className="description">
                {extractVisionDescription(testVision) || "No valid output"}
              </p>
            </>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
