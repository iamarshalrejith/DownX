import axios from "axios";

export const simplifyInstruction = async (req, res) => {
  try {
    const { inputText } = req.body;

    if (!inputText) {
      return res.status(400).json({ message: "Missing inputText field" });
    }

    // System Instruction Prompt
    const systemInstruction = `You are a simplification assistant. Your job is to convert any given complex text into a step-by-step, human-friendly explanation.
       
Output Format:
Return ONLY a JSON array of strings, where each string is one simplified step. Do not include extra commentary, explanation, or metadata.

Example:
[
"Step 1: Identify the key concept.",
"Step 2: Break it down into smaller ideas.",
"Step 3: Explain it simply."
]`;

    // Gemini API Call with API key as query parameter
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\nSimplify this:\n${inputText}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json", // ensures pure JSON output
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extracting the generated text from Gemini
    const modelResponse =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!modelResponse) {
      throw new Error("No response from Gemini API");
    }

    // Parsing JSON steps
    let simplifiedSteps;
    try {
      simplifiedSteps = JSON.parse(modelResponse);
    } catch (error) {
      console.error("Failed to parse JSON from Gemini:", modelResponse);
      throw new Error("Gemini returned invalid JSON format");
    }

    // Return simplified steps
    return res.status(200).json({
      success: true,
      steps: simplifiedSteps,
    });
  } catch (error) {
    console.error("Gemini Simplification Error", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to simplify text",
    });
  }
};
