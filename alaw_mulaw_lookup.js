// alaw_mulaw_lookup.js
// Simplified Lookup Table approach for G.711 Mu-Law

const muLawToPcmTable = new Int16Array(256);
const pcmToMuLawTable = new Int8Array(65536);

// Initialize Mu-Law decode table
for (let i = 0; i < 256; i++) {
    let mu = 255 - i;
    let sign = (mu & 0x80) ? -1 : 1;
    let exponent = (mu >> 4) & 0x07;
    let mantissa = mu & 0x0f;
    let sample = sign * ((((mantissa << 3) + 132) << exponent) - 132);
    muLawToPcmTable[i] = sample;
}

// Initialize PCM to Mu-Law encode table (Simplified approximation)
// In a real prod app, use the 'g711' npm package for robustness
function encodeMuLaw(pcm) {
    let sign = (pcm < 0) ? 0x80 : 0;
    if (pcm < 0) pcm = -pcm;
    pcm = Math.min(pcm, 32767);
    let mask = 0x4000;
    let exponent = 7;
    while ((pcm & mask) === 0 && exponent > 0) {
        exponent--;
        mask >>= 1;
    }
    let mantissa = (pcm >> (exponent + 3)) & 0x0f;
    let byte = sign | (exponent << 4) | mantissa;
    return ~(byte);
}

module.exports = {
    mulawToPcm: (buffer) => {
        const pcm = Buffer.alloc(buffer.length * 2);
        for (let i = 0; i < buffer.length; i++) {
            const val = muLawToPcmTable[buffer[i]];
            pcm.writeInt16LE(val, i * 2);
        }
        return pcm;
    },
    pcmToMulaw: (buffer) => {
        const mulaw = Buffer.alloc(buffer.length / 2);
        for (let i = 0; i < mulaw.length; i++) {
            const val = buffer.readInt16LE(i * 2);
            mulaw[i] = encodeMuLaw(val);
        }
        return mulaw;
    }
};