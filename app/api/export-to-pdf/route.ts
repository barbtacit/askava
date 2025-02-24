import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '@/constants/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.elements || !body.responses || !body.rfpTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: elements, responses, or rfpTitle' },
        { status: 400 }
      );
    }

    // Create HTML content for the PDF
    const htmlContent = generateHtml(body.rfpTitle, body.elements, body.responses);

    // Instead of generating a PDF directly, we'll return the HTML 
    // and use client-side library to convert it
    return NextResponse.json({ 
      success: true,
      htmlContent: htmlContent
    });
    
  } catch (error: any) {
    console.error('PDF Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF content', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateHtml(rfpTitle: string, elements: string[], responses: Record<number, string>) {
  const currentDate = new Date().toLocaleDateString();
  
  // Ensure responses content is properly escaped for HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br/>'); // Convert newlines to <br/> tags
  };
  
  const elementRows = elements.map((element, index) => {
    const responseText = responses[index] || 'No response provided';
    console.log(`Processing element ${index}: ${element.substring(0, 50)}...`);
    console.log(`Response content: ${responseText.substring(0, 50)}...`);
    
    return `
      <div class="response-section">
        <h3>Element ${index + 1}</h3>
        <div class="element-content">
          <p>${escapeHtml(element)}</p>
        </div>
        <div class="response-content">
          <h4>Response:</h4>
          <p>${escapeHtml(responseText)}</p>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>RFP Response: ${rfpTitle}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }
          .title {
            color: #5b21b6;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          .response-section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          h3 {
            color: #5b21b6;
            margin-bottom: 10px;
          }
          h4 {
            margin-top: 15px;
            margin-bottom: 10px;
            color: #666;
          }
          .element-content {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
          }
          .response-content {
            padding: 0 15px;
          }
          p {
            margin: 10px 0;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">RFP Response: ${rfpTitle}</h1>
          <p class="date">Generated on ${currentDate}</p>
        </div>
        
        ${elementRows}
        
        <div class="footer">
          <p>Generated by AskTacit RFP Assistant</p>
        </div>
      </body>
    </html>
  `;
}