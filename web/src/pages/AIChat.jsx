import { useState, useRef, useEffect } from "react";
import api from "../api/axios";

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your HCM Lite AI Assistant. Ask me about attendance stats, leave balances, employee counts, or HR policies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await api.post("/ai/chat", {
        message: userMsg.content,
        history,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err.response?.data?.message ||
            "Sorry, I couldn't process that. Check GROQ_API_KEY in .env",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>AI Assistant 🤖</h1>
      </div>

      <div className="card chat-box">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">Thinking...</div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-row" onSubmit={send}>
          <input
            className="form-control"
            placeholder="Ask about HR stats, leaves, attendance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
