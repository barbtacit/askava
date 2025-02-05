import Airtable from "airtable";

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error("Missing Airtable API Key or Base ID. Check your .env.local file.");
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);

const table = base(process.env.AIRTABLE_TABLE_NAME);

export async function fetchRFPs() {
  try {
    const records = await table.select({ view: "Grid view" }).all();
    console.log("Fetched Airtable Records:", records);
    return records.map((record) => ({
      id: record.id,
      rfp_title: record.get("rfp_title"),
      requesting_company: record.get("requesting_company"),
      rfp_text: record.get("rfp_text"),
      rfp_elements: record.get("rfp_elements"),
      response: record.get("response"),
      created_at: record.get("created_at"),
    }));
  } catch (error) {
    console.error("Airtable Fetch Error:", error);
    return [];
  }
}
