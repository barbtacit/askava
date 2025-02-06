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

  console.log("📤 Sending request to Alltius:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch("https://app.alltius.ai/api/assistant/invoke", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ALLTIUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("📥 Full Alltius API Raw Response:", responseText); // ✅ Debug Log

    // Try to parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("❌ Failed to parse Alltius response as JSON:", error);
      return res.status(500).json({ error: "Invalid JSON response from Alltius", details: responseText });
    }

    console.log("📥 Full Alltius API Parsed Response:", JSON.stringify(data, null, 2));

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