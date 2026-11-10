
async function generateAnswer(question, context) {
    const prompt = `
You are the official PSG Tech college assistant chatbot.

Answer using ONLY the website information below.
Do not invent facts.

If the information does not contain the answer, say:
"I couldn't find this information on the PSG Tech website."

Website information:
${context}

Student question:
${question}

Provide a clear and helpful answer.
`;

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Gemini request: attempt ${attempt}`);

            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": process.env.GEMINI_API_KEY
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }]
                            }
                        ]
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                const error = new Error(
                    result.error?.message || "Gemini API failed"
                );

                error.status = response.status;
                throw error;
            }

            const answer = result.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

            if (!answer) {
                throw new Error("Gemini returned an empty answer.");
            }

            return answer;

        } catch (error) {
            const retryable =
                [408, 429, 500, 502, 503, 504].includes(error.status);

            if (!retryable || attempt === maxRetries) {
                throw error;
            }

            const delay = 1000 * Math.pow(2, attempt - 1);

            console.log(`Temporary error. Retrying in ${delay / 1000} seconds...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { generateAnswer };
