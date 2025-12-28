/**
 * Script to populate all trainings and mini trainings with 10 AI-generated questions
 * Usage: npm run populate-questions
 * 
 * This script will:
 * - Fetch all trainings and mini trainings
 * - Generate 10 multiple-choice questions for each using Gemini AI
 * - Replace all existing questions with new ones
 * - Create quizzes/mini-quizzes if they don't exist
 */

// Load environment variables from .env file (if accessible)
// If dotenv package is available, use it; otherwise try manual loading
try {
  // Try using dotenv if available
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
    console.warn("Could not load .env file. Make sure GEMINI_API_KEY is set in your environment.");
  }
}

import { prisma } from "../lib/prisma/client";
import { generateQuestions } from "../lib/ai/generateQuestions";

async function populateQuestions() {
  try {
    console.log("🚀 Starting question population...\n");

    // Fetch all trainings with their quizzes
    const trainings = await prisma.training.findMany({
      include: {
        quiz: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📚 Found ${trainings.length} training(s)\n`);

    // Process trainings
    let trainingSuccessCount = 0;
    let trainingErrorCount = 0;

    for (const training of trainings) {
      try {
        console.log(`📖 Processing training: "${training.title}"`);

        // Create quiz if it doesn't exist
        let quiz = training.quiz;
        if (!quiz) {
          console.log(`   Creating quiz for training...`);
          quiz = await prisma.quiz.create({
            data: {
              trainingId: training.id,
              title: `Quiz: ${training.title}`,
              passingScore: 70,
              allowRetake: true,
              questions: "[]",
            },
          });
          console.log(`   ✅ Quiz created`);
        } else {
          console.log(`   Quiz already exists, updating questions...`);
        }

        // Generate questions based on training title and description
        const questions = await generateQuestions(
          training.title,
          training.shortDescription
        );

        // Update quiz with generated questions
        await prisma.quiz.update({
          where: {
            id: quiz.id,
          },
          data: {
            questions: JSON.stringify(questions),
          },
        });

        // Verify what was saved - read it back from database
        const updatedQuiz = await prisma.quiz.findUnique({
          where: { id: quiz.id },
        });

        if (updatedQuiz) {
          try {
            const savedQuestions = JSON.parse(updatedQuiz.questions || "[]");
            console.log(`   ✅ Saved ${savedQuestions.length} questions to database`);
            
            // Verify format matches QuizBuilder expectations
            if (savedQuestions.length > 0) {
              const sample = savedQuestions[0];
              const hasRequiredFields = 
                sample.id && 
                sample.type === "multiple-choice" &&
                sample.question &&
                Array.isArray(sample.options) &&
                sample.options.length === 4 &&
                typeof sample.correctAnswer === "number" &&
                typeof sample.points === "number";
              
              if (hasRequiredFields) {
                console.log(`   ✅ Format verified - compatible with QuizBuilder`);
                console.log(`      Sample question structure:`);
                console.log(`      - ID: ${sample.id.substring(0, 20)}...`);
                console.log(`      - Type: ${sample.type}`);
                console.log(`      - Question: ${sample.question.substring(0, 50)}...`);
                console.log(`      - Options: ${sample.options.length} options`);
                console.log(`      - Correct Answer: Index ${sample.correctAnswer}`);
                console.log(`      - Points: ${sample.points}`);
                console.log(`      - Explanation: ${sample.explanation ? "Yes" : "No"}`);
              } else {
                console.log(`   ⚠️  Warning: Question format may not match QuizBuilder expectations`);
              }
            }
            console.log();
          } catch (parseError) {
            console.log(`   ❌ Error: Could not parse saved questions: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
            console.log();
          }
        }
        trainingSuccessCount++;
      } catch (error) {
        console.error(`   ❌ Error processing training "${training.title}":`);
        if (error instanceof Error) {
          console.error(`   Error message: ${error.message}`);
          if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
          }
        } else {
          console.error(`   Error:`, error);
        }
        trainingErrorCount++;
        console.log(); // Empty line for readability
      }
    }

    // Fetch all mini trainings with their mini quizzes
    const miniTrainings = await prisma.miniTraining.findMany({
      include: {
        miniQuiz: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`\n📝 Found ${miniTrainings.length} mini training(s)\n`);

    // Process mini trainings
    let miniTrainingSuccessCount = 0;
    let miniTrainingErrorCount = 0;

    for (const miniTraining of miniTrainings) {
      try {
        console.log(`📋 Processing mini training: "${miniTraining.title}"`);

        // Create mini quiz if it doesn't exist
        let miniQuiz = miniTraining.miniQuiz;
        if (!miniQuiz) {
          console.log(`   Creating mini quiz for mini training...`);
          miniQuiz = await prisma.miniQuiz.create({
            data: {
              miniTrainingId: miniTraining.id,
              title: `Quiz: ${miniTraining.title}`,
              passingScore: 70,
              questions: "[]",
            },
          });
          console.log(`   ✅ Mini quiz created`);
        } else {
          console.log(`   Mini quiz already exists, updating questions...`);
        }

        // Generate questions based on mini training title and description
        const questions = await generateQuestions(
          miniTraining.title,
          miniTraining.description
        );

        // Update mini quiz with generated questions
        await prisma.miniQuiz.update({
          where: {
            id: miniQuiz.id,
          },
          data: {
            questions: JSON.stringify(questions),
          },
        });

        // Verify what was saved - read it back from database
        const updatedMiniQuiz = await prisma.miniQuiz.findUnique({
          where: { id: miniQuiz.id },
        });

        if (updatedMiniQuiz) {
          try {
            const savedQuestions = JSON.parse(updatedMiniQuiz.questions || "[]");
            console.log(`   ✅ Saved ${savedQuestions.length} questions to database`);
            
            // Verify format matches QuizBuilder expectations
            if (savedQuestions.length > 0) {
              const sample = savedQuestions[0];
              const hasRequiredFields = 
                sample.id && 
                sample.type === "multiple-choice" &&
                sample.question &&
                Array.isArray(sample.options) &&
                sample.options.length === 4 &&
                typeof sample.correctAnswer === "number" &&
                typeof sample.points === "number";
              
              if (hasRequiredFields) {
                console.log(`   ✅ Format verified - compatible with QuizBuilder`);
                console.log(`      Sample question structure:`);
                console.log(`      - ID: ${sample.id.substring(0, 20)}...`);
                console.log(`      - Type: ${sample.type}`);
                console.log(`      - Question: ${sample.question.substring(0, 50)}...`);
                console.log(`      - Options: ${sample.options.length} options`);
                console.log(`      - Correct Answer: Index ${sample.correctAnswer}`);
                console.log(`      - Points: ${sample.points}`);
                console.log(`      - Explanation: ${sample.explanation ? "Yes" : "No"}`);
              } else {
                console.log(`   ⚠️  Warning: Question format may not match QuizBuilder expectations`);
              }
            }
            console.log();
          } catch (parseError) {
            console.log(`   ❌ Error: Could not parse saved questions: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
            console.log();
          }
        }
        miniTrainingSuccessCount++;
      } catch (error) {
        console.error(`   ❌ Error processing mini training "${miniTraining.title}":`);
        if (error instanceof Error) {
          console.error(`   Error message: ${error.message}`);
          if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
          }
        } else {
          console.error(`   Error:`, error);
        }
        miniTrainingErrorCount++;
        console.log(); // Empty line for readability
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Trainings:`);
    console.log(`  ✅ Success: ${trainingSuccessCount}`);
    console.log(`  ❌ Errors: ${trainingErrorCount}`);
    console.log(`\nMini Trainings:`);
    console.log(`  ✅ Success: ${miniTrainingSuccessCount}`);
    console.log(`  ❌ Errors: ${miniTrainingErrorCount}`);
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Question population complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateQuestions();

