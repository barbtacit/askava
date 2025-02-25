import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '@/constants/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const version = body.version || 'versionRFP'; // Default to RFP version if not specified
    
    if (!body.element || !body.response) {
      return NextResponse.json(
        { error: 'Missing required fields: element or response' },
        { status: 400 }
      );
    }

    const API_ENDPOINTS = getApiConfig(version);
    const airtableEndpoint = API_ENDPOINTS.AIRTABLE.BASE_URL(
      API_ENDPOINTS.AIRTABLE.BASE_ID,
      API_ENDPOINTS.AIRTABLE.TABLE_NAME
    );

    // Prepare the data for Airtable using the correct field names
    // Note: Fields might have different names depending on the version
    const airtableData = {
      fields: version === 'versionCyber' 
        ? {
            "cyber_question": body.element,
            "cyber_response": body.response,
          }
        : {
            "rfp_element": body.element,
            "rfp_response": body.response,
          }
    };

    console.log(`Sending to Airtable (${version}):`, JSON.stringify(airtableData, null, 2));

    const airtableResponse = await fetch(airtableEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData),
    });

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      console.error("Airtable error details:", errorData);
      return NextResponse.json(
        { error: `Airtable error: ${errorData.error?.message || 'Unknown error'}` },
        { status: airtableResponse.status }
      );
    }

    const data = await airtableResponse.json();
    return NextResponse.json({ 
      recordId: data.id,
      success: true 
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}