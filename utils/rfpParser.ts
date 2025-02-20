// utils/rfpParser.ts
import { API_ENDPOINTS } from '@/constants/api';

export interface ParsedRFP {
  elements: string[];
  responses: Record<number, string>;
  rawResponse?: string;
}

/**
 * Sends an RFP to Alltius for parsing
 * @param rfpText The raw RFP text to parse
 * @returns The parsed RFP with elements and generated responses
 */
export async function parseRFPWithAI(rfpText: string): Promise<ParsedRFP> {
  if (!rfpText?.trim()) {
    throw new Error('No RFP text provided');
  }

  // Create a prompt that instructs Alltius how to process the RFP
  const prompt = `
Please analyze the following RFP (Request for Proposal) text and:
1. Extract all the questions or requirements that need responses
2. Generate a professional response for each extracted element

RFP TEXT:
${rfpText}

FORMAT YOUR RESPONSE AS:
## EXTRACTED ELEMENTS
1. [First question/requirement]
2. [Second question/requirement]
...

## RESPONSES
1. [Response to first element]
2. [Response to second element]
...
`;

  try {
    const response = await fetch(API_ENDPOINTS.INTERNAL.GENERATE_RESPONSE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: Failed to parse RFP`);
    }

    const data = await response.json();
    
    if (!data.success || !data.response) {
      throw new Error('Failed to get a valid response from AI assistant');
    }

    // Process the AI response to extract elements and responses
    return processAIResponse(data.response);
  } catch (error) {
    console.error('Error parsing RFP with AI:', error);
    throw error;
  }
}

/**
 * Processes the AI response to extract elements and responses
 * @param aiResponse The raw response from Alltius
 * @returns Structured elements and responses
 */
function processAIResponse(aiResponse: string): ParsedRFP {
  const elements: string[] = [];
  const responses: Record<number, string> = {};
  
  // Look for sections in the response
  const extractedElementsMatch = aiResponse.match(/## EXTRACTED ELEMENTS\n([\s\S]*?)(?=## RESPONSES|$)/);
  const responsesMatch = aiResponse.match(/## RESPONSES\n([\s\S]*?)(?=$)/);
  
  if (extractedElementsMatch && extractedElementsMatch[1]) {
    // Extract numbered elements, looking for patterns like "1. [question]"
    const elementLines = extractedElementsMatch[1].split('\n').filter(line => line.trim());
    
    elementLines.forEach(line => {
      // Match lines starting with a number followed by period and space
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match && match[1]) {
        elements.push(match[1].trim());
      }
    });
  }
  
  if (responsesMatch && responsesMatch[1]) {
    // Extract numbered responses
    const responseLines = responsesMatch[1].split('\n').filter(line => line.trim());
    let currentIndex = -1;
    let currentResponse = '';
    
    responseLines.forEach(line => {
      // Check if this line starts a new numbered response
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      
      if (match) {
        // If we were building a previous response, save it
        if (currentIndex >= 0 && currentResponse) {
          responses[currentIndex] = currentResponse.trim();
        }
        
        // Start a new response
        currentIndex = parseInt(match[1]) - 1; // Convert to zero-based index
        currentResponse = match[2];
      } else if (currentIndex >= 0) {
        // Continue building current response
        currentResponse += '\n' + line;
      }
    });
    
    // Save the last response
    if (currentIndex >= 0 && currentResponse) {
      responses[currentIndex] = currentResponse.trim();
    }
  }
  
  // Fallback parsing if the structured approach didn't work
  if (elements.length === 0) {
    // Simple fallback: split by newlines and filter empty lines
    const lines = aiResponse.split('\n').filter(line => line.trim());
    lines.forEach((line, index) => {
      elements.push(line);
      responses[index] = 'AI was unable to generate a response for this element.';
    });
  }
  
  return {
    elements,
    responses,
    rawResponse: aiResponse
  };
}