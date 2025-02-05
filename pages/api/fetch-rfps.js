import Airtable from "airtable";

export default async function handler(req, res) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: "Missing Airtable API Key or Base ID" });
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );

  const table = base(process.env.AIRTABLE_TABLE_NAME);

  try {
    const records = await table.select({ view: "Grid view" }).all();
    const data = records.map((record) => ({
      id: record.id,
      rfp_title: record.get("rfp_title"),
      requesting_company: record.get("requesting_company"),
      rfp_text: record.get("rfp_text"),
      rfp_elements: record.get("rfp_elements"),
      response: record.get("response"),
      created_at: record.get("created_at"),
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("Airtable Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
