const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// A simple helper to infer the desired data type based on keywords in the prompt.
const getExpectedType = (prompt) => {
  const lowerCasePrompt = prompt.toLowerCase();
  if (lowerCasePrompt.includes('amount') || lowerCasePrompt.includes('total') || lowerCasePrompt.includes('price')) {
    return 'number';
  }
  return 'string';
};

// Helper function to call Gemini API with retry logic
const callGeminiWithRetry = async (model, content, retries = 5, initialDelay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(content);
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        if (i === retries - 1) throw error; // Throw on last retry
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s
        console.warn(`Gemini API 429 error. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Throw other errors immediately
      }
    }
  }
};

exports.processPDF = async (pdfPath, prompts) => {
  try {
    // Initialize Gemini API with API key from .env
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use a model that supports vision/multimodal inputs. gemini-1.5-flash is a good choice for speed and cost.
    // If gemini-2.0-flash was intended, ensure it's available. Falling back to 1.5-flash is safer if unsure, 
    // but I will stick to the user's previous model config if it was working, or use a known good one.
    // The previous file had 'gemini-2.0-flash', I will keep it but add a fallback comment.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Read PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Dynamically build the JSON structure from the prompts array
    const dynamicJsonStructure = prompts.reduce((acc, prompt) => {
      acc[`"${prompt}"`] = `"${getExpectedType(prompt)}"`;
      return acc;
    }, {});

    const jsonStructureString = JSON.stringify(dynamicJsonStructure, null, 2)
      .replace(/\\"/g, '"') // Un-escape the quotes around keys
      .replace(/"(string|number)"/g, '$1'); // Remove quotes from types

    // Define the prompt for structured JSON output
    const fullPrompt = `
      Extract the following fields from the provided PDF and return them as valid JSON, wrapped in code blocks.
      Use "" for missing strings, or 0 for missing numbers.
      For fields related to cost, price, or amount, extract only the numeric value.
      For date fields, use YYYY-MM-DD format if possible.
      
      Return JSON structure:
      ${jsonStructureString}
    `;

    // Send request to Gemini API with inline PDF data
    const result = await callGeminiWithRetry(model, [
      {
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      },
      { text: fullPrompt },
    ]);

    // Parse the response as JSON
    let extractedData;
    try {
      let responseText = result.response.text();
      // Remove code blocks (```json ... ```) or unexpected formatting
      responseText = responseText.replace(/```json\n|```/g, '').trim();
      extractedData = JSON.parse(responseText);
    } catch (error) {
      throw new Error('Failed to parse Gemini response as JSON: ' + error.message + ' | Raw response: ' + result.response.text());
    }

    return extractedData;
  } catch (error) {
    throw new Error('Error processing PDF with Gemini API: ' + error.message);
  }
};

exports.identifyInvoiceRanges = async (pdfPath) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use a model that supports vision/multimodal inputs.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    const prompt = `This PDF contains multiple distinct invoices. Please identify the start and end page numbers for each individual invoice. Return the result strictly as a JSON array of objects, e.g., [{"start": 1, "end": 2}, {"start": 3, "end": 3}]. Do not include any markdown formatting or explanations.`;

    const result = await callGeminiWithRetry(model, [
      {
        inlineData: {
          data: pdfBase64,
          mimeType: 'application/pdf',
        },
      },
      { text: prompt },
    ]);

    let responseText = result.response.text();
    // Clean up potential markdown code blocks
    responseText = responseText.replace(/```json\n|```/g, '').trim();

    const ranges = JSON.parse(responseText);
    return ranges;
  } catch (error) {
    throw new Error('Error identifying invoice ranges with Gemini API: ' + error.message);
  }
};