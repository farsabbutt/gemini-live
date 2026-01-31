const speech = require('@google-cloud/speech').v2;
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// --- CONFIGURATION ---

// 1. AUTHENTICATION (The new part)
// Replace this with the actual path to your downloaded JSON key file
const serviceAccountKeyFile = "./key/speaksy-a5879-7497e5060d59.json";

// 2. The path to the file on your local computer
const localFilePath = "./recordings/CA8da77d8dec47bc82305f0cc03ae75f2f-RE46455ce3c22353cfe33be6fc303d9fa9.mp3"; 

// 3. Your existing Google Cloud settings
const bucketName = "fnb-twilio-calls"; 
const recognizer = "projects/speaksy-a5879/locations/global/recognizers/_";
const workspace = "gs://fnb-twilio-calls/transcripts";
// ---------------------

// Instantiates clients with the specific key file
const speechClient = new speech.SpeechClient({
    keyFilename: serviceAccountKeyFile
});

const storage = new Storage({
    keyFilename: serviceAccountKeyFile
});

async function processLocalAudio() {
  try {
    console.log(`1. Uploading ${localFilePath} to Cloud Storage...`);
    
    // Generate a destination filename in the bucket
    const fileName = path.basename(localFilePath);
    const gcsDestination = `audio-files/${fileName}`;
    
    // Upload the file
    await storage.bucket(bucketName).upload(localFilePath, {
      destination: gcsDestination,
    });
    
    const gcsUri = `gs://${bucketName}/${gcsDestination}`;
    console.log(`   Upload complete: ${gcsUri}`);

    console.log('2. Starting Batch Transcription...');

    const recognitionConfig = {
      autoDecodingConfig: {},
      model: "long",
      languageCodes: ["en-US"],
    //   features: {
    //     enableWordTimeOffsets: true,
    //     enableWordConfidence: true,
    //   },
    };

    const transcriptionRequest = {
      recognizer: recognizer,
      config: recognitionConfig,
      files: [{ uri: gcsUri }], 
      recognitionOutputConfig: {
        gcsOutputConfig: {
          uri: workspace 
        }
      },
    };

    const [operation] = await speechClient.batchRecognize(transcriptionRequest);
    
    console.log(`   Processing... (Operation: ${operation.name})`);
    const [response] = await operation.promise();

    console.log("3. Transcription Complete!");
    console.log(`   Results saved to: ${workspace}`);
    
    // Optional: Log the results structure if needed
    console.log(response?.results[gcsUri]?.uri);

  } catch (err) {
    console.error("ERROR:", err);
  }
}

processLocalAudio();