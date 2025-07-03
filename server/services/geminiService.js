const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

exports.processPDF = async (pdfPath, userPrompt) => {
  try {
    // Initialize Gemini API with API key from .env
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Read PDF file and convert to base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Define the prompt for structured JSON output
    const fullPrompt = `
      ${userPrompt}
      For totalAmount, select only the numeric value in USD.
      For deliveryDate, select the first date only, excluding additional text.
      Use "" for missing strings, 0 for missing numbers.
      Return only the JSON in code blocks.
      Extract the following fields from the provided PDF and return them as valid JSON,  wrapped in code blocks:
      {
      "invoiceNumber": string,
      "invoiceDate": string,
      "supplierName": string,
      "totalAmount": number,
      "paymentTerms": string,
      "deliveryDate": string
    }
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

    // Validate the response structure
    if (!extractedData.invoiceNumber || !extractedData.invoiceDate || !extractedData.supplierName || !extractedData.totalAmount || !extractedData.paymentTerms || !extractedData.deliveryDate) {
      throw new Error('Invalid response structure from Gemini API');
    }

    // Ensure numeric fields are numbers
    extractedData.totalAmount = Number(extractedData.totalAmount);

    return extractedData;
  } catch (error) {
    throw new Error('Error processing PDF with Gemini API: ' + error.message);
  }
};