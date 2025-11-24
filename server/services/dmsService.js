const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

let accessToken = null;

const getAuthToken = async () => {
    try {
        const response = await axios.post(`${process.env.DMS_API_URL}/api/token/`, {
            username: process.env.DMS_USERNAME,
            password: process.env.DMS_PASSWORD
        }, {
            headers: { 'Content-Type': 'multipart/form-data' } // API docs say Form-Data for auth
        });

        accessToken = response.data.access;
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

        // Convert flat metadata object to the specific format required by DMS
        // Format: [{"name": "key", "value": "val", "displayname": "Key"}]
        const formattedMetas = Object.entries(metadata).map(([key, value]) => ({
            name: key.toLowerCase().replace(/\s+/g, '_'), // simple sanitization
            value: String(value),
            displayname: key
        }));

        formData.append('metas', JSON.stringify(formattedMetas));
        formData.append('tags', JSON.stringify(["InvoiceAI", "Processed"]));
        formData.append('file', fs.createReadStream(filePath));

        // Retry once on 401 (Unauthorized) in case token expired
        try {
            await axios.post(`${process.env.DMS_API_URL}/api/v1/dms/documents/external/upload/`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('DMS Token expired, refreshing...');
                const newToken = await getAuthToken();
                await axios.post(`${process.env.DMS_API_URL}/api/v1/dms/documents/external/upload/`, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${newToken}`
                    }
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
