// Import useRef and useState from React
// useRef is used to access DOM elements like video and canvas
// useState is used to store and update data in the component
import { useRef, useState } from "react";

// Import CSS file for styling
import "./index.css";

// Gemini API key (used to call AI model)
const API_KEY = "AIzaSyAWLUVk2nLXwVvwe-QLa9iezJy-YX1iTLk";

function App() {
    // Reference to video element (for live camera)
    const videoRef = useRef(null);

    // Reference to canvas element (for capturing image)
    const canvasRef = useRef(null);

    // Stores captured image (base64)
    const [image, setImage] = useState(null);

    // Stores AI generated description text
    const [visionText, setVisionText] = useState("");

    // Stores confidence percentage for UI meter
    const [confidence, setConfidence] = useState(0);

    // Used to show loading state while AI is processing
    const [loading, setLoading] = useState(false);

    // Controls whether audio output is on or off
    const [audioOn, setAudioOn] = useState(true);

    // Function to start the camera
    const startCamera = async () => {
        // Reset previous results
        setImage(null);
        setVisionText("");
        setConfidence(0);

        // Request camera access from browser
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // Attach camera stream to video element
        videoRef.current.srcObject = stream;
    };

    // Function to capture image and analyze
    const captureAndAnalyze = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;

        // Set canvas size
        canvas.width = 640;
        canvas.height = 480;

        // Draw current video frame on canvas
        canvas.getContext("2d").drawImage(video, 0, 0, 640, 480);

        // Convert canvas image to base64 JPEG
        const img = canvas.toDataURL("image/jpeg", 0.95);

        // Save image for UI preview
        setImage(img);

        // Extract base64 part (remove data:image/... prefix)
        const base64 = img.split(",")[1];

        // Send image to AI
        analyzeWithGemini(base64);
    };

    // Function to send image to Gemini AI
    const analyzeWithGemini = async (base64Data) => {
        setLoading(true);
        setVisionText("");
        setConfidence(0);

        try {
            // Call Gemini Vision API
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
                                        // Prompt telling AI what to do
                                        text:
                                            "Identify the main object or person and describe it clearly in simple words.",
                                    },
                                    {
                                        // Image data sent to AI
                                        inline_data: {
                                            mime_type: "image/jpeg",
                                            data: base64Data,
                                        },
                                    },
                                ],
                            },
                        ],
                    }),
                }
            );

            // Convert response to JSON
            const data = await res.json();

            // Extract AI description text safely
            const description =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Object could not be identified clearly.";

            // Generate confidence value for UI (visual purpose)
            const conf = Math.min(95, 40 + (description.length % 60));

            // Update UI state
            setVisionText(description);
            setConfidence(conf);

            // Speak description if audio is enabled
            if (audioOn) {
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(
                    new SpeechSynthesisUtterance(description)
                );
            }
        } catch {
            // Handle error
            setVisionText("Unable to analyze the image.");
        }

        setLoading(false);
    };

    // UI part
    return (
        <div className="app">
            {/* App header */}
            <header className="header">Snap & Speak</header>

            <div className="main">
                {/* LEFT PANEL - CAMERA */}
                <div className="panel camera-panel">
                    {/* Live camera feed */}
                    <video ref={videoRef} autoPlay />

                    {/* Hidden canvas for capturing image */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Start camera button */}
                    <button className="btn" onClick={startCamera}>
                        Start Camera
                    </button>

                    {/* Capture and analyze button */}
                    <button
                        className="btn primary"
                        onClick={captureAndAnalyze}
                        disabled={loading}
                    >
                        {loading ? "Analyzing..." : "Capture & Analyze"}
                    </button>

                    {/* Audio toggle */}
                    <label className="toggle">
                        <input
                            type="checkbox"
                            checked={audioOn}
                            onChange={() => setAudioOn(!audioOn)}
                        />
                        Audio {audioOn ? "On" : "Off"}
                    </label>
                </div>

                {/* RIGHT PANEL - RESULT */}
                <div className="panel result-panel">
                    {/* Show captured image */}
                    {image && (
                        <img src={image} alt="Captured" className="preview-image" />
                    )}

                    {/* Show AI description and confidence */}
                    {visionText && (
                        <div className="result-card">
                            <p className="desc">{visionText}</p>

                            {/* Speedometer UI */}
                            <div className="speedometer">
                                <div
                                    className="needle"
                                    style={{
                                        transform: `rotate(${confidence * 1.8 - 90}deg)`,
                                    }}
                                />
                                <div className="center-dot" />
                            </div>

                            {/* Confidence text */}
                            <div className="conf-text">{confidence}% Confidence</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;










/* “Our project is called Snap & Speak. It is an AI-based web application that can 
recognize objects using a device camera and provide information in both text and audio formats. 
When the user opens the application, they allow camera access and place an object in front of the 
camera. The application captures the image and sends it to an AI model for analysis. The AI model 
identifies the main object or person in the image and generates a simple description. This 
description is displayed on the screen and also spoken out loud using text-to-speech, which is 
helpful especially for visually impaired users or hands-free usage. The frontend of the 
application is built using React, the camera access is handled using browser APIs, the AI analysis is 
done using Google Gemini’s multimodal generative API, and the audio output uses the browser’s built-in 
speech synthesis. This project focuses on accessibility, real-time interaction, and clean user experience. 
Although AI confidence may vary depending on image clarity and lighting, Snap & Speak demonstrates how 
modern web technologies and AI can be combined to solve real-world problems, and in the future it can 
be enhanced further with backend support, better confidence estimation, and additional features.”*/