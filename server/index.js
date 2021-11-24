require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger')();
const fs = require('fs');
const https = require('https');
const { ConsoleLoggingListener } = require('microsoft-cognitiveservices-speech-sdk/distrib/lib/src/common.browser/ConsoleLoggingListener');
const app = express();

const options = {
    key: fs.readFileSync('certs/server_key'),
    cert: fs.readFileSync('certs/server_cert'),
    ca: fs.readFileSync('certs/server_cert'),
    requestCert: true,                
    rejectUnauthorized: false
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(pino);

app.get('/api/get-speech-token', async (req, res, next) => {
    console.log('HERE 38');
    req.log.info('CAN WE SEE THIS');

    if (!req.client.authorized) {
        return res.status(401).send('Device is not authorized');
    }

    const cert = req.socket.getPeerCertificate();

    if (cert.subject) {
        console.log(cert.subject.CN);
    }

    res.setHeader('Content-Type', 'application/json');
    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

// app.listen(process.env.BACKEND_PORT, () =>
//     console.log('Express server is running on localhost:3001')
// );

const listener = https.createServer(options, app).listen(process.env.BACKEND_PORT, () => {
    console.log('Express HTTPS server running on localhost:' + listener.address().port);
    console.log(options);
});