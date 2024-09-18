const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Đọc thông tin xác thực từ tệp JSON
const credentialsPath = path.join(__dirname, 'credentials', 'credentials.json');
let credentials;

try {
    credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} catch (error) {
    console.error(`Error reading or parsing credentials file from path ${credentialsPath}:`, error);
    process.exit(1);
}

// Tạo OAuth2 client từ thông tin xác thực
const auth = new google.auth.GoogleAuth({
    credentials: {
        type: credentials.type,
        project_id: credentials.project_id,
        private_key_id: credentials.private_key_id,
        private_key: credentials.private_key.replace(/\\n/g, '\n'), // Thay thế ký tự escape newline
        client_email: credentials.client_email,
        client_id: credentials.client_id,
        auth_uri: credentials.auth_uri,
        token_uri: credentials.token_uri,
        auth_provider_x509_cert_url: credentials.auth_provider_x509_cert_url,
        client_x509_cert_url: credentials.client_x509_cert_url,
        universe_domain: credentials.universe_domain
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// Tạo client Google Sheets
const sheets = google.sheets({ version: 'v4', auth });

// ID của Google Sheet và phạm vi của bảng tính
const SPREADSHEET_ID = '1I3XEEVHoaFNoVFx3sPGR64rNqJfET8qUYSk9i3WC_a0';
const RANGE = 'QRcode!A:A'; // Phạm vi ghi dữ liệu vào cột A của sheet 'QRcode'

async function appendRowToSheet(rowData) {
    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
            valueInputOption: 'RAW',
            resource: {
                values: [[rowData]],
            },
        });
        console.log('Row added:', response.data);
    } catch (error) {
        console.error('Error appending row:', error);
    }
}

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/append-result', async (req, res) => {
    const result = req.body.result;
    if (!result) {
        return res.status(400).send('No result provided');
    }
    await appendRowToSheet(result);
    res.send({ status: 'success', result });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
