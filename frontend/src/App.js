import { useState } from "react";
import html2pdf from "html2pdf.js";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("English");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  // TEXT
  const handleSummarize = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/summarize", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ text, language }),
    });
    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  };

  // PDF
  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);

    setLoading(true);
    const res = await fetch("http://localhost:5000/upload-pdf", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setSummary(data.summary);
    setLoading(false);
  };

  // KEYWORDS
  const handleKeywords = async () => {
    const res = await fetch("http://localhost:5000/keywords", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setKeywords(data.keywords);
  };

  // COPY
  const copy = () => navigator.clipboard.writeText(summary);

  // DOWNLOAD PDF
  const downloadPDF = () => {
    const el = document.createElement("div");
    el.innerHTML = `<h2>Summary</h2><p>${summary}</p>`;
    html2pdf().from(el).save("summary.pdf");
  };

  // CHAT
  const uploadForChat = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await fetch("http://localhost:5000/upload-pdf-chat", {
      method: "POST",
      body: formData,
    });
    alert("PDF ready for chat");
  };

  const askQuestion = async () => {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.answer);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-3xl">

        <h1 className="text-3xl font-bold text-center mb-4">
          🧠 AI Summarizer
        </h1>

        {/* LANGUAGE */}
        <select
          className="mb-4 p-2 rounded-lg border w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>English</option>
          <option>Hindi</option>
          <option>Tamil</option>
          <option>Telugu</option>
          <option>Punjabi</option>
          <option>Gujarati</option>
          <option>Marathi</option>
          <option>Bengali</option>
        </select>

        {/* TEXT */}
        <textarea
          className="w-full p-3 border rounded-lg mb-3"
          rows="4"
          placeholder="Enter text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* BUTTONS */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSummarize}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700"
          >
            Summarize
          </button>

          <button
            onClick={handleKeywords}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg w-full hover:bg-yellow-600"
          >
            Keywords
          </button>
        </div>

        {/* PDF */}
        <div className="mb-4">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button
            onClick={handleFileUpload}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700"
          >
            Upload PDF & Summarize
          </button>
        </div>

        {/* OUTPUT */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h2 className="font-semibold mb-2">Summary</h2>

          {loading ? (
            <p>⏳ Processing...</p>
          ) : (
            <p>{summary}</p>
          )}

          {summary && (
            <div className="flex gap-3 mt-3">
              <button onClick={copy} className="bg-green-500 text-white px-3 py-1 rounded">
                Copy
              </button>
              <button onClick={downloadPDF} className="bg-purple-600 text-white px-3 py-1 rounded">
                Download PDF
              </button>
            </div>
          )}
        </div>

        {/* KEYWORDS */}
        {keywords.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h2 className="font-semibold">Keywords</h2>
            <p>{keywords.join(", ")}</p>
          </div>
        )}

        {/* CHAT */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">💬 Chat with PDF</h2>

          <button
            onClick={uploadForChat}
            className="bg-blue-500 text-white px-4 py-2 rounded mb-2 w-full"
          >
            Upload for Chat
          </button>

          <input
            className="w-full p-2 border rounded mb-2"
            placeholder="Ask question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            onClick={askQuestion}
            className="bg-indigo-600 text-white px-4 py-2 rounded w-full"
          >
            Ask
          </button>

          {answer && <p className="mt-2"><b>Answer:</b> {answer}</p>}
        </div>

      </div>
    </div>
  );
}

export default App;