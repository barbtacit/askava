import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '@/constants/api';

export async function GET(request: NextRequest) {
  try {
    // Get version from query parameter, default to RFP version
    const searchParams = request.nextUrl.searchParams;
    const version = searchParams.get('version') || 'versionRFP';
    
    const API_ENDPOINTS = getApiConfig(version as 'versionRFP' | 'versionCyber');
    const airtableEndpoint = API_ENDPOINTS.AIRTABLE.BASE_URL(
      API_ENDPOINTS.AIRTABLE.BASE_ID,
      API_ENDPOINTS.AIRTABLE.TABLE_NAME
    );

    const airtableResponse = await fetch(airtableEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!airtableResponse.ok) {
      const errorData = await airtableResponse.json();
      return NextResponse.json(
        { error: `Airtable error: ${errorData.error?.message || 'Unknown error'}` },
        { status: airtableResponse.status }
      );
    }

    const data = await airtableResponse.json();
    console.log(`First record from Airtable (${version}):`, data.records.length > 0 ? data.records[0] : "No records");
    
    // Transform Airtable records to a more usable format based on version
    const transformedRecords = data.records.map((record: any) => {
      if (version === 'versionCyber') {
        return {
          id: record.id,
          question: record.fields.cyber_question || '',
          response: record.fields.cyber_response || '',
          createdTime: record.createdTime
        };
      } else {
        // RFP version
        return {
          id: record.id,
          question: '', // No question field in RFP AirTable
          element: record.fields.rfp_element || '',
          response: record.fields.rfp_response || '',
          createdTime: record.createdTime,
          status: 'Pending' // No status field in AirTable
        };
      }
    });

    return NextResponse.json({ 
      records: transformedRecords,
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