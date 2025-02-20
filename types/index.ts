// types/index.ts
export interface RFP {
    id: string;
    rfp_title: string;
    requesting_company: string;
    rfp_text: string;
    rfp_elements?: string;
    response?: string;
    status?: ResponseStatus;
    created_at?: string;
  }
  
  export type ResponseStatus = 'Pending' | 'Approved' | 'Rejected';
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    createdTime: string;
  }
  
  export interface AirtableResponse {
    records: AirtableRecord[];
    offset?: string;
  }