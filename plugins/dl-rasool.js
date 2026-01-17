const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// --- API Helpers ---
async function createJob(sourcePath, targetPath) {
    const form = new FormData();
    form.append('source_image', fs.createReadStream(sourcePath), { filename: 'source.jpg', contentType: 'image/jpeg' });
    form.append('target_image', fs.createReadStream(targetPath), { filename: 'target.jpg', contentType: 'image/jpeg' });

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
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    return res.data.data;
}

// --- Main Command ---
cmd({
    pattern: "faceswap",
    alias: ["swap"],
    desc: "Faceswap between two images.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // 1. Check if both images exist
        const isImage = m.type === 'imageMessage' || (m.type === 'viewOnceMessage' && m.msg.type === 'imageMessage');
        const isQuotedImage = quoted && (quoted.type === 'imageMessage' || (quoted.type === 'viewOnceMessage' && quoted.msg.type === 'imageMessage'));

        if (!isImage || !isQuotedImage) {
            return reply("⚠️ *Error:* Use karne ka sahi tarika:\n1. Ek photo ko *Reply* karein.\n2. Nayi photo upload karein aur caption mein *.faceswap* likhein.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // 2. Download Images
        const sourcePath = `./source_${Date.now()}.jpg`;
        const targetPath = `./target_${Date.now()}.jpg`;

        const buffSource = await m.download(); // Downloader fix
        fs.writeFileSync(sourcePath, buffSource);

        const buffTarget = await quoted.download(); // Quoted downloader fix
        fs.writeFileSync(targetPath, buffTarget);

        reply("_🚀 Faceswap process shuru ho gaya hai, thoda intezar karein..._");

        // 3. Process to API
        const jobId = await createJob(sourcePath, targetPath);

        let result;
        let attempts = 0;
        do {
            await new Promise(r => setTimeout(r, 5000)); // 5 sec wait
            result = await checkJob(jobId);
            attempts++;
            if (attempts > 30) throw new Error("Processing Timeout! Server busy hai.");
        } while (!result.image_url || result.image_url.length === 0);

        // 4. Send Result
        await conn.sendMessage(from, { 
            image: { url: result.image_url[0] }, 
            caption: `*✅ Face Swap Completed!*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ` 
        }, { quoted: mek });

        // Clean up
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        
        await conn.sendMessage(from, { react: { text: "🎭", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ *System Error:* " + e.message);
    }
});
    
