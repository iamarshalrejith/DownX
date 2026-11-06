import Student from "../models/Student.js";
import AIConversation from "../models/AIConversation.js";
import { generateAIResponse } from "../services/aiService.js";

const LEVEL_INSTRUCTIONS = {
  1: "Use very short sentences. Give only ONE simple action per step. Use familiar everyday words.",
  2: "Use short sentences and one action per step. Use simple, familiar words.",
  3: "Use clear, short sentences. Combine at most two closely related actions only when easy to follow.",
  4: "You may combine a few related actions when clear. Slightly richer vocabulary is fine.",
  5: "Use concise steps that group related actions, while remaining clear and concrete.",
};

const SIMPLIFICATION_PROMPT = `You are a curriculum assistant for a student with Down syndrome. Convert the supplied learning content into concrete, picturable steps.

Every step must focus on one real object, person, place, food, animal, letter, number or physical action. Do not write lesson introductions, summaries or statements about what will happen later. If the topic is broad, choose 5-8 common examples. Each step should be something the student can point to in a picture or physically do.

Return a JSON object with this exact shape: {"steps":["First concrete step.","Second concrete step."]}. Do not include markdown or extra fields.`;

const getStudentForUser = async (studentId, user) => {
  if (!studentId) return null;
  const student = await Student.findById(studentId).select("name difficultyLevel caretakers");
  if (!student) return null;

  const isStudent = user.role === "student" && String(user._id) === String(student._id);
  const isCaretaker = ["teacher", "parent"].includes(user.role) &&
    student.caretakers.some((id) => String(id) === String(user._id));

  if (!isStudent && !isCaretaker) {
    const error = new Error("You are not allowed to access this student's AI companion.");
    error.statusCode = 403;
    throw error;
  }
  return student;
};

export const simplifyInstruction = async (req, res) => {
  try {
    const { inputText, studentId } = req.body;
    if (typeof inputText !== "string" || !inputText.trim()) {
      return res.status(400).json({ success: false, message: "Missing inputText field" });
    }
    if (inputText.length > 5000) {
      return res.status(400).json({ success: false, message: "Please keep the instruction under 5000 characters." });
    }

    let difficultyLevel = Number(req.body.difficultyLevel) || 3;
    if (studentId) {
      const student = await getStudentForUser(studentId, req.user);
      if (!student) return res.status(404).json({ success: false, message: "Student not found" });
      difficultyLevel = student.difficultyLevel || 3;
    }
    if (!LEVEL_INSTRUCTIONS[difficultyLevel]) difficultyLevel = 3;

    const content = await generateAIResponse({
      messages: [
        { role: "system", content: `${SIMPLIFICATION_PROMPT}\n\nDifficulty level ${difficultyLevel}/5: ${LEVEL_INSTRUCTIONS[difficultyLevel]}` },
        { role: "user", content: `Simplify this learning content:\n${inputText.trim()}` },
      ],
      temperature: 0.2,
      maxTokens: 900,
      responseFormat: { type: "json_object" },
    });

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("The AI returned an invalid simplification format. Please try again.");
    }
    const steps = Array.isArray(parsed) ? parsed : parsed.steps;
    if (!Array.isArray(steps) || !steps.length || !steps.every((step) => typeof step === "string")) {
      throw new Error("The AI did not return valid learning steps. Please try again.");
    }

    return res.status(200).json({ success: true, steps, difficultyLevel });
  } catch (error) {
    console.error("AI simplification error:", error.message);
    return res.status(error.statusCode || 502).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to simplify the instruction. Please try again.",
    });
  }
};

const BUDDY_SYSTEM_PROMPT = `You are DownX Buddy, a warm, patient and encouraging learning companion for a student with Down syndrome.

Communication rules:
- Use simple, concrete, age-respectful language and short sentences.
- Give one idea or one action at a time.
- Be encouraging without being childish or overly enthusiastic.
- Never shame, pressure, diagnose, or make assumptions about the student.
- If the student seems confused, explain in a different and simpler way.
- Ask only one simple question at a time.
- For learning tasks, guide the student step by step and wait for their response before moving on.
- Do not claim to see, hear, or know anything that was not provided in the conversation.
- For safety, medical, emergency, or distress concerns, kindly encourage the student to speak to their teacher or parent. Do not try to handle emergencies yourself.
- Keep most replies to 1-4 short sentences.`;

export const chatWithBuddy = async (req, res) => {
  try {
    const { studentId, conversationId, message } = req.body;
    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Please enter a message." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ success: false, message: "Please keep your message under 2000 characters." });
    }

    const student = await getStudentForUser(studentId, req.user);
    if (!student) return res.status(400).json({ success: false, message: "A valid studentId is required." });

    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, student: student._id });
      if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found." });
    } else {
      conversation = new AIConversation({ student: student._id, createdBy: req.user._id, messages: [] });
    }

    const recentMessages = conversation.messages.slice(-12).map(({ role, content }) => ({ role, content }));
    const reply = await generateAIResponse({
      messages: [
        { role: "system", content: `${BUDDY_SYSTEM_PROMPT}\nStudent's first name: ${student.name}. Adapt explanations to difficulty level ${student.difficultyLevel || 3} out of 5.` },
        ...recentMessages,
        { role: "user", content: message.trim() },
      ],
      temperature: 0.5,
      maxTokens: 450,
    });

    conversation.messages.push(
      { role: "user", content: message.trim() },
      { role: "assistant", content: reply }
    );
    await conversation.save();

    return res.status(200).json({
      success: true,
      conversationId: conversation._id,
      reply,
      characterState: "speaking",
    });
  } catch (error) {
    console.error("AI Buddy chat error:", error.message);
    return res.status(error.statusCode || 502).json({
      success: false,
      message: error.statusCode ? error.message : "Your learning buddy could not respond. Please try again.",
    });
  }
};
