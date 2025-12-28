/**
 * Quiz Randomization Utilities
 * 
 * Provides functions to:
 * - Randomly select N questions from a pool
 * - Randomize the order of options for each question
 * - Use seeded randomization for consistency per user/attempt
 */

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: number | string;
  points: number;
  explanation?: string;
}

interface RandomizedQuestion {
  id: string;
  type: string;
  question: string;
  options: Array<{ id: string; text: string; originalIndex: number }>;
  correctAnswer: number; // New index after randomization
  points: number;
  explanation?: string;
  originalCorrectAnswer: number; // Store original for validation
}

/**
 * Seeded random number generator
 * Creates consistent random sequences based on a seed
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Generate a seed from user ID and attempt number
 */
function generateSeed(userId: string, attemptNumber: number): number {
  // Create a hash from userId and attempt number
  let hash = 0;
  const str = `${userId}-${attemptNumber}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Shuffle array using seeded random
 */
function seededShuffle<T>(array: T[], rng: SeededRandom): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Randomize questions and options for a quiz attempt
 * 
 * @param questions - All available questions from the quiz
 * @param questionsToShow - Number of questions to show (null = show all)
 * @param userId - User ID for seeded randomization
 * @param attemptNumber - Attempt number for this user (1, 2, 3, etc.)
 * @returns Randomized questions with shuffled options
 */
export function randomizeQuizQuestions(
  questions: Question[],
  questionsToShow: number | null,
  userId: string,
  attemptNumber: number
): RandomizedQuestion[] {
  if (questions.length === 0) {
    return [];
  }

  // Generate seed for consistent randomization per user/attempt
  const seed = generateSeed(userId, attemptNumber);
  const rng = new SeededRandom(seed);

  // Step 1: Select N random questions if questionsToShow is set
  let selectedQuestions: Question[];
  if (questionsToShow && questionsToShow < questions.length) {
    // Shuffle all questions and take first N
    const shuffled = seededShuffle(questions, rng);
    selectedQuestions = shuffled.slice(0, questionsToShow);
  } else {
    // Show all questions, but still shuffle the order
    selectedQuestions = seededShuffle(questions, rng);
  }

  // Step 2: For each question, randomize the option order
  const randomizedQuestions: RandomizedQuestion[] = selectedQuestions.map((question) => {
    if (!question.options || question.options.length === 0) {
      // For non-multiple-choice questions, return as-is
      return {
        ...question,
        options: [],
        correctAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
        originalCorrectAnswer: typeof question.correctAnswer === 'number' ? question.correctAnswer : 0,
      };
    }

    // Create option objects with original indices
    const optionsWithIndices = question.options.map((text, index) => ({
      id: `opt-${question.id}-${index}`,
      text,
      originalIndex: index,
    }));

    // Shuffle options using seeded random
    const shuffledOptions = seededShuffle(optionsWithIndices, rng);

    // Find the new index of the correct answer
    const originalCorrectIndex = typeof question.correctAnswer === 'number' 
      ? question.correctAnswer 
      : parseInt(String(question.correctAnswer)) || 0;

    const correctOptionOriginalIndex = originalCorrectIndex;
    const newCorrectIndex = shuffledOptions.findIndex(
      opt => opt.originalIndex === correctOptionOriginalIndex
    );

    return {
      id: question.id,
      type: question.type,
      question: question.question,
      options: shuffledOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        originalIndex: opt.originalIndex,
      })),
      correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      points: question.points,
      explanation: question.explanation,
      originalCorrectAnswer: originalCorrectIndex,
    };
  });

  return randomizedQuestions;
}

/**
 * Convert randomized question back to original format for submission
 * This is used when submitting answers to map back to original question IDs
 */
export function getOriginalQuestionId(randomizedQuestion: RandomizedQuestion): string {
  return randomizedQuestion.id;
}

/**
 * Get the original correct answer index from a randomized question
 */
export function getOriginalCorrectAnswer(randomizedQuestion: RandomizedQuestion): number {
  return randomizedQuestion.originalCorrectAnswer;
}

