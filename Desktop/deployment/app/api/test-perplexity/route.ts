import { NextResponse } from 'next/server';
import { callPerplexity } from '../../../lib/ai-client';

/**
 * Test endpoint to check if Perplexity API is working
 * Visit: /api/test-perplexity
 */
export async function GET(request: Request) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'PERPLEXITY_API_KEY not found in environment variables',
        hasKey: false,
      });
    }

    // Try a simple test call to Perplexity
    const testPrompt = 'Say "API is working" if you can read this.';
    
    const response = await callPerplexity({
      messages: [
        { role: 'user', content: testPrompt }
      ]
    });

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyLength: apiKey.length,
      keyPreview: `${apiKey.substring(0, 10)}...`,
      response: response,
      message: 'Perplexity API is working correctly!'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      hasKey: !!process.env.PERPLEXITY_API_KEY,
      error: error.message,
      errorCode: error.code,
      errorStatus: error.response?.status,
      errorData: error.response?.data,
      message: 'Perplexity API call failed',
      fullError: String(error),
    }, { status: 500 });
  }
}
