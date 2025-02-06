export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }

  try {
    const response = await fetch("https://app.alltius.ai/api/assistant/invoke", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.ALLTIUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant_id: process.env.ALLTIUS_ASSISTANT_ID,
        user_id: "test_user",
        input: prompt,
      }),
    });

    // Parse response as JSON
    const data = await response.json();
    console.log("🔍 Full Alltius API Response:", JSON.stringify(data, null, 2)); // ✅ Debug Log

    // Check if response contains expected structure
    let aiResponse = "No valid AI response received"; // Default fallback
    if (data && data.output) {
      aiResponse = data.output;
    } else if (data.response) { 
      // Some APIs return "response" instead of "output"
      aiResponse = data.response;
    } else if (data.message) { 
      // Some APIs return "message" in case of success
      aiResponse = data.message;
    }

    // If the response is still missing, return the raw data for debugging
    if (!aiResponse || aiResponse === "No valid AI response received") {
      console.error("❌ Unexpected API response format:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: "Unexpected response format", details: data });
    }

    res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("🚨 Alltius API Error:", error);

    let errorMessage = "Failed to generate response";
    if (error.response) {
      // If API response is available, include status and details
      errorMessage = `API Error: ${error.response.status} - ${error.response.statusText}`;
    }

    res.status(500).json({ error: errorMessage });
  }
}
