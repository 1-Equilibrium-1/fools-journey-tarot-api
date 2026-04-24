export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, cards } = req.body;

  if (!question || !cards) {
    return res.status(400).json({ error: 'Missing question or cards' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
You are a calm and insightful tarot reader.

User question:
${question}

Cards drawn:
${cards.map(c => `${c.name} (${c.position || 'single'})`).join(', ')}

Provide a thoughtful, grounded, and supportive tarot reading.
Do not claim certainty. Keep it reflective and practical.
        `,
      }),
    });

    const data = await response.json();

    return res.status(200).json({
      reading: data.output[0].content[0].text,
    });

  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
