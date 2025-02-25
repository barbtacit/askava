"use client";
import { useState, useEffect } from "react";
import { getApiConfig } from "@/constants/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";

interface SavedResponse {
  id: string;
  question: string;
  response: string;
  createdTime: string;
}

export default function SavedResponses() {
  const API_ENDPOINTS = getApiConfig('versionCyber');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchSavedResponses();
  }, []);

  const fetchSavedResponses = async () => {
    setIsLoading(true);
    try {
      // This would need to be a new API endpoint specific to cybersecurity responses
      // For now, we'll use the existing one with a query parameter
      const response = await fetch('/api/fetch-saved-responses?version=versionCyber', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch saved responses`);
      }

      const data = await response.json();
      setSavedResponses(data.records || []);
    } catch (err: any) {
      console.error("Error fetching saved responses:", err);
      showNotification('error', `Failed to fetch saved responses: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter responses based on search query
  const filteredResponses = savedResponses.filter(response => {
    return (
      response.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.response?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
            <h1 className="text-2xl font-bold text-gray-800">Saved Cybersecurity Analyses</h1>
            <Link 
              href="/versionCyber" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              Back to Cybersecurity Assistant
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Saved Analyses
              </label>
              <input
                type="text"
                id="search"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                placeholder="Search by question or response content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={fetchSavedResponses}
                className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Responses List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {filteredResponses.length} {filteredResponses.length === 1 ? 'Analysis' : 'Analyses'} Found
            </h2>
            
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                {savedResponses.length === 0 
                  ? "No saved analyses found. Ask questions using the cybersecurity assistant to see them here." 
                  : "No analyses match your search criteria."}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResponses.map((response: SavedResponse) => (
                  <div key={response.id} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-blue-900 mb-1">
                          {response.question || "Untitled Question"}
                        </h3>
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-700">Analysis:</span>
                          <p className="mt-1 text-gray-600 whitespace-pre-line">{response.response}</p>
                        </div>
                      </div>
                      <div className="md:w-64 flex flex-col items-start gap-2">
                        <span className="text-sm text-gray-500">
                          Created: {formatDate(response.createdTime)}
                        </span>
                        <div className="mt-2 flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            onClick={() => {/* Implement view details logic */}}
                          >
                            View Details
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium" 
                            onClick={() => {/* Implement copy to clipboard logic */}}
                          >
                            Copy Response
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}