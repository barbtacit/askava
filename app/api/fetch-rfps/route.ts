import { NextResponse } from 'next/server';
import { globalFetch } from "@/utils/globalFetch";

export async function GET() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    console.error("❌ Missing required Airtable API credentials.");
    return NextResponse.json(
      { error: "Missing Airtable API Key, Base ID, or Table Name." },
      { status: 500 }
    );
  }

  try {
    console.log("📡 Fetching RFPs from Airtable...");

    const airtableURL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
    const data = await globalFetch(airtableURL, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    if (!data.success || !data.data?.records?.length) {
      console.warn("⚠️ No RFP records found in Airtable.");
      return NextResponse.json({ message: "No RFPs available." });
    }

    const formattedData = data.data.records.map((record) => ({
      id: record.id,
      rfp_title: record.fields.rfp_title || "No Title",
      requesting_company: record.fields.requesting_company || "Unknown Company",
      rfp_text: record.fields.rfp_text || "No Text Available",
      rfp_elements: record.fields.rfp_elements || "No Elements",
      response: record.fields.response || "No Response",
      created_at: record.fields.created_at || "Unknown Date",
    }));

    console.log("✅ Successfully fetched", formattedData.length, "RFPs from Airtable.");
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("❌ Airtable Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Airtable", details: error.message },
      { status: 500 }
    );
  }
}