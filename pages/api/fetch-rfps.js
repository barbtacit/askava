import Airtable from "airtable";

export default async function handler(req, res) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    console.error("❌ Missing required Airtable API credentials. Check your .env.local file.");
    return res.status(500).json({ error: "Missing Airtable API Key, Base ID, or Table Name." });
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
  const table = base(process.env.AIRTABLE_TABLE_NAME);

  try {
    console.log("📡 Fetching RFPs from Airtable...");
    const records = await table.select({ view: "Grid view" }).all();

    if (!records.length) {
      console.warn("⚠️ No RFP records found in Airtable.");
      return res.status(200).json({ message: "No RFPs available." });
    }

    const data = records.map((record) => ({
      id: record.id,
      rfp_title: record.get("rfp_title") || "No Title",
      requesting_company: record.get("requesting_company") || "Unknown Company",
      rfp_text: record.get("rfp_text") || "No Text Available",
      rfp_elements: record.get("rfp_elements") || "No Elements",
      response: record.get("response") || "No Response",
      created_at: record.get("created_at") || "Unknown Date",
    }));

    console.log("✅ Successfully fetched", data.length, "RFPs from Airtable.");
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Airtable Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch data from Airtable", details: error.message });
  }
}
