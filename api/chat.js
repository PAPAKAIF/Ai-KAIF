

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is missing."
      });
    }

    const { message, history = [] } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 10000
    ) {
      return res.status(400).json({
        error: "Please enter a valid message."
      });
    }

    const previousMessages = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            typeof item.text === "string" &&
            ["user", "bot"].includes(item.type)
          )
          .slice(-20)
          .map(item => ({
            role: item.type === "user" ? "user" : "model",
            parts: [{ text: item.text.slice(0, 10000) }]
          }))
      : [];

    const contents = [
      ...previousMessages,
      {
        role: "user",
        parts: [{ text: message.trim() }]
      }
    ];

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "You are KAIF AI, a helpful, friendly and intelligent AI assistant. Answer accurately. Support Bengali and English. Use previous conversation context when relevant."
          }]
        },
        contents
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data.error?.message);

      return res.status(502).json({
        error: data.error?.message || "Gemini API error."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n");

    return res.status(200).json({
      reply: answer || "No answer received."
    });

  } catch (error) {
    console.error("KAIF AI error:", error.message);

    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
}
