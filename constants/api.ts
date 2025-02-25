// constants/api.ts
// constants/api.ts

type VersionKey = 'versionRFP' | 'versionCyber';

interface VersionConfig {
  altiusAssistantId: string;
  airtableBaseId: string;
  airtableTableName: string;
}

const VERSION_CONFIG: Record<VersionKey, VersionConfig> = {
  versionRFP: {
    altiusAssistantId: '67212f6bf8bc9853980a8e6b',
    airtableBaseId: 'appO645FMzwrtH9G6',
    airtableTableName: 'RFPData'
  },
  versionCyber: {
    altiusAssistantId: '65495257c7b0f50850ebcce2',
    airtableBaseId: 'tblvbBcYJ3HEdm73u',
    airtableTableName: 'CyberData'
  }
};

export const getApiConfig = (version: VersionKey) => {
  const config = VERSION_CONFIG[version];
  
  return {
    ALLTIUS: {
      CHAT: 'https://app.alltius.ai/api/platform/v1/chat',
      DEFAULT_SESSION: 'new-session',
      DEFAULT_USER: 'test_user',
      ASSISTANT_ID: config.altiusAssistantId
    },
    AIRTABLE: {
      BASE_URL: (baseId: string, tableName: string) => 
        `https://api.airtable.com/v0/${baseId}/${tableName}`,
      RECORD_URL: (baseId: string, tableName: string, recordId: string) =>
        `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`,
      BASE_ID: config.airtableBaseId,
      TABLE_NAME: config.airtableTableName
    },
    INTERNAL: {
      FETCH_RFPS: '/api/fetch-rfps',
      UPDATE_RESPONSE: '/api/update-response',
      GENERATE_RESPONSE: '/api/alltius-generate-response',
      ANALYZE_RFP: '/api/alltius-get-analysis',
      SAVE_TO_AIRTABLE: '/api/save-to-airtable'
    }
  };
};