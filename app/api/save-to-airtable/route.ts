// app/api/save-to-airtable/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { element, response } = body;

    console.log("📥 Received request to save:", { element, response });

    if (!element || !response) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const airtableData = {
      records: [
        {
          fields: {
            rfp_element: element,
            rfp_response: response
            // Removed status field as per new requirements
            // created_at is handled automatically by Airtable
          }
        }
      ]
    };

    console.log("📤 Sending to AirTable:", airtableData);

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_NAME}`;
    
    const airtableResponse = await fetch(
      airtableUrl,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableData)
      }
    );

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.text();
      console.error('❌ AirTable Error Response:', errorData);
      return NextResponse.json(
        { error: `AirTable Error: ${errorData}` },
        { status: airtableResponse.status }
      );
    }

    const data = await airtableResponse.json();
    console.log("✅ Successfully saved to AirTable:", data);
    
    return NextResponse.json({
      success: true,
      record: data.records[0]
    });

  } catch (error) {
    console.error('🚨 Error saving to AirTable:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save to AirTable',
        details: error.message 
      },
      { status: 500 }
    );
  }
}