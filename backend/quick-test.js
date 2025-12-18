import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Gemini API...\n');
console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

try {
  const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  console.log('\n⏳ Sending test request with gemini-2.5-flash...\n');
  const result = await model.generateContent("Say 'Hello from Gemini!' in one sentence.");
  const response = result.response.text();
  
  console.log('✅ SUCCESS! Gemini is working!\n');
  console.log('Response:', response);
} catch (error) {
  console.error('❌ ERROR:', error.message);
  if (error.status) console.error('Status:', error.status);
}
