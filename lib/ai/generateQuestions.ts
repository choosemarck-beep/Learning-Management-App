import { getGeminiClient } from "./gemini";

/**
 * Question interface matching the QuizBuilder Question type
 */
export interface Question {
  id: string;
  type: "multiple-choice";
  question: string;
  options: string[]; // 4 options
  correctAnswer: number; // index of correct answer (0-3)
  points: number;
  explanation?: string;
}

/**
 * Generate a unique question ID
 */
function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate generated questions structure
 */
function validateQuestions(questions: any[]): questions is Question[] {
  if (!Array.isArray(questions) || questions.length !== 10) {
    return false;
  }

  for (const q of questions) {
    if (
      typeof q !== "object" ||
      !q.question ||
      typeof q.question !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "number" ||
      q.correctAnswer < 0 ||
      q.correctAnswer > 3 ||
      typeof q.points !== "number"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Extract JSON from Gemini response text
 */
function extractJSON(text: string): any {
  let jsonText = text.trim();

  // Remove markdown code blocks if present
  jsonText = jsonText.replace(/^```json\s*/i, "");
  jsonText = jsonText.replace(/^```\s*/i, "");
  jsonText = jsonText.replace(/\s*```$/i, "");

  // Try to find JSON array in text
  const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate 10 multiple-choice questions using Gemini AI
 * @param title - Training or mini-training title
 * @param description - Optional description or short description
 * @returns Array of 10 questions
 */
export async function generateQuestions(
  title: string,
  description?: string | null
): Promise<Question[]> {
  try {
    const genAI = await getGeminiClient();

    if (!genAI) {
      throw new Error("Gemini AI is not available. Please set GEMINI_API_KEY environment variable.");
    }

    // gemini-pro doesn't work with v1beta API
    // Use gemini-1.5-flash which is the current stable, fast model
    // This model works with the current API version
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build context from title and description
    const context = description
      ? `Title: ${title}\nDescription: ${description}`
      : `Title: ${title}`;

    // Escape special characters for JSON
    const escapedContext = context.replace(/"/g, '\\"').replace(/\n/g, " ");

    const prompt = `You are an educational content creator. Generate exactly 10 multiple-choice questions based on the following training topic:

${context}

REQUIREMENTS:
1. Generate exactly 10 questions (no more, no less)
2. Each question must have exactly 4 options (A, B, C, D)
3. One option must be the correct answer, the other 3 should be plausible distractors
4. Questions should test understanding of the topic, not just memorization
5. Questions should cover different aspects of the topic
6. Include a brief explanation for each question (REQUIRED - explain why the correct answer is correct)
7. Make questions clear, concise, and educational
8. Ensure correctAnswer is a number (0, 1, 2, or 3) representing the index of the correct option

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "points": 1,
    "explanation": "Brief explanation of why the correct answer is correct"
  },
  ...
]

IMPORTANT:
- correctAnswer must be a number (0, 1, 2, or 3) representing the index of the correct option
- All 10 questions must be included
- Return ONLY the JSON array, no additional text or markdown
- Questions should be relevant to the topic: "${title}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract and parse JSON
    let parsed;
    try {
      parsed = extractJSON(text);
    } catch (parseError) {
      console.error(`Failed to parse Gemini response. Raw text (first 500 chars):`, text.substring(0, 500));
      throw new Error(`Failed to parse JSON from Gemini response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }

    if (!Array.isArray(parsed)) {
      console.error(`Gemini response is not an array. Received:`, typeof parsed, parsed);
      throw new Error(`Response is not an array. Received type: ${typeof parsed}`);
    }

    if (parsed.length !== 10) {
      console.warn(`Gemini returned ${parsed.length} questions instead of 10`);
    }

    // Transform to match Question interface
    const questions: Question[] = parsed.map((q: any) => ({
      id: generateQuestionId(),
      type: "multiple-choice" as const,
      question: q.question || "",
      options: q.options || [],
      correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : parseInt(q.correctAnswer) || 0,
      points: q.points || 1,
      explanation: q.explanation || "",
    }));

    // Validate structure
    if (!validateQuestions(questions)) {
      throw new Error("Generated questions do not match required structure");
    }

    // Log summary of generated questions
    console.log(`   ✅ Generated ${questions.length} questions with:`);
    console.log(`      - Question text: ✓`);
    console.log(`      - 4 options each: ✓`);
    console.log(`      - Correct answers: ✓`);
    console.log(`      - Explanations: ${questions.filter(q => q.explanation).length}/${questions.length}`);

    return questions;
  } catch (error) {
    console.error(`Error generating questions for "${title}":`, error);
    throw error;
  }
}

