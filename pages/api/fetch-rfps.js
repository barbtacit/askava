import { globalFetch } from "@/utils/globalFetch";

export default async function handler(req, res) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    console.error("❌ Missing required Airtable API credentials. Check your .env.local file.");
    return res.status(500).json({ error: "Missing Airtable API Key, Base ID, or Table Name." });
  }

  try {
    console.log("📡 Fetching RFPs from Airtable...");

    const airtableURL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
    const data = await globalFetch(airtableURL, "GET", null, {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    });

    if (!data.records || data.records.length === 0) {
      console.warn("⚠️ No RFP records found in Airtable.");
      return res.status(200).json({ message: "No RFPs available." });
    }

    const formattedData = data.records.map((record) => ({
      id: record.id,
      rfp_title: record.fields.rfp_title || "No Title",
      requesting_company: record.fields.requesting_company || "Unknown Company",
      rfp_text: record.fields.rfp_text || "No Text Available",
      rfp_elements: record.fields.rfp_elements || "No Elements",
      response: record.fields.response || "No Response",
      created_at: record.fields.created_at || "Unknown Date",
    }));

    console.log("✅ Successfully fetched", formattedData.length, "RFPs from Airtable.");
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("❌ Airtable Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch data from Airtable", details: error.message });
  }
}
