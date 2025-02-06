export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }

  // Log the request payload before sending to Alltius
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

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error("❌ Alltius API Error:", response.status, response.statusText, errorDetails);
      return res.status(response.status).json({ error: `API Error: ${response.status} - ${response.statusText}`, details: errorDetails });
    }

    // Parse response as JSON
    const data = await response.json();
    console.log("📥 Full Alltius API Response:", JSON.stringify(data, null, 2)); // ✅ Debug Log

    // Extract AI response
    let aiResponse = data.output || data.response || data.message || "No valid AI response received";

    // If response is missing, log it and return error
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
