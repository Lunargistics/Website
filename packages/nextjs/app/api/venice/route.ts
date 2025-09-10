import { NextRequest, NextResponse } from 'next/server';

const VENICE_API_KEY = process.env.VENICE_API_KEY;
const VENICE_API_URL = 'https://api.venice.ai/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!VENICE_API_KEY) {
      return NextResponse.json(
        { error: 'Venice AI not configured' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'analyzeDocument':
        return await analyzeDocument(data);
      
      case 'analyzeMission':
        return await analyzeMission(data);
      
      case 'smartSearch':
        return await smartSearch(data);
      
      case 'validateAccess':
        return await validateAccess(data);
      
      case 'predictTimeline':
        return await predictTimeline(data);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Venice API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeDocument(data: any) {
  const { content, documentType, missionName } = data;
  
  const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'You are a space mission compliance expert. Analyze documents for regulatory compliance, safety risks, and completeness.'
        },
        {
          role: 'user',
          content: `Analyze this ${documentType} for mission "${missionName}". Provide brief compliance assessment and key risks.`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  });

  const result = await response.json();
  return NextResponse.json({
    analysis: result.choices[0].message.content
  });
}

async function analyzeMission(data: any) {
  const { documents } = data;
  
  const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'Evaluate space mission readiness based on documentation.'
        },
        {
          role: 'user',
          content: `Assess mission readiness with these documents: ${JSON.stringify(documents)}. Provide risk level and recommendations.`
        }
      ],
      temperature: 0.3,
      max_tokens: 400
    })
  });

  const result = await response.json();
  return NextResponse.json({
    analysis: result.choices[0].message.content
  });
}

async function smartSearch(data: any) {
  const { query, documents } = data;
  
  const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'Find relevant documents based on natural language queries.'
        },
        {
          role: 'user',
          content: `Find documents matching: "${query}" from: ${JSON.stringify(documents)}. Return matching document IDs.`
        }
      ],
      temperature: 0.2,
      max_tokens: 200
    })
  });

  const result = await response.json();
  return NextResponse.json({
    matches: result.choices[0].message.content
  });
}

async function validateAccess(data: any) {
  const { documentId, recipient, documentType } = data;
  
  const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'You are a compliance expert. Validate if document access grants are appropriate for space missions.'
        },
        {
          role: 'user',
          content: `Validate access grant for ${documentType} document #${documentId} to recipient ${recipient}. Check: 1) Is this a valid organization? 2) Do they typically need this document type? 3) Any compliance concerns? Provide brief assessment.`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    })
  });

  const result = await response.json();
  return NextResponse.json({
    analysis: result.choices[0].message.content,
    valid: !result.choices[0].message.content.toLowerCase().includes('concern')
  });
}

async function predictTimeline(data: any) {
  const { currentProgress } = data;
  
  const response = await fetch(`${VENICE_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VENICE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        {
          role: 'system',
          content: 'Predict space mission timeline based on document readiness and compliance status.'
        },
        {
          role: 'user',
          content: `Current mission progress: ${currentProgress}%. Predict time to launch readiness. Consider typical space mission timelines, regulatory review periods, and documentation completeness. Provide estimate in weeks.`
        }
      ],
      temperature: 0.4,
      max_tokens: 100
    })
  });

  const result = await response.json();
  return NextResponse.json({
    prediction: result.choices[0].message.content
  });
}