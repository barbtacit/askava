export async function globalFetch(url, method = "GET", body = null, headers = {}) {
    try {
      // Default headers
      const defaultHeaders = {
        "Content-Type": "application/json",
        ...headers, // Allow custom headers
      };
  
      // Build fetch options
      const options = {
        method,
        headers: defaultHeaders,
      };
  
      // Attach body if present (for POST, PUT, DELETE requests)
      if (body) {
        options.body = JSON.stringify(body);
      }
  
      console.log(`📡 Fetching: ${url} with method: ${method}`);
  
      const response = await fetch(url, options);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Fetch failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Fetch failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("🚨 Global Fetch Error:", error.message);
      throw error;
    }
  }
  