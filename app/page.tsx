"use client";
import { useState } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { RFP, ResponseStatus } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";

export default function Home() {
  const [rfpTitle, setRfpTitle] = useState("");
  const [elements, setElements] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [latestRFP, setLatestRFP] = useState<RFP | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});
  const [isParsingWithAI, setIsParsingWithAI] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const handleAnalyzeRFP = async () => {
    if (!rfpTitle.trim()) {
      showNotification('warning', 'Please enter a question first.');
      return;
    }

    setIsParsingWithAI(true);
    
    try {
      console.log("💬 Starting API request");
      console.log("📍 Endpoint:", API_ENDPOINTS.INTERNAL.ANALYZE_RFP);
      console.log("📝 Question:", rfpTitle);
      
      showNotification('info', `Sending question to Alltius...`, 8000);
      
      const response = await fetch(API_ENDPOINTS.INTERNAL.ANALYZE_RFP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfpTitle }),
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()));

      // Get the response text first
      const responseText = await response.text();
      console.log("📥 Raw response:", responseText);

      // Try to parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("📥 Parsed data:", data);
      } catch (e) {
        console.error("❌ JSON Parse Error:", e);
        throw new Error(`Failed to parse response as JSON: ${e.message}`);
      }

      if (!response.ok) {
        console.error("❌ Error response:", data);
        throw new Error(data.error || `Error ${response.status}: Failed to get response from Alltius`);
      }
      
      if (!data.success || !data.elements) {
        console.error("❌ Invalid response format:", data);
        throw new Error('Failed to get valid response from Alltius');
      }

      console.log("✅ Successfully received elements:", data.elements);

      // Update state with elements
      setElements(data.elements);
      
      // Create empty responses for each element
      const newResponses: Record<number, string> = {};
      data.elements.forEach((_, index) => {
        newResponses[index] = "";
      });
      setResponses(newResponses);
      
      showNotification(
        'success', 
        `Received response from Alltius!`
      );
      
    } catch (err) {
      console.error("🚨 Error in handleAnalyzeRFP:", err);
      console.error("Full error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      showNotification(
        'error',
        `Failed to get response: ${err.message}`
      );
    } finally {
      setIsParsingWithAI(false);
    }
  };

  const handleSaveResponse = async (index: number) => {
    if (!latestRFP) {
      showNotification('error', 'No RFP loaded. Please analyze an RFP first.');
      return;
    }

    setIsProcessing(prev => ({ ...prev, [index]: true }));
    try {
      const responseText = responses[index] ?? "";
      const rfpId = latestRFP.id;

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
      
      showNotification('success', 'Response saved successfully!');
    } catch (err) {
      console.error("Failed to save response:", err);
      showNotification('error', `Failed to save response: ${err.message}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleApproveResponse = async (index: number) => {
    if (!latestRFP) {
      showNotification('error', 'No RFP loaded. Please analyze an RFP first.');
      return;
    }

    setIsProcessing(prev => ({ ...prev, [index]: true }));
    try {
      const responseText = responses[index] ?? "";
      const rfpId = latestRFP.id;

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
      
      showNotification('success', 'Response approved successfully!');
    } catch (err) {
      console.error("Failed to approve response:", err);
      showNotification('error', `Failed to approve response: ${err.message}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">EPI - RFP Processing</h1>

      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Analyze RFP from Google Drive</h2>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            placeholder="Enter question for Alltius..."
            value={rfpTitle}
            onChange={(e) => setRfpTitle(e.target.value)}
          />
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-purple-700 transition flex items-center justify-center min-w-[140px]"
            onClick={handleAnalyzeRFP}
            disabled={isParsingWithAI || !rfpTitle.trim()}
          >
            {isParsingWithAI ? (
              <>
                <LoadingSpinner size="small" color="#ffffff" />
                <span className="ml-2">Analyzing...</span>
              </>
            ) : (
              "Analyze RFP"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">Response from Alltius</h2>
          {isParsingWithAI ? (
            <div className="py-10">
              <LoadingSpinner size="large" />
            </div>
          ) : elements.length === 0 ? (
            <div className="text-gray-500 py-6 text-center border border-dashed rounded-md">
              No response yet. Enter a question and click "Analyze RFP" to get a response.
            </div>
          ) : (
            <ul className="divide-y">
              {elements.map((item, index) => (
                <li key={index} className="py-2">
                  <span className="font-medium text-gray-700">Response:</span> {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-xl font-semibold mb-2">Your Notes</h2>
          {isParsingWithAI ? (
            <div className="py-10">
              <LoadingSpinner size="large" />
            </div>
          ) : elements.length === 0 ? (
            <div className="text-gray-500 py-6 text-center border border-dashed rounded-md">
              Get a response first to add notes.
            </div>
          ) : (
            elements.map((item, index) => (
              <div key={index} className="mb-3 p-3 border rounded hover:shadow-md transition">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Notes for Response {index + 1}</h3>
                
                <textarea
                  className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition min-h-[100px]"
                  placeholder="Add your notes here..."
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