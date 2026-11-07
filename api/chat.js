
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

    const { message } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 10000
    ) {
      return res.status(400).json({
        error: "Please enter a valid message."
      });
    }

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
            text: "You are KAIF AI, a helpful, friendly and intelligent AI assistant. Answer accurately. Support Bengali and English."
          }]
        },
        contents: [{
          role: "user",
          parts: [{ text: message.trim() }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API status:", response.status);
      console.error("Gemini API error:", data.error?.message);

      return res.status(502).json({
        error: "Gemini API error: " +
          (data.error?.message || "Please try again.")
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
