export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, cards } = req.body;

  if (!question || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing question or cards' });
  }

  try {
    const prompt = `
You are a calm and insightful tarot reader.

Use the provided card meaning as the foundation.

User question:
${question}

Cards drawn:
${cards.map(c => `${c.name} (${c.orientation || 'Upright'})`).join(', ')}

Card meaning:
${cards.map(c => c.meaning || '').join('\n')}

Provide a short, clear, grounded response.
Keep it under 120 words.
Write in a direct and personal tone.
Avoid repeating ideas.
Make it feel like guidance, not an essay.
End with one simple, actionable takeaway.
Do not claim certainty.
`;

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
      return res.status(500).json({ error: 'OpenAI request failed', details: data });
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
