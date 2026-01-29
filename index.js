// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');
const { VoiceResponse } = require('twilio').twiml;

// Audio conversion utilities (Quick & dirty implementation for the demo)
// In production, use libraries like 'wavefile' or 'sox'
const alaw = require('./alaw_mulaw_lookup'); // See Step 4 for this helper
// const SYSTEM_INSTRUCTION = `
// You are a hungry customer calling a pizza shop to place an order.
// You want a Large Pepperoni Pizza and a Coke.
// You should speak naturally, be polite, but firm about your order.
// If they ask for an address, give: "123 Main Street".
// When the order is confirmed, say goodbye and hang up.
// Keep your responses short and conversational.
// `;

const menu = `
PIZZAS:\n
Margherita [Vegetarian]: Small(~27cm) €5.90, Large(~33cm) €8.90\n
Salami [Meat]: Small €7.40, Large €11.40, Cheezy Crust €14.40\n
Champignon [Vegetarian]: Small €7.40, Large €11.40, Cheezy Crust €14.40\n
Hawaii [Meat]: Small €8.90, Large €13.90, Cheezy Crust €16.90\n
Tuna [Meat]: Small €8.90, Large €13.90, Cheezy Crust €16.90\n
Pepperoni Lover’s [Meat]: Small €8.90, Large €13.90, Cheezy Crust €16.90\n
Cheese Lover’s [Vegetarian]: Small €9.90, Large €15.90, Cheezy Crust €18.90\n
Veggie Deluxe [Vegetarian]: Small €9.90, Large €15.90, Cheezy Crust €18.90\n
Spinach [Vegetarian]: Small €7.40, Large €11.40, Cheezy Crust €14.40\n
Garden Lover’s [Vegetarian]: Small €9.90, Large €15.90, Cheezy Crust €18.90\n
Chicken Supreme [Meat]: Small €9.90, Large €15.90, Cheezy Crust €18.90\n
Caribbean Chicken Lover’s [Meat]: Small €9.90, Large €15.90, Cheezy Crust €18.90\n
Texas Supreme [Meat]: Small €10.90, Large €17.90, Cheezy Crust €20.90\n
\nDRINKS:\n
Pepsi [Vegan]: 0.5L €2.90, 1.5L €4.50\n
Pepsi Zero [Vegan]: 0.5L €2.90, 1.5L €4.50\n
7UP [Vegan]: 0.5L €2.90, 1.5L €4.50\n
Lipton Ice Tea Peach [Vegan]: 0.5L €2.90, 1.5L €4.50\n
Mineral Water (still/sparkling) [Vegan]: 0.5L €2.90, 1.5L €4.50\n`
const SYSTEM_INSTRUCTION = `You are a worker in a pizza shop. You are answering the phone and taking orders.
Be friendly, polite, and professional. After taking the order, make sure to get all the required customer information to have the pizza delivered. Here is the complete menu: ` + menu;

// const SYSTEM_INSTRUCTION = `You are a German. You want to buy a car, the car is a Mercedes-Benz 180 A, 
// the price is 12,800 Euros. Ask about all the important information about the car that a person needs before buying a car. 
// Keep your responses short and conversational.`;

// const SYSTEM_INSTRUCTION = `You are a stressed customer calling your auto insurance provider to report an accident.
// You want to file a new claim for a minor fender-bender that just happened.
// You should speak naturally, sounding slightly shaken but cooperative.
// If they ask for your policy number, give: "AB-123-456".
// If they ask for the location of the accident, say: "The corner of 5th Avenue and Main Street."
// When the agent confirms the claim has been started, say thank you and hang up.
// Keep your responses short and conversational.`

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3090;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025";

async function downloadAuthenticatedRecording(recordingUrl, filename) {
    try {
        const mediaUrl = recordingUrl.endsWith('.mp3')
            ? recordingUrl
            : `${recordingUrl}.mp3`;

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        const response = await axios.get(mediaUrl, {
            auth: {
                username: accountSid,
                password: authToken
            },
            responseType: 'stream',
            validateStatus: status => status >= 200 && status < 300
        });

        const dir = path.join(__dirname, 'recordings');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const filePath = path.join(dir, `${filename}.mp3`);
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            response.data.on('error', reject);
            writer.on('error', reject);
            writer.on('finish', () => resolve(filePath));
        });

    } catch (error) {
        console.error('Download failed:', error.response?.status, error.message);
        throw error;
    }
}


// 1. Endpoint for Twilio to request TwiML when the call starts
app.post('/twiml', (req, res) => {
    const response = new VoiceResponse();
    const connect = response.connect();
    // Start a Media Stream to this server
    connect.stream({
        url: `wss://${req.headers.host}/media-stream`,
        name: 'Gemini Stream'
    });
    res.type('text/xml');
    res.send(response.toString());
});

app.get('/call-ended-recording-status', async (req, res) => {
    const { RecordingUrl, RecordingStatus, RecordingSid, CallSid } = req.query;

    if (RecordingStatus === 'completed') {
        const fileName = `${CallSid}-${RecordingSid}`;
        await downloadAuthenticatedRecording(RecordingUrl, fileName);
        console.log(`Saved: ${fileName}.mp3`);
    }
    res.status(200).end();
});

