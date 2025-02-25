"use client";
import { useState } from "react";
import { getApiConfig } from "@/constants/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";

export default function CyberAssistant() {
  const API_ENDPOINTS = getApiConfig('versionCyber');
  const [question, setQuestion] = useState<string>("");
  const [analysisResponse, setAnalysisResponse] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { showNotification } = useNotification();

  const handleAnalyzeQuestion = async () => {
    if (!question.trim()) {
      showNotification('warning', 'Please enter a cybersecurity question first.');
      return;
    }

    setIsProcessing(true);
    
    try {
      showNotification('info', `Analyzing your cybersecurity question...`, 8000);
      
      console.log("Sending request to:", API_ENDPOINTS.INTERNAL.GENERATE_RESPONSE);
      console.log("With body:", { 
        prompt: question,
        chatSession: API_ENDPOINTS.ALLTIUS.DEFAULT_SESSION,
        userIdentifier: API_ENDPOINTS.ALLTIUS.DEFAULT_USER
      });
      
      const fetchResponse = await fetch(API_ENDPOINTS.INTERNAL.GENERATE_RESPONSE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: question,
          chatSession: API_ENDPOINTS.ALLTIUS.DEFAULT_SESSION,
          userIdentifier: API_ENDPOINTS.ALLTIUS.DEFAULT_USER,
          assistantId: API_ENDPOINTS.ALLTIUS.ASSISTANT_ID
        }),
      });

      // First, try to get the response as text
      const responseText = await fetchResponse.text();
      console.log("Raw response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse response:", e);
        throw new Error(`Failed to parse server response: ${responseText.substring(0, 100)}`);
      }

      if (!fetchResponse.ok) {
        throw new Error(data.error || `Error ${fetchResponse.status}: ${data.details || 'Failed to get response from Alltius'}`);
      }
      
      if (!data.success || !data.response) {
        throw new Error('Failed to get valid response from Alltius');
      }

      setAnalysisResponse(data.response);
      showNotification('success', `Cybersecurity analysis complete!`);
      
    } catch (err: unknown) {
      console.error("Error getting cybersecurity response:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to analyze question: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDocument = async () => {
    if (!analysisResponse) {
      showNotification('warning', 'No analysis to export. Please get a response first.');
      return;
    }
    
    try {
      // Create a simple HTML version that we'll open in a new tab
      const htmlContent = generateSimpleHtml(question, analysisResponse);
      
      // Open a new tab with the HTML content
      const newTab = window.open('', '_blank');
      if (!newTab) {
        throw new Error('Unable to open a new tab. Please check your browser settings and allow popups.');
      }
      
      newTab.document.write(htmlContent);
      newTab.document.close();
      
      // Let user know they can print from there
      showNotification('success', 'Analysis opened in new tab. Use your browser\'s print function to save as PDF.');
      
    } catch (err: unknown) {
      console.error("Export error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showNotification('error', `Failed to export document: ${errorMessage}`);
    }
  };
  
  // Generate a printable HTML document
  const generateSimpleHtml = (questionText: string, analysisResponseText: string): string => {
    const currentDate = new Date().toLocaleDateString();
    
    // Escape HTML and convert newlines to <br> tags
    const escapeHtml = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br/>');
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AskTacit Response: ${escapeHtml(question.substring(0, 50))}...</title>
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
              color: #2563eb;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
            .question-section {
              margin-bottom: 30px;
              background-color: #f0f7ff;
              padding: 15px;
              border-radius: 5px;
            }
            .response-section {
              margin-bottom: 30px;
            }
            h3 {
              color: #2563eb;
              margin-bottom: 10px;
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
            <h1 class="title">Cybersecurity Analysis</h1>
            <p class="date">Generated on ${currentDate}</p>
          </div>
          
          <div class="question-section">
            <h3>Question:</h3>
            <p>${escapeHtml(question)}</p>
          </div>
          
          <div class="response-section">
            <h3>Analysis:</h3>
            <p>${escapeHtml(analysisResponse)}</p>
          </div>
          
          <div class="footer">
            <p>Generated by AskTacit Cybersecurity Assistant</p>
          </div>

          <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print / Save as PDF
            </button>
          </div>
        </body>
      </html>
    `;
  };

  // Hidden function to save to Airtable (not exposed in UI)
  const saveToAirtable = async () => {
    try {
      const fetchResponse = await fetch(API_ENDPOINTS.INTERNAL.SAVE_TO_AIRTABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'versionCyber',
          element: question,
          response: analysisResponse
        }),
      });

      const data = await fetchResponse.json();

      if (!fetchResponse.ok) {
        throw new Error(data.error || 'Failed to save response');
      }
      
      console.log("Successfully saved to Airtable:", data.recordId);
      
    } catch (err: unknown) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
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
            <h1 className="text-2xl font-bold text-gray-800">Cybersecurity Assistant</h1>
            <div className="flex space-x-4">
              <Link 
                href="/versionCyber/saved-responses" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                View Saved Analyses
              </Link>
              <button 
                onClick={handleExportDocument}
                disabled={!analysisResponse || isProcessing}
                className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center ${(!analysisResponse || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ask a Cybersecurity Question
            </h2>
            <div className="flex gap-4">
              <textarea
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all duration-200 h-24 resize-y"
                placeholder="Enter your cybersecurity question or concern..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              ></textarea>
              <div className="flex flex-col justify-center">
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center min-w-[140px] shadow-sm hover:shadow"
                  onClick={handleAnalyzeQuestion}
                  disabled={isProcessing || !question.trim()}
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="small" color="#ffffff" />
                      <span className="ml-2">Analyzing...</span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Response Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">AskTacit Response</h2>
            {isProcessing ? (
              <div className="py-10 flex justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : !analysisResponse ? (
              <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                No analysis yet. Enter a cybersecurity question and click "Submit" to get started.
              </div>
            ) : (
              <div className="prose max-w-none">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium text-blue-800">Your Question:</h3>
                  <p className="text-blue-700">{question}</p>
                </div>
                <div className="whitespace-pre-line">
                  {analysisResponse}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}