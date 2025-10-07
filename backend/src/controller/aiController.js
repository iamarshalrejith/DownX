import axios from "axios";

export const simplifyInstruction = async (req, res) => {
  try {
    const { inputText } = req.body;

    if (!inputText) {
      return res.status(400).json({ error: "Missing inputText field" });
    }

    // System Instruction Prompt
    const systemInstruction = `You are a simplification assistant. Your job is to convert any given complex text into a step-by-step, human-friendly explanation.
       
       Output Format:
       Return ONLY a JSON array of strings, where each string is one simplified step.Do not include extra commentary,explanation, or metadata.
       
       Example:
       [
       "Step 1: Identify the key concept.",
       "Step 2: Break it down into smaller ideas.",
       "Step 3: Explain it simply."
       ]`;

    // Gemini API Call
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
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
            temperature:0.3,
            responseMimeType: "application/json" // tells gemini to reply in pure JSON format
        }
      },
      {
        headers:{
            "Content-Type":"application/json",
            Authorization: `Bearer ${process.env.GEMINI_API_KEY}`
        }
      }
    );

    // parsing the response JSON
    const modelResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if(!modelResponse){
        throw new Error("No response from Gemini API");
    }

    let simplifiedSteps;

    try{
        simplifiedSteps = JSON.parse(modelResponse);
    } catch (error){
        console.error("Failed to parse JSON from Gemini:",modelResponse);
        throw new Error("Gemini returned invalid JSON format");
    }


    res.status(200).json({
      success: true,
      steps: simplifiedSteps,
    });
  } catch (error) {
    console.error("Gemini Simplification Error", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to simplify text",
    });
  }
};
