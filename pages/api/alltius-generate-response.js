import { globalFetch } from "@/utils/globalFetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }

  console.log("📤 Using API Key (first 10 chars):", process.env.ALLTIUS_API_KEY?.slice(0, 10) + "********");

  const requestBody = {
    assistant_id: process.env.ALLTIUS_ASSISTANT_ID,
    user_id: "test_user",
    input: prompt,
  };

  try {
    console.log("📡 Sending request to Alltius...");

    const alltiusURL = "https://app.alltius.ai/api/assistant/invoke";
    const data = await globalFetch(alltiusURL, "POST", requestBody, {
      Authorization: `Bearer ${process.env.ALLTIUS_API_KEY}`,
    });

    console.log("📤 Using API Key (first 10 chars):", process.env.ALLTIUS_API_KEY?.slice(0, 10) + "********");
    console.log("📤 Sent Authorization Header:", `Bearer ${process.env.ALLTIUS_API_KEY?.slice(0, 10)}********`);


    let aiResponse = data.output || data.response || data.message || "No valid AI response received";
    if (!aiResponse || aiResponse === "No valid AI response received") {
      console.error("❌ Unexpected API response format:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Unexpected response format", details: data });
    }

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("🚨 Alltius API Error:", error);
    res.status(500).json({ error: "Failed to generate response", details: error.message });
  }
}
