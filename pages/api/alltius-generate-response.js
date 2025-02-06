export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests are allowed" });
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
  
      const data = await response.json();
      console.log("Full Alltius API Response:", data);
  
      // Ensure there's always a response, even if the AI doesn't know the answer
      const aiResponse = data.output || 
        "I could not find any relevant information to respond to this question. I am still learning and becoming better at helping you. Please reach out to our support team for immediate assistance or clarification.";
  
      res.status(200).json({ response: aiResponse });
    } catch (error) {
      console.error("Alltius API Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  }
  