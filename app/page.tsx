"use client";
import { useState } from "react";
import { fetchRFPs } from "@/lib/airtable"; // ✅ Import Airtable function

export default function Home() {
  const [rfpText, setRfpText] = useState("");
  const [elements, setElements] = useState([]);
  const [responses, setResponses] = useState({});

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
  
    // Generate AI responses for each element using Alltius
    const responses = {};
    for (const [index, element] of parsedElements.entries()) {
      try {
        console.log(`Sending to Alltius: ${element}`); // Debug Log
        const aiResponse = await fetch("/api/alltius-generate-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `Provide a structured response for this RFP requirement: ${element}` }),
        });
  
        const aiData = await aiResponse.json();
        console.log(`AI Response for: ${element} → ${aiData.response}`); // Debug Log
        responses[index] = aiData.response || "AI response failed.";
      } catch (error) {
        console.error("AI Response Error:", error);
        responses[index] = "AI response failed.";
      }
    }
  
    // Set responses from Alltius, overriding Airtable responses
    setResponses(responses);
  };  
  
  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">EPI - RFP Processing</h1>
      <button
  className="bg-green-600 text-white px-4 py-2 rounded mb-4"
  onClick={() => window.open("https://airtable.com/appO645FMzwrtH9G6/pagAJu6rvcXRfL9as/form", "_blank")}
>
  Submit RFP
</button>
      <textarea
        className="w-full p-3 border rounded mb-4"
        rows="5"
        placeholder="Paste RFP content here..."
        value={rfpText}
        onChange={(e) => setRfpText(e.target.value)}
      ></textarea>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        Process RFP
      </button>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">RFP Elements</h2>
          <ul>
            {elements.map((item, index) => (
              <li key={index} className="border-b p-2">{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">Responses</h2>
          {elements.map((item, index) => (
            <div key={index} className="mb-3">
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder={`Response for: ${item}`}
                value={responses[index]}
                onChange={(e) => setResponses(prev => ({ ...prev, [index]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

