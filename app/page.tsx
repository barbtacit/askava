"use client";
import { useState } from "react";
import { fetchRFPs } from "@/lib/airtable"; // ✅ Import Airtable function

export default function Home() {
  const [rfpText, setRfpText] = useState("");
  const [elements, setElements] = useState([]);
  const [responses, setResponses] = useState({});
  const [latestRFP, setLatestRFP] = useState(null);

  const handleSubmit = async () => {
    console.log("Fetching the latest RFP from Airtable...");

    // Fetch RFPs from Airtable API
    const response = await fetch("/api/fetch-rfps");
    const data = await response.json();

    if (!data || data.length === 0) {
      alert("No RFPs found! Please add one first.");
      return;
    }

    const latestFetchedRFP = data[data.length - 1]; // ✅ Get the most recent RFP
    setLatestRFP(latestFetchedRFP); // ✅ Store in state

    if (!latestFetchedRFP || !latestFetchedRFP.rfp_text) {
      alert("The latest RFP is missing text data.");
      return;
    }

    const parsedElements = latestFetchedRFP.rfp_text.split("\n").filter(line => line.trim() !== "");
    setElements(parsedElements);

    // ✅ Get responses directly from Airtable
    const newResponses = {};
    parsedElements.forEach((element, index) => {
      const storedResponse = latestFetchedRFP.response || "No response available"; // Pull from Airtable response field
      newResponses[index] = storedResponse;
    });

    console.log("📥 Airtable Responses:", newResponses);
    setResponses(newResponses);
  };

  const handleSaveResponse = async (index) => {
    if (!latestRFP) {
      console.error("❌ Error: No latestRFP found.");
      return;
    }

    const responseText = responses[index] ?? "";
    const rfpId = latestRFP.id; // ✅ Use state-stored latestRFP

    console.log(`💾 Saving response for ${elements[index]}:`, responseText);

    try {
      const updateData = { id: rfpId, responseText, status: "Pending" };
      console.log("📤 Sending Save Request to API:", updateData);

      const res = await fetch("/api/update-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      console.log("✅ API Response:", data);
    } catch (error) {
      console.error("❌ Failed to save response:", error);
    }
  };

  const handleApproveResponse = async (index) => {
    if (!latestRFP) {
      console.error("❌ Error: No latestRFP found.");
      return;
    }

    const responseText = responses[index] ?? "";
    const rfpId = latestRFP.id; // ✅ Use state-stored latestRFP

    console.log(`✅ Approving response for ${elements[index]}:`, responseText);

    try {
      const updateData = { id: rfpId, responseText, status: "Approved" };

      const res = await fetch("/api/update-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      console.log("🎉 Response approved:", data);
    } catch (error) {
      console.error("❌ Failed to approve response:", error);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">EPI - RFP Processing</h1>

      <button
        className="bg-green-600 text-white px-3 py-1 rounded mb-4"
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
            <div key={index} className="mb-3 flex flex-col gap-2">
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder={`Response for: ${item}`}
                value={responses[index] ?? ""}
                onChange={(e) => setResponses(prev => ({ ...prev, [index]: e.target.value }))}
              />

              <div className="flex gap-2">
                <button
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                  onClick={() => handleSaveResponse(index)}
                >
                  💾 Save
                </button>

                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => handleApproveResponse(index)}
                >
                  ✅ Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
