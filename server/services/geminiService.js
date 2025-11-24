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

exports.processPDF = async (pdfPath, prompts) => {
  try {
    // Initialize Gemini API with API key from .env
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use a model that supports vision/multimodal inputs. gemini-1.5-flash is a good choice for speed and cost.
    // If gemini-2.0-flash was intended, ensure it's available. Falling back to 1.5-flash is safer if unsure, 
    // but I will stick to the user's previous model config if it was working, or use a known good one.
    // The previous file had 'gemini-2.0-flash', I will keep it but add a fallback comment.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    const result = await model.generateContent([
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