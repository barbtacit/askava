"use client";
import { useState, useEffect } from "react";
import { getApiConfig } from "@/constants/api";
import { RFP, ResponseStatus } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";

export default function Home() {
  const API_ENDPOINTS = getApiConfig('versionRFP');
  const [rfpTitle, setRfpTitle] = useState("");
  const [elements, setElements] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isParsingWithAI, setIsParsingWithAI] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<number, Date | null>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<number, boolean>>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState<Record<number, boolean>>({});
  const { showNotification } = useNotification();

  // Track unsaved changes
  const handleResponseChange = (index: number, newValue: string) => {
    setResponses(prev => ({ ...prev, [index]: newValue }));
    setHasUnsavedChanges(prev => ({ ...prev, [index]: true }));
  };

  const handleAnalyzeRFP = async () => {
    if (!rfpTitle.trim()) {
      showNotification('warning', 'Please enter a question first.');
      return;
    }

    setIsParsingWithAI(true);
    
    try {
      showNotification('info', `Sending question to AskTacit...`, 8000);
      
      const response = await fetch(API_ENDPOINTS.INTERNAL.ANALYZE_RFP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfpTitle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: Failed to get response from Alltius`);
      }
      
      if (!data.success || !data.elements) {
        throw new Error('Failed to get valid response from Alltius');
      }

      setElements(data.elements);
      
      const newResponses: Record<number, string> = {};
      data.elements.forEach((element: string, index: number) => {
        newResponses[index] = element;
      });
      setResponses(newResponses);
      
      // Initialize unsaved changes for new responses
      const newUnsavedChanges: Record<number, boolean> = {};
      data.elements.forEach((_: string, index: number) => {
        newUnsavedChanges[index] = false;
      });
      setHasUnsavedChanges(newUnsavedChanges);
      
      showNotification('success', `Received response from AskTacit!`);
      
    } catch (err: any) {
      console.error("Error getting response:", err);
      showNotification('error', `Failed to get response: ${err.message || 'Unknown error'}`);
    } finally {
      setIsParsingWithAI(false);
    }
  };

  const handleSaveResponse = async (index: number) => {
    setIsProcessing(prev => ({ ...prev, [index]: true }));
    try {
      const response = await fetch(API_ENDPOINTS.INTERNAL.SAVE_TO_AIRTABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: rfpTitle,
          element: elements[index],
          response: responses[index]
        }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save response');
      }

      // Update save status
      setLastSaved(prev => ({ ...prev, [index]: new Date() }));
      setHasUnsavedChanges(prev => ({ ...prev, [index]: false }));
      
      // Show save success indicator briefly
      setShowSaveSuccess(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setShowSaveSuccess(prev => ({ ...prev, [index]: false }));
      }, 2000);

      showNotification('success', 'Response saved successfully!');
      
    } catch (err: any) {
      console.error("Save error:", err);
      showNotification('error', `Failed to save response: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="data:image/png;base64,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" 
                alt="AskTacit Logo"
                className="h-10 w-auto p-1"
              />
              <span className="text-xl font-semibold text-gray-800">AskTacit</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Engineering RFP Assistant</h1>
            <Link 
              href="/versionRFP/saved-responses" 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200"
            >
              View Saved Responses
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ask Your Question
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all duration-200"
                placeholder="Enter your question..."
                value={rfpTitle}
                onChange={(e) => setRfpTitle(e.target.value)}
              />
              <button
                className="bg-purple-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 hover:bg-purple-700 transition-all duration-200 flex items-center justify-center min-w-[140px] shadow-sm hover:shadow"
                onClick={handleAnalyzeRFP}
                disabled={isParsingWithAI || !rfpTitle.trim()}
              >
                {isParsingWithAI ? (
                  <>
                    <LoadingSpinner size="small" color="#ffffff" />
                    <span className="ml-2">Analyzing...</span>
                  </>
                ) : (
                  "Analyze"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* RFP Elements Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">RFP Elements</h2>
              {isParsingWithAI ? (
                <div className="py-10 flex justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : elements.length === 0 ? (
                <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  No elements yet. Enter a question and click "Analyze" to get started.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {elements.map((item: string, index: number) => (
                    <li key={index} className="py-3 first:pt-0 last:pb-0">
                      <span className="font-medium text-gray-700">Response {index + 1}:</span>
                      <p className="mt-1 text-gray-600">{item}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Response Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Response</h2>
              {isParsingWithAI ? (
                <div className="py-10 flex justify-center">
                  <LoadingSpinner size="large" />
                </div>
              ) : elements.length === 0 ? (
                <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  Get a response first to start editing.
                </div>
              ) : (
                <div className="space-y-6">
                  {elements.map((_: string, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Response {index + 1}</h3>
                        {hasUnsavedChanges[index] && (
                          <span className="text-amber-600 text-sm bg-amber-50 px-2 py-1 rounded">
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all duration-200 min-h-[120px] bg-white"
                        value={responses[index] ?? ""}
                        onChange={(e) => handleResponseChange(index, e.target.value)}
                      />

                      <div className="flex items-center justify-between">
                        <button
                          className={`text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow
                            ${hasUnsavedChanges[index] ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-500 hover:bg-gray-600'}
                            ${isProcessing[index] ? 'opacity-75 cursor-not-allowed' : ''}`}
                          onClick={() => handleSaveResponse(index)}
                          disabled={isProcessing[index]}
                          title="Save your changes to AskTacit"
                        >
                          {isProcessing[index] ? (
                            <>
                              <LoadingSpinner size="small" color="#ffffff" />
                              <span>Saving...</span>
                            </>
                          ) : showSaveSuccess[index] ? (
                            <span className="flex items-center">
                              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved!
                            </span>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              Save to AskTacit
                            </>
                          )}
                        </button>
                        
                        {lastSaved[index] && (
                          <span className="text-sm text-gray-500">
                            Last saved: {formatLastSaved(lastSaved[index]!)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}