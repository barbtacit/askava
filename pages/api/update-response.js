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

    const updatedRecord = await globalFetch(
      airtableURL,
      "PATCH",
      {
        fields: {
          response: responseText,
          status: status, // "Pending" or "Approved"
        },
      },
      {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json", // Explicitly set Content-Type for PATCH
      }
    );

    console.log("✅ Airtable Update Successful. Updated record details:", updatedRecord); // Log more details if needed

    res.status(200).json({ message: "Response updated successfully", updatedRecord });

  } catch (error) {
    console.error("❌ Airtable Update Error:", error);

    // More detailed error response for debugging
    let errorMessage = "Failed to update response in Airtable";
    if (error instanceof Error) { // Check if error is an Error object
      errorMessage += `: ${error.message}`;
    } else if (typeof error === 'string') { // Handle string errors if thrown by globalFetch
      errorMessage += `: ${error}`;
    } else if (typeof error === 'object' && error !== null) { // Check for error object (e.g., JSON response from Airtable)
      if (error.error && error.error.message) {
        errorMessage = `Airtable Error: ${error.error.message}`; // Use Airtable's specific error message if available
      } else {
        errorMessage += `: ${JSON.stringify(error)}`; // Fallback to stringifying the error object
      }
    }

    res.status(500).json({ error: errorMessage, details: error }); // Include more error details in response
  }
}