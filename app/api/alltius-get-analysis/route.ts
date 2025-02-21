// app/api/alltius-get-analysis/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rfpTitle: question } = body;

    if (!process.env.ALLTIUS_API_KEY || !process.env.ALLTIUS_ASSISTANT_ID) {
      return NextResponse.json(
        { error: "API credentials not found" },
        { status: 500 }
      );
    }

    const requestBody = {
      post: question,
      assistant_id: process.env.ALLTIUS_ASSISTANT_ID,
      post_metadata: {
        source: "epi_rfp_tool",
        timestamp: new Date().toISOString()
      }
    };

    const response = await fetch("https://app.alltius.ai/api/platform/v1/chat", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": process.env.ALLTIUS_API_KEY
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (response.status === 401) {
      return NextResponse.json({
        error: "Authentication Error",
        details: "Failed to authenticate with Alltius API",
        status: response.status
      }, { status: 401 });
    }

    try {
      const data = JSON.parse(responseText);
      
      if (!data.response) {
        return NextResponse.json({
          error: "Invalid Response",
          details: "No response field in data",
          data: data
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        elements: [data.response],
        id: data.id,
        intent_type: data.intent_type
      });

    } catch (error) {
      return NextResponse.json({
        error: "Parse Error",
        details: error.message,
        responseText: responseText.substring(0, 500)
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json({
      error: "Server Error",
      details: error.message
    }, { status: 500 });
  }
}