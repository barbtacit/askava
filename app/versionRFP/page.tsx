"use client";
import { useState, useEffect } from "react";
import { getApiConfig } from "@/constants/api";
import { RFP, ResponseStatus } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";

export default function Home() {
  const API_ENDPOINTS = getApiConfig('versionRFP');
  const [rfpTitle, setRfpTitle] = useState<string>("");
  const [elements, setElements] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isParsingWithAI, setIsParsingWithAI] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});
  const [lastSaved, setLastSaved] = useState<Record<number, Date | null>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<number, boolean>>({});
  const [showSaveSuccess, setShowSaveSuccess] = useState<Record<number, boolean>>({});
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
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
      
    } catch (err: unknown) {
      console.error("Error getting response:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to get response: ${errorMessage}`);
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
      
    } catch (err: unknown) {
      console.error("Save error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to save response: ${errorMessage}`);
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleExportToPdf = async () => {
    if (elements.length === 0 || Object.keys(responses).length === 0) {
      showNotification('warning', 'No content to export. Please generate a response first.');
      return;
    }

    setIsExportingPdf(true);
    
    try {
      console.log("Starting PDF export process...");
      
      // Create a simple HTML version that we'll open in a new tab
      // This is a more reliable approach than trying to generate a PDF directly
      const htmlContent = generateSimpleHtml(rfpTitle, elements, responses);
      
      // Open a new tab with the HTML content
      const newTab = window.open('', '_blank');
      if (!newTab) {
        throw new Error('Unable to open a new tab. Please check your browser settings and allow popups.');
      }
      
      newTab.document.write(htmlContent);
      newTab.document.close();
      
      // Let user know they can print from there
      showNotification('success', 'Document opened in new tab. Use your browser\'s print function to save as PDF.');
      
    } catch (err: unknown) {
      console.error("Export error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to export document: ${errorMessage}`);
    } finally {
      setIsExportingPdf(false);
    }
  };
  
  // Generate a printable HTML document
  const generateSimpleHtml = (rfpTitle: string, elements: string[], responses: Record<number, string>) => {
    const currentDate = new Date().toLocaleDateString();
    
    // Escape HTML and convert newlines to <br> tags
    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br/>');
    };
    
    const elementRows = elements.map((element: string, index: number) => {
      const responseText = responses[index] || 'No response provided';
      
      return `
        <div class="response-section">
          <h3>Element ${index + 1}</h3>
          <div class="element-content">
            <p>${escapeHtml(element)}</p>
          </div>
          <div class="response-content">
            <h4>Response:</h4>
            <p>${escapeHtml(responseText)}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>RFP Response: ${escapeHtml(rfpTitle)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .title {
              color: #5b21b6;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .response-section {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            h3 {
              color: #5b21b6;
              margin-bottom: 10px;
            }
            h4 {
              margin-top: 15px;
              margin-bottom: 10px;
              color: #666;
            }
            .element-content {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
            .response-content {
              padding: 0 15px;
            }
            p {
              margin: 10px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">RFP Response: ${escapeHtml(rfpTitle)}</h1>
            <p class="date">Generated on ${currentDate}</p>
          </div>
          
          ${elementRows}
          
          <div class="footer">
            <p>Generated by AskTacit RFP Assistant</p>
          </div>

          <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #5b21b6; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `;
  };



  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if we have unsaved changes anywhere
  const hasAnyUnsavedChanges = Object.values(hasUnsavedChanges).some(value => value === true);

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
            <div className="flex space-x-4">
              <Link 
                href="/versionRFP/saved-responses" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                View Saved Responses
              </Link>
              {elements.length > 0 && (
                <button 
                  onClick={handleExportToPdf}
                  disabled={isExportingPdf}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
                >
                  {isExportingPdf ? (
                    <>
                      <LoadingSpinner size="small" color="#ffffff" />
                      <span className="ml-2">Preparing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Document
                    </>
                  )}
                </button>
              )}
            </div>
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
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all duration-200"
                placeholder="Enter your question..."
                value={rfpTitle}
                onChange={(e) => setRfpTitle(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center min-w-[140px] shadow-sm hover:shadow"
                onClick={handleAnalyzeRFP}
                disabled={isParsingWithAI || !rfpTitle.trim()}
              >
                {isParsingWithAI ? (
                  <>
                    <LoadingSpinner size="small" color="#ffffff" />
                    <span className="ml-2">Thinking...</span>
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Warning for unsaved changes */}
        {hasAnyUnsavedChanges && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You have unsaved changes. Remember to save your responses before exporting or navigating away.</span>
          </div>
        )}

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
                  No elements yet. Enter a question and click "Submit" to get started.
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
                        className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all duration-200 min-h-[120px] bg-white"
                        value={responses[index] ?? ""}
                        onChange={(e) => handleResponseChange(index, e.target.value)}
                      />

                      <div className="flex items-center justify-between">
                        <button
                          className={`text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow
                            ${hasUnsavedChanges[index] ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 hover:bg-gray-600'}
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
                              Save
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