interface Env {
	AI: {
		run(
			model: string,
			input: { messages: Array<{ role: string; content: string }> },
		): Promise<{ response: string }>;
	};
}

const SYSTEM_PROMPT = `You are Bhaav, the friendly AI assistant for CodeBhaav — a student-led tech community from Amravati, India.

About CodeBhaav:
- Founded by a self-taught developer from a tier-3 city
- Focused on learning by building real projects, not watching tutorials
- Open source, community-first, no fake guru energy
- For students, professionals, and self-learners alike
- Values: authenticity, practical learning, inclusivity, open source

You answer questions about CodeBhaav conversationally. Keep responses concise (2-3 sentences max), warm, and honest. Use casual language. You can mention the waitlist if relevant.`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { messages } = (await context.request.json()) as {
		messages: Array<{ role: string; content: string }>;
	};

	const response = await context.env.AI.run(
		"@cf/meta/llama-3.1-8b-instruct",
		{
			messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
		},
	);

	return new Response(JSON.stringify({ message: response.response }), {
		headers: { "Content-Type": "application/json" },
	});
};
