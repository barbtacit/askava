"use client";
import { useState, useEffect } from "react";
import { getApiConfig } from "@/constants/api";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotification } from "@/contexts/NotificationContext";
import Link from "next/link";

interface SavedResponse {
  id: string;
  question: string;
  element: string;
  response: string;
  createdTime: string;
  status: string;
}

export default function SavedResponses() {
  const API_ENDPOINTS = getApiConfig('versionRFP');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchSavedResponses();
  }, []);

  const fetchSavedResponses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fetch-saved-responses', {
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

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter responses based on search query and status
  const filteredResponses = savedResponses.filter(response => {
    const matchesSearch = 
      response.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.element?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.response?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      response.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-purple-600 text-white font-bold text-xl px-4 py-2 rounded">
                AT
              </div>
              <span className="text-xl font-semibold text-gray-800">AskTacit</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Saved Responses</h1>
            <Link 
              href="/versionRFP" 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200"
            >
              Back to Assistant
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
                Search Responses
              </label>
              <input
                type="text"
                id="search"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                placeholder="Search by question, element or response..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:w-64">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="status"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-300 focus:border-purple-300"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={fetchSavedResponses}
                className="w-full md:w-auto bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center"
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
              {filteredResponses.length} {filteredResponses.length === 1 ? 'Response' : 'Responses'} Found
            </h2>
            
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <LoadingSpinner size="large" />
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-gray-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                {savedResponses.length === 0 
                  ? "No saved responses found. Save responses from the assistant to see them here." 
                  : "No responses match your search criteria."}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredResponses.map((response: SavedResponse) => (
                  <div key={response.id} className="py-6 first:pt-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {response.question || "Untitled Question"}
                        </h3>
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-700">Element:</span>
                          <p className="mt-1 text-gray-600">{response.element}</p>
                        </div>
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-700">Response:</span>
                          <p className="mt-1 text-gray-600 whitespace-pre-line">{response.response}</p>
                        </div>
                      </div>
                      <div className="md:w-64 flex flex-col items-start gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(response.status)}`}>
                          {response.status || "Draft"}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created: {formatDate(response.createdTime)}
                        </span>
                        <div className="mt-2 flex space-x-2">
                          <button
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                            onClick={() => {/* Implement view details logic */}}
                          >
                            View Details
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium" 
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