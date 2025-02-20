// app/api/alltius-generate-response/route.ts
import { NextResponse } from 'next/server';

/**
 * Processes an RFP using the Alltius AI assistant
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, chatSession = "new-session", userIdentifier = "test_user" } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt in request body" },
        { status: 400 }
      );
    }

    if (!process.env.ALLTIUS_API_KEY || !process.env.ALLTIUS_ASSISTANT_ID) {
      console.error("Missing Alltius API configuration");
      return NextResponse.json(
        { error: "Alltius API not properly configured" },
        { status: 500 }
      );
    }

    // Log request details for debugging
    console.log("📤 Processing RFP with Alltius AI...");
    console.log("➡️ Assistant ID:", process.env.ALLTIUS_ASSISTANT_ID);
    console.log("➡️ User Identifier:", userIdentifier);
    console.log("➡️ Chat Session:", chatSession);
    console.log("➡️ Prompt Length:", prompt.length, "characters");

    const response = await fetch("https://app.alltius.ai/api/platform/v1/chat", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ALLTIUS_API_KEY}`
      },
      body: JSON.stringify({
        post: prompt,
        assistant_id: process.env.ALLTIUS_ASSISTANT_ID,
        post_metadata: {
          source: "epi_rfp_tool",
          timestamp: new Date().toISOString()
        },
        chat_session: chatSession,
        user_identifier: userIdentifier
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Alltius API HTTP Error: ${response.status}`, errorText);
      return NextResponse.json(
        { 
          error: `Alltius API Error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    // Parse response
    const responseText = await response.text();
    console.log("📥 Received response from Alltius API");
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("❌ Failed to parse Alltius response as JSON:", error);
      console.error("Raw response:", responseText);
      return NextResponse.json(
        { 
          error: "Invalid JSON response from Alltius", 
          details: responseText.substring(0, 500) // Limit for security
        },
        { status: 500 }
      );
    }

    if (!data || !data.response) {
      console.error("❌ No valid AI response from Alltius:", data);
      return NextResponse.json(
        { 
          error: "No valid AI response received", 
          details: JSON.stringify(data).substring(0, 500) // Limit for security
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      response: data.response,
      id: data.id,
      intent_type: data.intent_type
    });

  } catch (error) {
    console.error("🚨 Alltius Integration Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process RFP with Alltius", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}