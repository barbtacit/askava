export async function globalFetch(url, method = "GET", body = null, headers = {}) {
  try {
    // Default headers - start with an empty object and conditionally add Content-Type
    const defaultHeaders = {};

    // Conditionally set Content-Type if a body is present (common for POST/PUT/PATCH)
    if (body) {
      defaultHeaders["Content-Type"] = "application/json";
    }

    // Merge default headers with custom headers, custom headers will override defaults if there's a conflict
    const mergedHeaders = {
      ...defaultHeaders,
      ...headers,
    };

    // Build fetch options
    const options = {
      method,
      headers: mergedHeaders,
    };

    // Attach body if present (for POST, PUT, PATCH requests)
    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`📡 Fetching: ${url} with method: ${method}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorDetails = "";
      try {
        // Try to parse JSON error response first
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson); // Stringify JSON for error message
      } catch (jsonError) {
        // If JSON parsing fails, fallback to text response
        try {
          errorDetails = await response.text();
        } catch (textError) {
          errorDetails = `Failed to read error response body as text.`;
        }
      }
      console.error(`❌ Fetch failed: ${response.status} ${response.statusText}`, errorDetails);
      throw new Error(`Fetch failed: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    return await response.json();
  } catch (error) {
    console.error("🚨 Global Fetch Error:", error.message);
    throw error; // Re-throw the error to be handled by the caller
  }
}