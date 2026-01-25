const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

let accessToken = null;

const getAuthToken = async () => {
    try {
        const formData = new FormData();
        formData.append('username', process.env.DMS_USERNAME);
        formData.append('password', process.env.DMS_PASSWORD);

        const response = await axios.post(`${process.env.DMS_API_URL}/api/token/`, formData, {
            headers: formData.getHeaders()
        });

        accessToken = response.data.access;
        console.log('DMS Access Token:', accessToken);
        return accessToken;
    } catch (error) {
        console.error('DMS Authentication failed:', error.message);
        throw new Error('DMS Authentication failed');
    }
};

exports.uploadToDMS = async (filePath, filename, metadata) => {
    try {
        if (!accessToken) {
            await getAuthToken();
        }

        const formData = new FormData();
        formData.append('doc_type', process.env.DMS_DOC_TYPE_ID);
        formData.append('filename', filename);

        // Helper to format date to YYYY-MM-DD
        const formatDate = (dateString) => {
            if (!dateString) return dateString;
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            return date.toISOString().split('T')[0];
        };

        // Convert flat metadata object to the specific format required by DMS
        // Format: [{"name": "key", "value": "val", "displayname": "Key"}]
        const formattedMetas = Object.entries(metadata).map(([key, value]) => {
            let finalValue = String(value);

            // Check if key contains 'date' (case-insensitive) and format it
            if (key.toLowerCase().includes('date')) {
                finalValue = formatDate(value);
            }

            return {
                name: key.toLowerCase().replace(/\s+/g, '_'), // simple sanitization
                value: finalValue,
                displayname: key
            };
        });

        formData.append('metas', JSON.stringify(formattedMetas));
        formData.append('tags', JSON.stringify(["InvoiceAI", "Processed"]));

        if (process.env.DMS_CHECKER_ID) {
            formData.append('checker', process.env.DMS_CHECKER_ID);
        }

        formData.append('file', fs.createReadStream(filePath));

        // Retry once on 401 (Unauthorized) in case token expired
        try {
            const headers = {
                ...formData.getHeaders(),
                'Authorization': `JWT ${accessToken}` // Using JWT prefix
            };
            console.log('Sending request with headers:', headers); // DEBUG LOG

            await axios.post(`${process.env.DMS_API_URL}/api/v1/dms/documents/external/upload/`, formData, {
                headers: headers
            });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('DMS Token expired, refreshing...');
                const newToken = await getAuthToken();

                // Re-create headers with new token
                const retryHeaders = {
                    ...formData.getHeaders(),
                    'Authorization': `JWT ${newToken}`
                };

                await axios.post(`${process.env.DMS_API_URL}/api/v1/dms/documents/external/upload/`, formData, {
                    headers: retryHeaders
                });
            } else {
                throw error;
            }
        }

        console.log(`Successfully uploaded ${filename} to DMS.`);
        return true;
    } catch (error) {
        console.error(`Failed to upload ${filename} to DMS:`, error.response?.data || error.message);
        // We don't throw here to prevent the main process from failing if DMS is down
        return false;
    }
};
