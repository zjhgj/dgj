const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// --- API HELPER FUNCTIONS ---

async function createJob(sourcePath, targetPath) {
    const form = new FormData();
    form.append('source_image', fs.createReadStream(sourcePath), {
        filename: 'source.jpg',
        contentType: 'image/jpeg'
    });

    form.append('target_image', fs.createReadStream(targetPath), {
        filename: 'target.jpg',
        contentType: 'image/jpeg'
    });

    const response = await axios.post('https://api.lovefaceswap.com/api/face-swap/create-poll', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Accept': 'application/json',
            'Origin': 'https://lovefaceswap.com',
            'Referer': 'https://lovefaceswap.com/'
        }
    });

    return response.data.data.task_id;
}

async function checkJob(jobId) {
    const response = await axios.get(`https://api.lovefaceswap.com/api/common/get?job_id=${jobId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'Origin': 'https://lovefaceswap.com',
            'Referer': 'https://lovefaceswap.com/'
        }
    });
    return response.data.data;
}

// --- COMMAND DEFINITION ---

cmd({
    pattern: "faceswap",
    alias: ["swap", "fs"],
    react: "🎭",
    desc: "Swap faces between two images.",
    category: "ai",
    use: "Reply to an image with .faceswap (Must reply to target image while source image is provided first)",
    filename: __filename
},           
async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // Step 1: Validation
        const isQuotedImage = m.quoted ? (m.quoted.type === 'imageMessage' || (m.quoted.type === 'viewOnceMessage' && m.quoted.msg.type === 'imageMessage')) : false;
        
        if (!isQuotedImage) return reply("❌ Please reply to the *TARGET* image (the body) and attach the *SOURCE* image (the face) or vice-versa.");

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
        reply("⏳ *KAMRAN-MD AI:* Processing face swap... please wait about 10-20 seconds.");

        // Step 2: Download Images
        const sourceBuffer = await m.download(); // Current image
        const targetBuffer = await m.quoted.download(); // Replied image

        const sourcePath = path.join(__dirname, `source_${Date.now()}.jpg`);
        const targetPath = path.join(__dirname, `target_${Date.now()}.jpg`);

        fs.writeFileSync(sourcePath, sourceBuffer);
        fs.writeFileSync(targetPath, targetBuffer);

        // Step 3: Start AI Job
        const jobId = await createJob(sourcePath, targetPath);
        
        // Step 4: Polling for Result
        let result;
        let attempts = 0;
        const maxAttempts = 20; // Max 60 seconds

        do {
            await new Promise(r => setTimeout(r, 3000));
            result = await checkJob(jobId);
            attempts++;
        } while ((!result.image_url || result.image_url.length === 0) && attempts < maxAttempts);

        // Step 5: Clean up temp files
        fs.unlinkSync(sourcePath);
        fs.unlinkSync(targetPath);

        if (result.image_url && result.image_url.length > 0) {
            await conn.sendMessage(from, { 
                image: { url: result.image_url[0] }, 
                caption: "✨ *FACE SWAP COMPLETED BY KAMRAN-MD AI* ✨" 
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        } else {
            reply("❌ AI failed to process images. Make sure faces are clearly visible.");
        }

    } catch (e) {
        console.error(e);
        reply("❌ *SYSTEM ERROR:* " + e.message);
    }
});
