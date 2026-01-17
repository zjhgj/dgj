const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// --- Helper Functions ---

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

    const headers = {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        'origin': 'https://lovefaceswap.com',
        'referer': 'https://lovefaceswap.com/'
    };

    const res = await axios.post('https://api.lovefaceswap.com/api/face-swap/create-poll', form, { headers });
    return res.data.data.task_id;
}

async function checkJob(jobId) {
    const res = await axios.get(`https://api.lovefaceswap.com/api/common/get?job_id=${jobId}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'origin': 'https://lovefaceswap.com',
            'referer': 'https://lovefaceswap.com/'
        }
    });
    return res.data.data;
}

// --- Command Logic ---

cmd({
    pattern: "faceswap",
    alias: ["swap"],
    desc: "Swap faces between two images (Reply to target image with source image).",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // Logic: User must send an image and reply to another image
        if (!m.quoted || !m.quoted.imageMessage || !m.imageMessage) {
            return reply("*⚠️ Instruction:* Ek image bhejein aur dusri image ko reply karein command ke saath (.faceswap)");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Download Images
        const sourcePath = `./temp_source_${Date.now()}.jpg`;
        const targetPath = `./temp_target_${Date.now()}.jpg`;

        const sourceBuffer = await conn.downloadMediaMessage(m);
        const targetBuffer = await conn.downloadMediaMessage(m.quoted);

        fs.writeFileSync(sourcePath, sourceBuffer);
        fs.writeFileSync(targetPath, targetBuffer);

        reply("_🚀 Uploading images to AI server..._");

        // Step 1: Create Job
        const jobId = await createJob(sourcePath, targetPath);

        // Step 2: Polling
        let result;
        let attempts = 0;
        const maxAttempts = 20; // 1 minute safety

        do {
            await new Promise(r => setTimeout(r, 4000)); // Wait 4 seconds
            result = await checkJob(jobId);
            attempts++;
            if (attempts > maxAttempts) throw new Error("Processing Timeout");
        } while (!result.image_url || result.image_url.length === 0);

        // Step 3: Send Final Image
        await conn.sendMessage(from, { 
            image: { url: result.image_url[0] }, 
            caption: `*✅ Face Swap Completed!*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ` 
        }, { quoted: mek });

        // Cleanup temp files
        fs.unlinkSync(sourcePath);
        fs.unlinkSync(targetPath);
        await conn.sendMessage(from, { react: { text: "🎭", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + (e.response?.data?.message || e.message));
    }
});
        
