"use server"; // Ensure it runs only on the server

import Airtable from "airtable";

// Validate environment variables safely
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
  console.error("❌ Missing Airtable API Key, Base ID, or Table Name. Check your .env.local file.");
}

// Initialize Airtable connection
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
const table = base(process.env.AIRTABLE_TABLE_NAME);

export async function fetchRFPs() {
  try {
    console.log("📡 Fetching RFPs from Airtable...");
    const records = await table.select({ view: "Grid view" }).all();

    if (!records.length) {
      console.warn("⚠️ No RFP records found in Airtable.");
      return [];
    }

    console.log("✅ Fetched Airtable Records:", records.length);

    return records.map((record) => ({
      id: record.id,
      rfp_title: record.get("rfp_title") || "No Title",
      requesting_company: record.get("requesting_company") || "Unknown Company",
      rfp_text: record.get("rfp_text") || "No Text Available",
      rfp_elements: record.get("rfp_elements") || "No Elements",
      response: record.get("response") || "No Response",
      created_at: record.get("created_at") || "Unknown Date",
    }));

  } catch (error) {
    console.error("❌ Airtable Fetch Error:", error);
    return [{ error: "Failed to fetch RFPs from Airtable" }];
  }
}
