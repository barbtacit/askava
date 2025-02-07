import { globalFetch } from "@/utils/globalFetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { id, responseText, status } = req.body;

  if (!id || !responseText || !status) {
    return res.status(400).json({ error: "Missing required fields: id, responseText, status" });
  }

  try {
    console.log(`📡 Updating Airtable record ${id} with response: ${responseText} (Status: ${status})`);

    const airtableURL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${id}`;

    const updatedRecord = await globalFetch(airtableURL, "PATCH", {
      fields: {
        response: responseText,
        status: status, // "Pending" or "Approved"
      },
    }, {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    });

    res.status(200).json({ message: "Response updated successfully", updatedRecord });
  } catch (error) {
    console.error("❌ Airtable Update Error:", error);
    res.status(500).json({ error: "Failed to update response in Airtable", details: error.message });
  }
}
