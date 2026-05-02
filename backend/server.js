import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { pipeline } from "@xenova/transformers";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let summarizer = null;
let translator = null;
let pdfTextStore = "";

// 🔥 LOAD MODELS
const loadModels = async () => {
  if (!summarizer) {
    console.log("Loading summarizer...");
    summarizer = await pipeline("summarization", "Xenova/t5-small");
  }

  if (!translator) {
    console.log("Loading translator...");
    translator = await pipeline("translation", "Xenova/nllb-200-distilled-600M");
  }

  console.log("Models ready ✅");
};

// 🔹 SUMMARIZE
const getSummary = async (text) => {
  const output = await summarizer(text, {
    max_length: 200,
    min_length: 80,
  });
  return output?.[0]?.summary_text || "Summary failed";
};

// 🔹 TRANSLATE
const translateText = async (text, lang) => {
  const map = {
    Hindi: "hin_Deva",
    Tamil: "tam_Taml",
    Telugu: "tel_Telu",
    Bengali: "ben_Beng",
    Marathi: "mar_Deva",
    Gujarati: "guj_Gujr",
    Punjabi: "pan_Guru",
    Kannada: "kan_Knda",
    Malayalam: "mal_Mlym",
  };

  if (!map[lang]) return text;

  const out = await translator(text, { tgt_lang: map[lang] });
  return out?.[0]?.translation_text || text;
};

// 🔹 TEXT SUMMARIZATION
app.post("/summarize", async (req, res) => {
  try {
    const { text, language } = req.body;

    await loadModels();

    let clean = text.slice(0, 2000);
    let summary = await getSummary(clean);

    if (language !== "English") {
      summary = await translateText(summary, language);
    }

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Text failed" });
  }
});

// 🔹 PDF SUMMARIZATION
app.post("/upload-pdf", upload.single("file"), async (req, res) => {
  try {
    await loadModels();

    const { language } = req.body;

    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(fs.readFileSync(req.file.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";

    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ");
    }

    let summary = await getSummary(text.slice(0, 2000));

    if (language !== "English") {
      summary = await translateText(summary, language);
    }

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF failed" });
  }
});

// 🔹 KEYWORDS
app.post("/keywords", (req, res) => {
  const { text } = req.body;

  const words = text.toLowerCase().split(/\W+/);

  const freq = {};
  words.forEach(w => {
    if (w.length > 3) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(x => x[0]);

  res.json({ keywords });
});

// 🔹 CHAT WITH PDF
app.post("/upload-pdf-chat", upload.single("file"), async (req, res) => {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const data = new Uint8Array(fs.readFileSync(req.file.path));
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let text = "";

    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ");
    }

    pdfTextStore = text;

    res.json({ message: "PDF ready for chat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat PDF failed" });
  }
});

// 🔹 ASK QUESTION
app.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!pdfTextStore) {
      return res.json({ answer: "Upload PDF first" });
    }

    await loadModels();

    const context = pdfTextStore.slice(0, 2000);

    const prompt = `Answer based on text:\n${context}\n\nQ: ${question}`;

    const output = await summarizer(prompt, {
      max_length: 150,
      min_length: 50,
    });

    res.json({
      answer: output?.[0]?.summary_text || "No answer",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// 🚀 START SERVER
const start = async () => {
  await loadModels();

  app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
  });
};

start();