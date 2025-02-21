// constants/api.ts
export const API_ENDPOINTS = {
  ALLTIUS: {
    CHAT: 'https://app.alltius.ai/api/platform/v1/chat',
    DEFAULT_SESSION: 'new-session',
    DEFAULT_USER: 'test_user'
  },
  AIRTABLE: {
    BASE_URL: (baseId: string, tableName: string) => 
      `https://api.airtable.com/v0/${baseId}/${tableName}`,
    RECORD_URL: (baseId: string, tableName: string, recordId: string) =>
      `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
    FORM_URL: 'https://airtable.com/appO645FMzwrtH9G6/pagAJu6rvcXRfL9as/form'
  },
  INTERNAL: {
    FETCH_RFPS: '/api/fetch-rfps',
    UPDATE_RESPONSE: '/api/update-response',
    GENERATE_RESPONSE: '/api/alltius-generate-response',
    ANALYZE_RFP: '/api/alltius-get-analysis'
  }
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE'
} as const;

export type ResponseStatus = 'Pending' | 'Approved' | 'Rejected';