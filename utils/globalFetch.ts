// utils/globalFetch.ts
import { ApiResponse } from '@/types';

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export async function globalFetch<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 30000
  } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: defaultHeaders,
      signal: controller.signal
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`📡 Fetching: ${url}`, {
      method,
      bodySize: body ? JSON.stringify(body).length : 0
    });

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // Try to parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (error) {
      const textResponse = await response.text();
      console.error('Failed to parse response as JSON:', textResponse);
      throw new Error(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
    }

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`, data);
      return {
        success: false,
        error: data.error || `API Error: ${response.status}`
      };
    }

    return {
      success: true,
      data
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('🕒 Request timeout');
      return {
        success: false,
        error: 'Request timeout'
      };
    }

    console.error('🚨 Fetch Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}