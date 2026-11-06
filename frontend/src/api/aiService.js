import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const sendBuddyMessage = async ({
  studentId,
  conversationId,
  message,
  token,
}) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/ai/chat`,
      {
        studentId,
        conversationId,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "I couldn't connect right now. Please try again.";

    throw new Error(message);
  }
};