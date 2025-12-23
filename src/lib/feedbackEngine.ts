import OpenAI from "openai";
import pdf from 'pdf-parse/lib/pdf-parse';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getResumeFeedbackFromPDF(buffer: Buffer): Promise<string> {
  const pdfData = await pdf(buffer);
  const resumeText = pdfData.text;
  if (!resumeText || resumeText.trim() === "") {
    throw new Error("Could not extract text from PDF.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `You're a career advisor. Please review the following resume and provide professional feedback:\n\n${resumeText}, try to limit the word to 70`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "No feedback generated.";
}