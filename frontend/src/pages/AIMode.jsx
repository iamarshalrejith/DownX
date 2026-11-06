
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AICharacter from "../components/ai-companion/AICharacter";
import { sendBuddyMessage } from "../api/aiService";

const AIMode = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const studentId = user?._id || user?.id;
  const token = user?.token;

  const [characterState, setCharacterState] = useState("idle");
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: `Hello ${user?.name || "friend"}! I'm your learning buddy. What shall we learn today?`,
    },
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const characterMessages = {
    idle: "Hello! I'm your learning buddy. Let's learn together!",
    listening: "I'm listening. Take your time!",
    thinking: "Hmm... Let me think!",
    speaking: "That's wonderful! Let's learn something new!",
    celebrating: "Amazing! You did it! I'm proud of you!",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages, loading]);

  // Stop voice features when leaving this page.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Text-to-speech: Buddy reads a reply aloud.
  const speakText = (text) => {
    if (!("speechSynthesis" in window)) {
      setError("Voice playback is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setCharacterState("speaking");
    };

    utterance.onend = () => {
      setCharacterState("idle");
    };

    utterance.onerror = () => {
      setCharacterState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-text: Convert the student's speech into text.
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or type your message."
      );
      return;
    }

    if (loading || isListening) return;

    setError("");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setCharacterState("listening");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((previous) =>
        previous ? `${previous} ${transcript}` : transcript
      );
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError("I couldn't hear you clearly. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setCharacterState("idle");
    };

    try {
      recognition.start();
    } catch {
      setError("Could not start the microphone. Please try again.");
      setIsListening(false);
      setCharacterState("idle");
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    if (!token || !studentId) {
      setError("Please log in again to talk with your buddy.");
      return;
    }

    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();

    setError("");
    setInput("");

    setChatMessages((previous) => [
      ...previous,
      { role: "user", content: message },
    ]);

    setCharacterState("thinking");
    setLoading(true);

    try {
      const response = await sendBuddyMessage({
        studentId,
        conversationId,
        message,
        token,
      });

      setConversationId(response.conversationId);

      setChatMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.reply,
        },
      ]);

      setCharacterState("speaking");
    } catch (err) {
      setError(err.message);
      setCharacterState("idle");
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();

    setConversationId(null);
    setChatMessages([
      {
        role: "assistant",
        content: "Hello again! What would you like to learn today?",
      },
    ]);
    setInput("");
    setError("");
    setCharacterState("idle");
  };

  return (
    <main className="min-h-screen bg-bg px-5 py-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex justify-between items-center">
          <button
            onClick={() => navigate("/student-dashboard")}
            className="rounded-xl bg-white px-4 py-3 font-bold"
          >
            ← Back
          </button>

          <span className="font-extrabold text-brand">
            DownX AI Buddy
          </span>
        </header>

        <section className="text-center mt-8">
          <h1 className="text-3xl font-extrabold">
            Let's Learn Together!
          </h1>

          <p className="text-ink-soft mt-2">
            Your friendly learning companion is here.
          </p>
        </section>

        <AICharacter state={characterState} />

        <section className="bg-white rounded-3xl p-5 shadow-sm text-center mt-4">
          <h2 className="text-xl font-extrabold text-brand">
            {characterMessages[characterState]}
          </h2>
        </section>

        <section className="bg-white rounded-3xl p-5 shadow-sm mt-5">
          <h2 className="font-extrabold text-brand mb-4">
            Chat with Buddy
          </h2>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-indigo-50 text-ink rounded-bl-sm"
                  }`}
                >
                  <p className="text-xs font-bold mb-1 opacity-70">
                    {message.role === "user" ? "You" : "Buddy"}
                  </p>

                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>

                  {message.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speakText(message.content)}
                      className="mt-3 text-sm font-bold text-brand underline"
                    >
                      🔊 Listen
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-indigo-50 rounded-2xl px-4 py-3">
                  <p className="text-ink-soft animate-pulse">
                    Buddy is thinking...
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p role="alert" className="text-red-500 text-sm mt-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 mt-5">
            <input
              type="text"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setCharacterState("listening");
              }}
              placeholder="Type your message..."
              maxLength={2000}
              disabled={loading}
              className="flex-1 min-w-0 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-brand text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className="bg-accent text-white rounded-xl p-3 font-bold disabled:opacity-50"
            >
              {isListening ? "⏹ Stop Listening" : "🎤 Speak to Buddy"}
            </button>

            <button
              type="button"
              onClick={() => window.speechSynthesis?.cancel()}
              className="bg-gray-100 text-ink rounded-xl p-3 font-bold"
            >
              🔇 Stop Voice
            </button>
          </div>

          <button
            onClick={startNewConversation}
            disabled={loading}
            className="w-full mt-3 border border-border rounded-xl p-3 font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            Start a New Conversation
          </button>
        </section>
      </div>
    </main>
  );
};

export default AIMode;