app.get('/trigger-call', (req, res) => {
    const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const PIZZA_SHOP_NUMBER = '+491786590235'; // Replace with the shop's number
// const PIZZA_SHOP_NUMBER = '+4915753326573'; // Replace with the shop's number
const YOUR_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const NGROK_URL = 'https://50df458d1599.ngrok-free.app'; // Replace with your actual ngrok URL

client.calls.create({
    url: `${NGROK_URL}/twiml`, // This tells Twilio where to get instructions (connect stream)
    to: PIZZA_SHOP_NUMBER,
    from: YOUR_TWILIO_NUMBER,
    record: true,
    recordingStatusCallback: `${NGROK_URL}/call-ended-recording-status`,
    recordingStatusCallbackMethod: 'GET'
})
.then(call => console.log(`Call initiated with SID: ${call.sid}`))
.catch(err => console.error(err));
});

// 2. WebSocket Server for Twilio Media Stream
wss.on('connection', (ws) => {
    console.log('Twilio media stream connected');
    
    // Connect to Gemini Live API
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
    const geminiWs = new WebSocket(geminiUrl);

    let streamSid = null;

    geminiWs.on('open', () => {
        console.log('Connected to Gemini Live API');
        
        // Initial Handshake / Setup
        const setupMessage = {
            setup: {
                model: MODEL,
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: { prebuilt_voice_config: { voice_name: "Puck" } }
                    }
                },
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                }
            }
        };
        geminiWs.send(JSON.stringify(setupMessage));
    });

    geminiWs.on('message', (data) => {
        const response = JSON.parse(data);
        
        // Handle Audio coming FROM Gemini
        if (response.serverContent && response.serverContent.modelTurn) {
            const parts = response.serverContent.modelTurn.parts;
            for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    // Gemini sends 24kHz PCM. Twilio needs 8kHz mu-law.
                    const pcm24k = Buffer.from(part.inlineData.data, 'base64');
                    
                    // Downsample 24k -> 8k (Take every 3rd sample)
                    const pcm8k = downsampleBuffer(pcm24k, 3);
                    
                    // Convert PCM to Mu-law
                    const mulaw = alaw.pcmToMulaw(pcm8k);
                    
                    // Send to Twilio
                    const mediaMessage = {
                        event: 'media',
                        streamSid: streamSid,
                        media: {
                            payload: mulaw.toString('base64')
                        }
                    };
                    ws.send(JSON.stringify(mediaMessage));
                }
            }
        }
        
        if (response.serverContent && response.serverContent.turnComplete) {
            // Gemini finished speaking this turn
        }
    });

    // Handle Audio coming FROM Twilio
    ws.on('message', (message) => {
        const msg = JSON.parse(message);
        
        switch (msg.event) {
            case 'start':
                streamSid = msg.start.streamSid;
                console.log(`Stream started: ${streamSid}`);
                break;
            case 'media':
                // Twilio sends 8kHz mu-law. Gemini wants 16kHz PCM.
                if (geminiWs.readyState === WebSocket.OPEN) {
                    const mulawChunk = Buffer.from(msg.media.payload, 'base64');
                    
                    // Convert Mu-law to PCM
                    const pcm8k = alaw.mulawToPcm(mulawChunk);
                    
                    // Upsample 8k -> 16k (Simple linear interpolation or duplication)
                    // We simply duplicate samples for speed in this demo: [A, B] -> [A, A, B, B]
                    const pcm16k = upsampleBuffer(pcm8k, 2);
                    
                    // Send to Gemini
                    const realtimeInput = {
                        realtime_input: {
                            media_chunks: [{
                                mime_type: "audio/pcm",
                                data: pcm16k.toString('base64')
                            }]
                        }
                    };
                    geminiWs.send(JSON.stringify(realtimeInput));
                }
                break;
            case 'stop':
                console.log('Stream stopped');
                geminiWs.close();
                break;
        }
    });

    ws.on('close', () => {
        console.log('Twilio disconnected');
        geminiWs.close();
    });
});

// Helper: Downsample 24kHz -> 8kHz
function downsampleBuffer(buffer, factor) {
    // Calculate the total byte size of the new buffer
    const newSizeBytes = Math.floor(buffer.length / factor);
    const output = Buffer.alloc(newSizeBytes);

    // Calculate how many 16-bit SAMPLES we need to process
    // (Divide bytes by 2, since 16-bit PCM = 2 bytes per sample)
    const numSamples = Math.floor(newSizeBytes / 2);

    for (let i = 0; i < numSamples; i++) {
        // Read input: 
        // i (sample index) * factor (skipping samples) * 2 (bytes per sample)
        const originalOffset = i * factor * 2;
        
        // Write output: 
        // i (sample index) * 2 (bytes per sample)
        const outputOffset = i * 2;

        // Ensure we don't read out of bounds
        if (originalOffset + 1 < buffer.length) {
            const sample = buffer.readInt16LE(originalOffset);
            output.writeInt16LE(sample, outputOffset);
        }
    }
    return output;
}

// Helper: Upsample 8kHz -> 16kHz (Naive duplication)
function upsampleBuffer(buffer, factor) {
    const output = Buffer.alloc(buffer.length * factor);
    for (let i = 0; i < buffer.length / 2; i++) {
        const sample = buffer.readInt16LE(i * 2);
        for (let j = 0; j < factor; j++) {
            output.writeInt16LE(sample, (i * factor + j) * 2);
        }
    }
    return output;
}

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));