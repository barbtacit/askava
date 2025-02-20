// lib/airtable.ts
import { API_ENDPOINTS } from '@/constants/api';
import { globalFetch } from '@/utils/globalFetch';
import { AirtableResponse, RFP } from '@/types';

export async function fetchRFPs(): Promise<RFP[]> {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    throw new Error('Missing required Airtable configuration');
  }

  const url = API_ENDPOINTS.AIRTABLE.BASE_URL(
    process.env.AIRTABLE_BASE_ID,
    process.env.AIRTABLE_TABLE_NAME
  );

  const response = await globalFetch<AirtableResponse>(url, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  });

  if (!response.success || !response.data?.records) {
    throw new Error('Failed to fetch RFPs from Airtable');
  }

  return response.data.records.map(record => ({
    id: record.id,
    rfp_title: record.fields.rfp_title || 'No Title',
    requesting_company: record.fields.requesting_company || 'Unknown Company',
    rfp_text: record.fields.rfp_text || 'No Text Available',
    rfp_elements: record.fields.rfp_elements || '',
    response: record.fields.response || '',
    status: record.fields.status || 'Pending',
    created_at: record.fields.created_at || record.createdTime
  }));
}

export async function updateRFPResponse(
  id: string, 
  responseText: string, 
  status: string
): Promise<any> {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_TABLE_NAME) {
    throw new Error('Missing required Airtable configuration');
  }

  const url = API_ENDPOINTS.AIRTABLE.RECORD_URL(
    process.env.AIRTABLE_BASE_ID,
    process.env.AIRTABLE_TABLE_NAME,
    id
  );

  return globalFetch(url, {
    method: 'PATCH',
    body: {
      fields: {
        response: responseText,
        status: status
      }
    },
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`
    }
  });
}