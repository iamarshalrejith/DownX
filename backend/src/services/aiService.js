import axios from "axios";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Single provider boundary for DownX AI features.
 * Keep provider-specific HTTP details in this file so the app can switch
 * providers without changing controllers or the frontend.
 */
export const generateAIResponse = async ({
  messages,
  temperature = 0.4,
  maxTokens = 700,
  responseFormat,
}) => {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

  try {
    const { data } = await axios.post(
      GROQ_CHAT_URL,
      {
        model,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("The AI provider returned an empty response.");
    }

    return content.trim();
  } catch (error) {
    const providerMessage =
      error.response?.data?.error?.message || error.message;
    console.error("Groq API request failed:", providerMessage);

    const wrapped = new Error(
      error.response?.status === 429
        ? "The AI service is busy right now. Please wait a moment and try again."
        : error.response?.status === 401
          ? "The AI service configuration is invalid. Please contact your administrator."
          : "The AI service could not respond. Please try again."
    );
    wrapped.statusCode = error.response?.status === 429 ? 429 : 502;
    throw wrapped;
  }
};
