const handleSubmit = async () => {
  console.log("Fetching the latest RFP from Airtable...");

  // Fetch RFPs from Airtable API
  const response = await fetch("/api/fetch-rfps");
  const data = await response.json();

  if (!data || data.length === 0) {
    alert("No RFPs found! Please add one first.");
    return;
  }

  const latestRFP = data[data.length - 1];

  if (!latestRFP || !latestRFP.rfp_text) {
    alert("The latest RFP is missing text data.");
    return;
  }

  const parsedElements = latestRFP.rfp_text.split("\n").filter(line => line.trim() !== "");
  setElements(parsedElements);

  const responses = {};
  for (const [index, element] of parsedElements.entries()) {
    try {
      const aiResponse = await fetch("/api/alltius-generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Provide a structured response for this RFP requirement: ${element}` }),
      });

      const aiData = await aiResponse.json();
      responses[index] = aiData.response || "AI response failed.";
    } catch (error) {
      console.error("AI Response Error:", error);
      responses[index] = "AI response failed.";
    }
  }

  setResponses(responses);
};
