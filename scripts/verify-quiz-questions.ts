/**
 * Script to verify quiz questions in the database
 * Usage: npm run verify-questions
 * 
 * This script checks:
 * - If questions exist for each training and mini-training
 * - If the question format matches QuizBuilder expectations
 * - If questions can be parsed correctly
 */

// Load environment variables from .env file (if accessible)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
} catch (error) {
  // dotenv not installed, try manual loading
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const lines = envContent.split("\n");
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith("#")) {
          const equalIndex = trimmedLine.indexOf("=");
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            let value = trimmedLine.substring(equalIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      }
    }
  } catch (loadError) {
    // If we can't load .env, environment variables should be set in the system
    console.warn("Could not load .env file. Make sure DATABASE_URL is set in your environment.");
  }
}

import { prisma } from "../lib/prisma/client";

interface Question {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  explanation?: string;
}

function validateQuestionFormat(q: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!q.id || typeof q.id !== "string") {
    errors.push("Missing or invalid 'id' field");
  }
  if (!q.type || q.type !== "multiple-choice") {
    errors.push("Missing or invalid 'type' field (must be 'multiple-choice')");
  }
  if (!q.question || typeof q.question !== "string") {
    errors.push("Missing or invalid 'question' field");
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push("Missing or invalid 'options' field (must be array of 4 strings)");
  } else {
    q.options.forEach((opt: any, idx: number) => {
      if (typeof opt !== "string") {
        errors.push(`Option ${idx} is not a string`);
      }
    });
  }
  if (typeof q.correctAnswer !== "number" || q.correctAnswer < 0 || q.correctAnswer > 3) {
    errors.push("Missing or invalid 'correctAnswer' field (must be number 0-3)");
  }
  if (typeof q.points !== "number") {
    errors.push("Missing or invalid 'points' field");
  }
  // explanation is optional

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function verifyQuestions() {
  try {
    console.log("🔍 Verifying quiz questions in database...\n");

    // Check trainings
    const trainings = await prisma.training.findMany({
      include: {
        quiz: true,
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📚 Found ${trainings.length} training(s)\n`);

    let trainingWithQuestions = 0;
    let trainingWithoutQuestions = 0;
    let trainingFormatErrors = 0;

    for (const training of trainings) {
      console.log(`📖 Training: "${training.title}"`);
      console.log(`   Course: ${training.course.title}`);

      if (!training.quiz) {
        console.log(`   ❌ No quiz found`);
        trainingWithoutQuestions++;
      } else {
        try {
          const questionsJson = training.quiz.questions || "[]";
          const questions: Question[] = JSON.parse(questionsJson);

          if (questions.length === 0) {
            console.log(`   ⚠️  Quiz exists but has 0 questions`);
            trainingWithoutQuestions++;
          } else {
            console.log(`   ✅ Quiz has ${questions.length} questions`);

            // Validate each question
            let hasErrors = false;
            questions.forEach((q, index) => {
              const validation = validateQuestionFormat(q);
              if (!validation.valid) {
                if (!hasErrors) {
                  console.log(`   ❌ Format errors found:`);
                  hasErrors = true;
                }
                console.log(`      Question ${index + 1}: ${validation.errors.join(", ")}`);
              }
            });

            if (hasErrors) {
              trainingFormatErrors++;
            } else {
              trainingWithQuestions++;
              // Show sample question
              if (questions.length > 0) {
                const sample = questions[0];
                console.log(`   📝 Sample question:`);
                console.log(`      Q: ${sample.question.substring(0, 60)}...`);
                console.log(`      Options: ${sample.options?.length || 0} options`);
                console.log(`      Correct: Index ${sample.correctAnswer}`);
                console.log(`      Explanation: ${sample.explanation ? "Yes" : "No"}`);
              }
            }
          }
        } catch (parseError) {
          console.log(`   ❌ Error parsing questions: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
          trainingFormatErrors++;
        }
      }
      console.log();
    }

    // Check mini trainings
    const miniTrainings = await prisma.miniTraining.findMany({
      include: {
        miniQuiz: true,
        training: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`\n📝 Found ${miniTrainings.length} mini training(s)\n`);

    let miniTrainingWithQuestions = 0;
    let miniTrainingWithoutQuestions = 0;
    let miniTrainingFormatErrors = 0;

    for (const miniTraining of miniTrainings) {
      console.log(`📋 Mini Training: "${miniTraining.title}"`);
      console.log(`   Parent Training: ${miniTraining.training.title}`);

      if (!miniTraining.miniQuiz) {
        console.log(`   ❌ No mini quiz found`);
        miniTrainingWithoutQuestions++;
      } else {
        try {
          const questionsJson = miniTraining.miniQuiz.questions || "[]";
          const questions: Question[] = JSON.parse(questionsJson);

          if (questions.length === 0) {
            console.log(`   ⚠️  Mini quiz exists but has 0 questions`);
            miniTrainingWithoutQuestions++;
          } else {
            console.log(`   ✅ Mini quiz has ${questions.length} questions`);

            // Validate each question
            let hasErrors = false;
            questions.forEach((q, index) => {
              const validation = validateQuestionFormat(q);
              if (!validation.valid) {
                if (!hasErrors) {
                  console.log(`   ❌ Format errors found:`);
                  hasErrors = true;
                }
                console.log(`      Question ${index + 1}: ${validation.errors.join(", ")}`);
              }
            });

            if (hasErrors) {
              miniTrainingFormatErrors++;
            } else {
              miniTrainingWithQuestions++;
              // Show sample question
              if (questions.length > 0) {
                const sample = questions[0];
                console.log(`   📝 Sample question:`);
                console.log(`      Q: ${sample.question.substring(0, 60)}...`);
                console.log(`      Options: ${sample.options?.length || 0} options`);
                console.log(`      Correct: Index ${sample.correctAnswer}`);
                console.log(`      Explanation: ${sample.explanation ? "Yes" : "No"}`);
              }
            }
          }
        } catch (parseError) {
          console.log(`   ❌ Error parsing questions: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
          miniTrainingFormatErrors++;
        }
      }
      console.log();
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 VERIFICATION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Trainings:`);
    console.log(`  ✅ With valid questions: ${trainingWithQuestions}`);
    console.log(`  ⚠️  Without questions: ${trainingWithoutQuestions}`);
    console.log(`  ❌ Format errors: ${trainingFormatErrors}`);
    console.log(`\nMini Trainings:`);
    console.log(`  ✅ With valid questions: ${miniTrainingWithQuestions}`);
    console.log(`  ⚠️  Without questions: ${miniTrainingWithoutQuestions}`);
    console.log(`  ❌ Format errors: ${miniTrainingFormatErrors}`);
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Verification complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
verifyQuestions();

