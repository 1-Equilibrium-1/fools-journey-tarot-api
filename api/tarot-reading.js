export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, cards, spreadType } = req.body;

  if (!cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing cards array' });
  }

  try {
    const cardSummary = cards
      .map(
        (c) =>
          `${c.position}: ${c.name} (${c.orientation}) — ${c.meaning}`
      )
      .join('\n');

    let prompt = '';

    // ⭐ SHORT (Daily + Three Card)
    if (spreadType === 'daily' || spreadType === 'three-card') {
      prompt = `
You are a calm and insightful tarot reader.

User question:
${question || 'General guidance'}

Cards:
${cardSummary}

Provide a short, clear, grounded response.
Keep it under 120 words.
Write in a direct and personal tone.
Avoid repetition.
End with one simple actionable takeaway.
`;
    }

    // ⭐ LONG (Celtic Cross)
    else if (spreadType === 'celtic-cross') {
      prompt = `
You are an expert tarot reader providing a deep, structured Celtic Cross interpretation.

User question:
${question || 'General life guidance'}

Cards:
${cardSummary}

Write a detailed interpretation (300–500 words).

Structure:
- Overall energy of the situation
- Key tensions or challenges
- What is influencing the situation (past / subconscious)
- What is emerging or developing
- Guidance moving forward

Style:
- Personal and insightful
- Clear and grounded (not fluffy)
- Do NOT repeat meanings card-by-card
- Weave the cards into one story

End with a clear, practical takeaway.
`;
    }

    // fallback
    else {
      prompt = `
You are a tarot reader.

Cards:
${cardSummary}

Provide a helpful interpretation.
`;
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: 'OpenAI request failed',
        details: data,
      });
    }

    const reading = data.output?.[0]?.content?.[0]?.text;

    if (!reading) {
      return res.status(500).json({ error: 'No reading returned' });
    }

    return res.status(200).json({ reading });
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
