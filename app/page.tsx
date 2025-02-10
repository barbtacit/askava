"use client";
import { useState } from "react";
// import { fetchRFPs } from "@/lib/airtable"; // Removed unused import

export default function Home() {
  const [rfpText, setRfpText] = useState(""); // Unused in current fetch logic
  const [elements, setElements] = useState([]);
  const [responses, setResponses] = useState({}); // Initialize as empty object
  const [latestRFP, setLatestRFP] = useState(null);
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages

  const handleSubmit = async () => {
    console.log("Fetching the latest RFP from Airtable...");
    setErrorMessage(""); // Clear any previous errors

    // Fetch RFPs from Airtable API
    const response = await fetch("/api/fetch-rfps");

    if (!response.ok) {
      console.error("HTTP error fetching RFPs:", response.status, response.statusText);
      setErrorMessage(`Failed to fetch RFPs. Status: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      setErrorMessage("No RFPs found! Please add one first.");
      return;
    }

    const latestFetchedRFP = data[data.length - 1];
    setLatestRFP(latestFetchedRFP);

    if (!latestFetchedRFP || !latestFetchedRFP.rfp_text) {
      setErrorMessage("The latest RFP is missing text data.");
      return;
    }

    const parsedElements = latestFetchedRFP.rfp_text.split("\n").filter(line => line.trim() !== "");
    setElements(parsedElements);

    // Initialize responses as empty strings for each element
    const initialResponses = {};
    parsedElements.forEach((_, index) => {
      initialResponses[index] = ""; // Initialize with empty string
    });
    setResponses(initialResponses);

    console.log("📥 Airtable RFP and initialized empty responses.");
  };

  const handleSaveResponse = async (index) => {
    if (!latestRFP) {
      console.error("❌ Error: No latestRFP found.");
      setErrorMessage("No RFP loaded to save responses.");
      return;
    }
    setErrorMessage(""); // Clear any previous errors

    const responseText = responses[index] ?? "";
    const rfpId = latestRFP.id;

    console.log(`💾 Saving response for ${elements[index]}:`, responseText);

    try {
      const updateData = { id: rfpId, responseText, status: "Pending" };
      console.log("📤 Sending Save Request to API:", updateData);

      const res = await fetch("/api/update-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json(); // Try to get error details from the server
        const message = errorData?.error || `Failed to save response. Status: ${res.status} ${res.statusText}`;
        console.error("❌ Failed to save response:", message);
        setErrorMessage(message);
        return;
      }

      const data = await res.json();
      console.log("✅ API Response:", data);
      setErrorMessage("Response saved successfully!"); // Success message
    } catch (error) {
      console.error("❌ Failed to save response:", error);
      setErrorMessage("Failed to save response. Please check the console for details.");
    }
  };

  const handleApproveResponse = async (index) => {
    if (!latestRFP) {
      console.error("❌ Error: No latestRFP found.");
      setErrorMessage("No RFP loaded to approve responses.");
      return;
    }
    setErrorMessage(""); // Clear any previous errors

    const responseText = responses[index] ?? "";
    const rfpId = latestRFP.id;

    console.log(`✅ Approving response for ${elements[index]}:`, responseText);

    try {
      const updateData = { id: rfpId, responseText, status: "Approved" };

      const res = await fetch("/api/update-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const message = errorData?.error || `Failed to approve response. Status: ${res.status} ${res.statusText}`;
        console.error("❌ Failed to approve response:", message);
        setErrorMessage(message);
        return;
      }

      const data = await res.json();
      console.log("🎉 Response approved:", data);
      setErrorMessage("Response approved successfully!"); // Success message
    } catch (error) {
      console.error("❌ Failed to approve response:", error);
      setErrorMessage("Failed to approve response. Please check the console for details.");
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
        Load Latest RFP {/* Changed button label for clarity */}
      </button>

      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>} {/* Display error message */}

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