// app/api/alltius-generate-response/route.ts
import { NextResponse } from 'next/server';

/**
 * Processes a request using the Alltius AI assistant
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

    if (!process.env.ALLTIUS_API_KEY) {
      console.error("Missing Alltius API key");
      return NextResponse.json(
        { error: "Alltius API not properly configured" },
        { status: 500 }
      );
    }

    // Extract assistant ID from request for multi-assistant support
    const assistantId = body.assistantId || process.env.ALLTIUS_ASSISTANT_ID;
    if (!assistantId) {
      console.error("No assistant ID provided or configured");
      return NextResponse.json(
        { error: "Alltius assistant ID not provided or configured" },
        { status: 500 }
      );
    }

    // Log request details for debugging
    console.log("📤 Processing request with Alltius AI...");
    console.log("➡️ Assistant ID:", assistantId);
    console.log("➡️ User Identifier:", userIdentifier);
    console.log("➡️ Chat Session:", chatSession);
    console.log("➡️ Prompt Length:", prompt.length, "characters");

    // Prepare the request body for Alltius
    const alltius_body = {
      post: prompt,
      assistant_id: assistantId,
      post_metadata: {
        source: "epi_tool",
        timestamp: new Date().toISOString()
      },
      chat_session: chatSession,
      user_identifier: userIdentifier
    };
    
    console.log("Sending to Alltius:", JSON.stringify(alltius_body, null, 2));

    try {
      const response = await fetch("https://app.alltius.ai/api/platform/v1/chat", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": process.env.ALLTIUS_API_KEY
        },
        body: JSON.stringify(alltius_body),
      });

      // First get the raw text response for logging
      const responseText = await response.text();
      console.log("📥 Raw response from Alltius API:", responseText.substring(0, 500) + "...");
      
      // Parse the response if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error("❌ Failed to parse Alltius response as JSON:", error);
        return NextResponse.json(
          { 
            error: "Invalid JSON response from Alltius", 
            details: responseText.substring(0, 500)
          },
          { status: 500 }
        );
      }

      // Handle HTTP errors
      if (!response.ok) {
        console.error(`❌ Alltius API HTTP Error: ${response.status}`, data);
        return NextResponse.json(
          { 
            error: `Alltius API Error: ${response.status}`,
            details: data.error || "Unknown error"
          },
          { status: response.status }
        );
      }

      if (!data || !data.response) {
        console.error("❌ No valid AI response from Alltius:", data);
        return NextResponse.json(
          { 
            error: "No valid AI response received", 
            details: JSON.stringify(data)
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
    } catch (fetchError: any) {
      console.error("🚨 Alltius API Fetch Error:", fetchError);
      return NextResponse.json(
        { 
          error: "Failed to connect to Alltius API", 
          details: fetchError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("🚨 Request Processing Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}