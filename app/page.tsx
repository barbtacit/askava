"use client";

import { useState } from "react";
import { fetchRFPs } from "@/lib/airtable"; // ✅ Make sure lib/airtable.js exists

export default function Home() {
  const [rfpText, setRfpText] = useState("");
  const [elements, setElements] = useState([]);
  const [responses, setResponses] = useState({});

  const handleSubmit = async () => {
    const data = await fetchRFPs(); // ✅ Fetch data from Airtable
    console.log("Airtable Data:", data);
    
    const parsedElements = rfpText.split("\n").filter((line) => line.trim() !== "");
    setElements(parsedElements);

    const initialResponses = parsedElements.reduce((acc, item, index) => {
      acc[index] = "";
      return acc;
    }, {});
    setResponses(initialResponses);
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">EPI - RFP Processing</h1>

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
}
