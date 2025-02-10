"use server"; // Ensure it runs only on the server

import Airtable from "airtable";

// Validate environment variables safely and early
if (!process.env.AIRTABLE_API_KEY) {
  console.error("❌ Missing AIRTABLE_API_KEY environment variable. Check your .env.local file.");
  throw new Error("Missing AIRTABLE_API_KEY"); // Stop server initialization if API key is missing
}
if (!process.env.AIRTABLE_BASE_ID) {
  console.error("❌ Missing AIRTABLE_BASE_ID environment variable. Check your .env.local file.");
  throw new Error("Missing AIRTABLE_BASE_ID"); // Stop server if Base ID is missing
}
if (!process.env.AIRTABLE_TABLE_NAME) {
  console.error("❌ Missing AIRTABLE_TABLE_NAME environment variable. Check your .env.local file.");
  throw new Error("Missing AIRTABLE_TABLE_NAME"); // Stop server if Table Name is missing
}

// Initialize Airtable connection - moved outside function scope for efficiency. Initialize once per server.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base(process.env.AIRTABLE_TABLE_NAME);

export async function fetchRFPs() {
  try {
    console.log("📡 Fetching RFPs from Airtable using Airtable SDK..."); // More specific log message
    const records = await table
      .select({
        view: "Grid view", // Specify the view - good practice
      })
      .all();

    if (!records || records.length === 0) { // More robust check for records
      console.warn("⚠️ No RFP records found in Airtable table:", process.env.AIRTABLE_TABLE_NAME, "in Base:", process.env.AIRTABLE_BASE_ID); // Include table and base info in warning
      return []; // Return empty array explicitly when no records are found, not an error case
    }

    console.log(`✅ Successfully fetched ${records.length} records from Airtable table: ${process.env.AIRTABLE_TABLE_NAME}`); // More informative success log

    return records.map((record) => {
      const fields = record.fields || {}; // защитное программирование - same as fetch-rfps.js, good practice
      return {
        id: record.id,
        rfp_title: fields.rfp_title || "No Title",
        requesting_company: fields.requesting_company || "Unknown Company",
        rfp_text: fields.rfp_text || "No Text Available",
        rfp_elements: fields.rfp_elements || "No Elements",
        response: fields.response || "No Response",
        created_at: fields.created_at || "Unknown Date",
      };
    });

  } catch (error) {
    console.error("❌ Airtable SDK Fetch Error:", error); // More specific error log

    // Improved error handling - re-throw the error to be caught by the caller if needed
    // Or return a more specific error object if you want to handle errors differently in components.
    return [{ error: "Failed to fetch RFPs from Airtable using SDK", details: error instanceof Error ? error.message : String(error) }]; // Return more descriptive error object
  }
}