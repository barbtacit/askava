/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
      AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
      AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
      AIRTABLE_TABLE_NAME: process.env.AIRTABLE_TABLE_NAME,
      ALLTIUS_API_KEY: process.env.ALLTIUS_API_KEY,
      ALLTIUS_ASSISTANT_ID: process.env.ALLTIUS_ASSISTANT_ID,
    },
  };
  
  module.exports = nextConfig;
  