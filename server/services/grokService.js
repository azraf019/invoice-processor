const axios = require('axios');
const fs = require('fs');

exports.processPDF = async (pdfPath, prompt) => {
  try {
    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Send to Grok 3 API (replace with actual endpoint)
    const response = await axios.post('https://api.x.ai/grok3/extract', {
      pdf: pdfBase64,
      prompt,
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROK_API_KEY}` },
    });

    return response.data;
  } catch (error) {
    throw new Error('Error processing PDF with Grok 3: ' + error.message);
  }
};