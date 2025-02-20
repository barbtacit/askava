"use client";
import { useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { RFP, ResponseStatus } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import { parseRFPWithAI } from "@/utils/rfpParser";

export default function Home() {
  const [rfpText, setRfpText] = useState("");
  const [elements, setElements] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [latestRFP, setLatestRFP] = useState<RFP | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});
  const [isParsingWithAI, setIsParsingWithAI] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Fetch RFPs using our updated library function
      const response = await fetch(API_ENDPOINTS.INTERNAL.FETCH_RFPS);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching RFPs: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data || data.length === 0) {
        showNotification('warning', 'No RFPs found! Please add one first.');
        return;
      }

      const latestFetchedRFP = data[data.length - 1]; // Get the most recent RFP
      setLatestRFP(latestFetchedRFP);

      if (!latestFetchedRFP || !latestFetchedRFP.rfp_text) {
        showNotification('error', 'The latest RFP is missing text data.');
        return;
      }

      // Set the RFP text in the textarea
      setRfpText(latestFetchedRFP.rfp_text);

      const parsedElements = latestFetchedRFP.rfp_text.split("\n").filter(line => line.trim() !== "");
      setElements(parsedElements);

      // Get responses directly from Airtable
      const newResponses: Record<number, string> = {};
      parsedElements.forEach((element, index) => {
        const storedResponse = latestFetchedRFP.response || "No response available";
        newResponses[index] = storedResponse;
      });

      console.log("📥 Airtable Responses:", newResponses);
      setResponses(newResponses);
      showNotification('success', 'RFP loaded successfully!');
    } catch (err) {
      console.error("Error during RFP fetch:", err);
      showNotification('error', `Failed to fetch RFPs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseWithAI = async () => {
    if (!rfpText.trim()) {
      showNotification('warning', 'Please enter or load RFP text first.');
      return;
    }

    setIsParsingWithAI(true);
    
    try {
      showNotification('info', 'AI is analyzing the RFP...', 8000);
      
      // Parse RFP with AI
      const parsedRFP = await parseRFPWithAI(rfpText);
      
      if (parsedRFP.elements.length === 0) {
        throw new Error('AI could not identify any elements in the RFP');
      }
      
      // Update state with parsed elements and responses
      setElements(parsedRFP.elements);
      setResponses(parsedRFP.responses);
      
      showNotification(
        'success', 
        `RFP successfully analyzed! Found ${parsedRFP.elements.length} elements.`
      );
      
    } catch (err) {
      console.error("Error during AI parsing:", err);
      showNotification(
        'error',
        `AI analysis failed: ${err.message}. Try simplifying the RFP text.`
      );
    } finally {
      setIsParsingWithAI(false);
    }
  };

  const handleSaveResponse = async (index: number) => {
    if (!latestRFP) {
      showNotification('error', 'No RFP loaded. Please load an RFP first.');
      return;
    }

    setIsProcessing(prev => ({ ...prev, [index]: true }));
    try {
      const responseText = responses[index] ?? "";
      const rfpId = latestRFP.id;

      console.log(`💾 Saving response for ${elements[index]}:`, responseText);

      const res = await fetch(API_ENDPOINTS.INTERNAL.UPDATE_RESPONSE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: rfpId, 
          responseText, 
          status: "Pending" as ResponseStatus 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ API Response:", data);
      showNotification('success', 'Response saved successfully!');
    } catch (err) {
      console.error("❌ Failed to save response:", err);
      showNotification('error', `Failed to save response: ${err.message}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleApproveResponse = async (index: number) => {
    if (!latestRFP) {
      showNotification('error', 'No RFP loaded. Please load an RFP first.');
      return;
    }

    setIsProcessing(prev => ({ ...prev, [index]: true }));
    try {
      const responseText = responses[index] ?? "";
      const rfpId = latestRFP.id;

      console.log(`✅ Approving response for ${elements[index]}:`, responseText);

      const res = await fetch(API_ENDPOINTS.INTERNAL.UPDATE_RESPONSE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: rfpId, 
          responseText, 
          status: "Approved" as ResponseStatus 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("🎉 Response approved:", data);
      showNotification('success', 'Response approved successfully!');
    } catch (err) {
      console.error("❌ Failed to approve response:", err);
      showNotification('error', `Failed to approve response: ${err.message}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">EPI - RFP Processing</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
          onClick={() => window.open(API_ENDPOINTS.AIRTABLE.FORM_URL, "_blank")}
        >
          Submit RFP
        </button>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-blue-700 transition flex items-center justify-center min-w-[120px]"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="small" color="#ffffff" />
              <span className="ml-2">Loading...</span>
            </>
          ) : (
            "Load Latest RFP"
          )}
        </button>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-purple-700 transition flex items-center justify-center min-w-[140px]"
          onClick={handleParseWithAI}
          disabled={isParsingWithAI || !rfpText.trim()}
        >
          {isParsingWithAI ? (
            <>
              <LoadingSpinner size="small" color="#ffffff" />
              <span className="ml-2">Processing with AI...</span>
            </>
          ) : (
            "Analyze with AI"
          )}
        </button>
      </div>

      <textarea
        className="w-full p-3 border rounded mb-4 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
        rows={5}
        placeholder="Paste RFP content here..."
        value={rfpText}
        onChange={(e) => setRfpText(e.target.value)}
      ></textarea>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">RFP Elements</h2>
          {isLoading || isParsingWithAI ? (
            <div className="py-10">
              <LoadingSpinner size="large" />
            </div>
          ) : elements.length === 0 ? (
            <div className="text-gray-500 py-6 text-center border border-dashed rounded-md">
              No RFP elements loaded yet. Click "Load Latest RFP" or "Analyze with AI" to process data.
            </div>
          ) : (
            <ul className="divide-y">
              {elements.map((item, index) => (
                <li key={index} className="py-2">
                  <span className="font-medium text-gray-700">#{index + 1}:</span> {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">Responses</h2>
          {isLoading || isParsingWithAI ? (
            <div className="py-10">
              <LoadingSpinner size="large" />
            </div>
          ) : elements.length === 0 ? (
            <div className="text-gray-500 py-6 text-center border border-dashed rounded-md">
              Load an RFP to view and manage responses.
            </div>
          ) : (
            elements.map((item, index) => (
              <div key={index} className="mb-3 p-3 border rounded hover:shadow-md transition">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Element {index + 1}</h3>
                
                <textarea
                  className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition min-h-[100px]"
                  placeholder={`Response for: ${item}`}
                  value={responses[index] ?? ""}
                  onChange={(e) => setResponses(prev => ({ ...prev, [index]: e.target.value }))}
                />

                <div className="flex gap-2">
                  <button
                    className="bg-gray-500 text-white px-3 py-1 rounded disabled:bg-gray-300 hover:bg-gray-600 transition flex items-center"
                    onClick={() => handleSaveResponse(index)}
                    disabled={isProcessing[index]}
                  >
                    {isProcessing[index] ? (
                      <>
                        <LoadingSpinner size="small" color="#ffffff" />
                        <span className="ml-1">Saving...</span>
                      </>
                    ) : (
                      <>💾 Save</>
                    )}
                  </button>

                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded disabled:bg-gray-300 hover:bg-green-700 transition flex items-center"
                    onClick={() => handleApproveResponse(index)}
                    disabled={isProcessing[index]}
                  >
                    {isProcessing[index] ? (
                      <>
                        <LoadingSpinner size="small" color="#ffffff" />
                        <span className="ml-1">Approving...</span>
                      </>
                    ) : (
                      <>✅ Approve</>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}