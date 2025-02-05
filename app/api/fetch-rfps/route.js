import { NextResponse } from "next/server";
import Airtable from "airtable";

export async function GET() {
    return new Response(JSON.stringify({ message: "API is working!" }), {
      headers: { "Content-Type": "application/json" },
    });
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

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Airtable Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
