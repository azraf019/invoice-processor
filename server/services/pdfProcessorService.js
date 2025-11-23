const axios = require('axios');
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
    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Dynamically build the JSON structure from the prompts array
    const dynamicJsonStructure = prompts.reduce((acc, prompt) => {
      // Sanitize the prompt to be a valid JSON key (e.g., remove special characters)
      // For now, we'll assume prompts are simple strings.
      acc[`"${prompt}"`] = `"${getExpectedType(prompt)}"`;
      return acc;
    }, {});

    const jsonStructureString = JSON.stringify(dynamicJsonStructure, null, 2)
      .replace(/\\"/g, '"') // Un-escape the quotes around keys
      .replace(/"(string|number)"/g, '$1'); // Remove quotes from types

    // Define the prompt for structured JSON output
    const fullPrompt = `
      Extract the following fields from the provided PDF and return them as valid JSON, wrapped in markdown code blocks.
      Use "" for missing strings, or 0 for missing numbers.
      For fields related to cost, price, or amount, extract only the numeric value.
      For date fields, use YYYY-MM-DD format if possible.
      
      Return JSON structure:
      ${jsonStructureString}
    `;

    // Send the base64 string and the detailed prompt in a JSON payload
    const response = await axios.post('http://localhost:5001/api/process', {
      pdf: pdfBase64,
      prompt: fullPrompt,
    });

    // The external service at localhost:5001 returns a JSON object directly.
    // The previous logic to parse a string was incorrect.
    return response.data;

  } catch (error) {
    console.error('Error processing PDF with external service:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw new Error('Error processing PDF with external service: ' + error.message);
  }
}; 