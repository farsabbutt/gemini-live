const { Storage } = require('@google-cloud/storage');


const serviceAccountKeyFile = "./key/speaksy-a5879-7497e5060d59.json";
async function readBucketFile(fileName) {
  // 1. Initialize storage
  const storage = new Storage({
    keyFilename: serviceAccountKeyFile
});

  // 2. Define your bucket and filename
  const bucketName = 'fnb-twilio-calls';
  const filePath = 'transcripts/' + fileName;

  try {
    // 3. Download the file
    // The download() method returns an array with a Buffer as the first item
    const [fileContents] = await storage
      .bucket(bucketName)
      .file(filePath)
      .download();

    // 4. Convert Buffer to string (if it's a text file)
    const contents = fileContents.toString();
    
    console.log('File contents:');
    console.log(JSON.parse(contents));
    
  } catch (error) {
    console.error('Error reading file:', error);
  }
}

readBucketFile();