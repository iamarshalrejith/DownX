import axios from "axios";
import Student from "../models/Student.js";

// Difficulty level (1-5, see Student.difficultyLevel) -> prompt instructions.
// Level 1: maximum simplification. Level 5: minimum simplification.
const LEVEL_INSTRUCTIONS = {
  1: "Use very short sentences with only ONE simple action per step. Use the simplest possible everyday words. Avoid combining actions in a single step, even if that means more steps.",
  2: "Use short sentences with one action per step. Use simple, familiar words.",
  3: "Use clear, short sentences. Combine at most two closely related actions into a step only when it stays easy to follow.",
  4: "You may combine a few related actions into a single step where it still stays clear. Slightly richer vocabulary is fine.",
  5: "You may write fewer, more compact steps that group several related actions together, since the student is comfortable with more independence.",
};

export const simplifyInstruction = async (req, res) => {
  try {
    const { inputText, studentId } = req.body;
    let { difficultyLevel } = req.body;

    if (!inputText) {
      return res.status(400).json({ message: "Missing inputText field" });
    }

    // Prefer the student's live adaptive level over anything the client sent,
    // so the frontend can't accidentally send a stale value.
    if (studentId) {
      const student = await Student.findById(studentId).select(
        "difficultyLevel"
      );
      if (student) difficultyLevel = student.difficultyLevel;
    }

    if (!difficultyLevel || !LEVEL_INSTRUCTIONS[difficultyLevel]) {
      difficultyLevel = 3;
    }

    // System Instruction Prompt
    const systemInstruction = `You are a simplification assistant for students with Down syndrome. Your job is to convert any given complex text into a step-by-step, human-friendly explanation.

Difficulty level for this student: ${difficultyLevel}/5. ${LEVEL_INSTRUCTIONS[difficultyLevel]}
       
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
      difficultyLevel,
    });
  } catch (error) {
    console.error("Gemini Simplification Error", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to simplify text",
    });
  }
};