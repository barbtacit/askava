import { NextResponse } from 'next/server';
import { globalFetch } from "@/utils/globalFetch";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, responseText, status } = body;

    if (!id || !responseText || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, responseText, status" },
        { status: 400 }
      );
    }

    console.log(`📡 Updating Airtable record ${id} with response: ${responseText} (Status: ${status})`);

    const airtableURL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}/${id}`;

    const response = await globalFetch(airtableURL, {
      method: 'PATCH',
      body: {
        fields: {
          response: responseText,
          status: status,
        },
      },
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    if (!response.success) {
      throw new Error(response.error);
    }

    return NextResponse.json({ message: "Response updated successfully", data: response.data });
  } catch (error) {
    console.error("❌ Airtable Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update response in Airtable", details: error.message },
      { status: 500 }
    );
  }
}