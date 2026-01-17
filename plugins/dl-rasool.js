const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// --- Helper Functions ---
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

// --- Command Logic ---
cmd({
    pattern: "faceswap",
    alias: ["swap"],
    desc: "Swap faces between two images.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
    try {
        // Image Detection Check
        const isMsgImage = m.type === 'imageMessage' || (m.type === 'extendedTextMessage' && m.content?.includes('imageMessage'));
        const isQuotedImage = m.quoted && (m.quoted.type === 'imageMessage');

        if (!isMsgImage || !isQuotedImage) {
            return reply("⚠️ *Instruction:* Ek image bhejein (caption mein .faceswap likhein) aur dusri image ko reply karein.");
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Paths for temp files
        const sourcePath = `./source_${Date.now()}.jpg`;
        const targetPath = `./target_${Date.now()}.jpg`;

        // Download Source (Current Message)
        const buffSource = await m.download();
        fs.writeFileSync(sourcePath, buffSource);

        // Download Target (Quoted Message)
        const buffTarget = await m.quoted.download();
        fs.writeFileSync(targetPath, buffTarget);

        reply("_🚀 Faceswap process shuru ho gaya hai..._");

        const jobId = await createJob(sourcePath, targetPath);

        let result;
        let attempts = 0;
        do {
            await new Promise(r => setTimeout(r, 4000));
            result = await checkJob(jobId);
            attempts++;
            if (attempts > 25) throw new Error("Server ne zyada time liya. Phir koshish karein.");
        } while (!result.image_url || result.image_url.length === 0);

        await conn.sendMessage(from, { 
            image: { url: result.image_url[0] }, 
            caption: `*✅ Face Swap Completed!*\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ` 
        }, { quoted: mek });

        // Delete temp files
        if (fs.existsSync(sourcePath)) fs.unlinkSync(sourcePath);
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
        
        await conn.sendMessage(from, { react: { text: "🎭", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + e.message);
    }
});
