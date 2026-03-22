const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

async function nanobanana(prompt, imageBuffer) {
    try {
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                'origin': 'https://nanobananas.pro',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            }
        });

        const up = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_ai.jpg`,
            contentType: 'image/jpeg'
        });

        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });

        const task = await inst.post('/edit', {
            prompt,
            image_urls: [up.data.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.data.result,
            uploadIds: [up.data.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(imageBuffer).digest('hex')
        });

        while (true) {
            const r = await inst.get(`/task/${task.data.data.taskId}`);
            if (r.data?.data?.status === 'completed') return r.data.data.result;
            if (r.data?.data?.status === 'failed') throw new Error('AI Task failed.');
            await new Promise(a => setTimeout(a, 2000));
        }
    } catch (e) {
        throw new Error(e.message);
    }
}

cmd({
    pattern: "nanobanana2",
    alias: ["editai2", "imagechange"],
    category: "ai",
    react: "🪄",
    desc: "Edit image using AI prompts"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    try {
        // --- Stronger Image Detection ---
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        // Agar reply wali cheez image nahi hai
        if (!/image/.test(mime)) {
            await react("❓");
            return reply("Bhai, kisi image ko mention (reply) karein!");
        }

        if (!q) return reply("Bhai, prompt toh dein (e.g. .nanobanana2 change name to KAMRAN)");

        await react("⏳");
        
        // Download Image Buffer
        const imageBuffer = await quoted.download();
        
        const result = await nanobanana(q, imageBuffer);

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Edit Complete*\n✨ *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        }

    } catch (e) {
        console.error(e);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
        
