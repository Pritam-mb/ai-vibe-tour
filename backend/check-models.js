import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Checking available Gemini models...\n');

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

try {
  // Try different model names
  const models = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-pro',
    'models/gemini-1.5-pro'
  ];
  
  for (const modelName of models) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello");
      console.log(`✅ ${modelName} - WORKS!`);
      console.log(`Response: ${result.response.text()}\n`);
      break;
    } catch (error) {
      console.log(`❌ ${modelName} - ${error.message}\n`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
}
