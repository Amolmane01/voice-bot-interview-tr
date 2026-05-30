import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);
  const conversationRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsRecording(true);
      
      recognitionRef.current.onresult = async (event) => {
        const text = event.results[0][0].transcript.trim();
        if (text) {
          addMessage('user', text);
          await handleSendToAI(text);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => setIsRecording(false);
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported. Please use Chrome.");
      return;
    }
    recognitionRef.current.start();
  };

  // ==================== UPDATED FOR DEPLOYMENT ====================
  const handleSendToAI = async (text) => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
      
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Server error');

      addMessage('bot', data.reply);
      speak(data.reply);

    } catch (error) {
      console.error("Full Error:", error);
      addMessage('bot', "Sorry, something went wrong. Please check if backend is running.");
    }
    setLoading(false);
  };
  // ================================================================

  const speak = (text) => {
    const synth = window.speechSynthesis;
    if (synth) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1;
      synth.speak(utterance);
    }
  };

  // Auto scroll
  useEffect(() => {
    conversationRef.current?.scrollTo({
      top: conversationRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, loading]);

  return (
    <div className="app-container">
      <header className="header">
        <h1>🤖 Hi, I'm the AI Candidate Bot!</h1>
        <p>I'm here to interview for the 100x AI Agent Team. Ask me anything!</p>
      </header>

      <main className="main-content">
        <div className="conversation-box" ref={conversationRef}>
          {messages.length === 0 && (
            <div className="welcome">
              Click the microphone below and start asking questions!
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong>
              <p>{msg.text}</p>
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <strong>Bot:</strong>
              <p>Thinking...</p>
            </div>
          )}
        </div>

        <button 
          className={`mic-button ${isRecording ? 'recording' : ''}`} 
          onClick={startRecording}
          disabled={isRecording || loading}
        >
          {isRecording ? "🎤 Listening..." : "🎤 Click to Speak"}
        </button>
      </main>
    </div>
  );
}

export default App;