const axios = require('axios');
const fs = require('fs');

exports.processPDF = async (pdfPath, userPrompt) => {
  try {
    // Read PDF as base64, similar to geminiService
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Define the prompt for structured JSON output, matching geminiService
    const fullPrompt = `
      ${userPrompt}
      For totalAmount, select only the numeric value in USD.
      For deliveryDate, select the first date only, excluding additional text.
      Use "" for missing strings, 0 for missing numbers.
      Return only the JSON in code blocks.
      Extract the following fields from the provided PDF and return them as valid JSON,  wrapped in code blocks:
      {
      "invoiceNumber": "string",
      "invoiceDate": "string",
      "supplierName": "string",
      "totalAmount": "number",
      "paymentTerms": "string",
      "deliveryDate": "string"
    }
    `;

    // Send the base64 string and the detailed prompt in a JSON payload
    const response = await axios.post('http://localhost:5001/api/process', {
      pdf: pdfBase64,
      prompt: fullPrompt,
    });

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