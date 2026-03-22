const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

// --- AI Logic Function ---
async function nanobanana(prompt, imageBuffer) {
    try {
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                'origin': 'https://nanobananas.pro',
                'referer': 'https://nanobananas.pro/editor',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            }
        });

        // 1. Get Presigned URL
        const up = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_ai.jpg`,
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Upload URL not found.');
        
        // 2. Upload Buffer to S3
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. Bypass Turnstile
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });
        
        if (!cf.data?.result) throw new Error('Cloudflare bypass failed.');

        // 4. Create Edit Task
        const task = await inst.post('/edit', {
            prompt,
            image_urls: [up.data.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.data.result,
            uploadIds: [up.data.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 64)
        });

        if (!task.data?.data?.taskId) throw new Error('Task ID not found.');

        // 5. Polling Loop
        let attempts = 0;
        while (attempts < 30) {
            const r = await inst.get(`/task/${task.data.data.taskId}`);
            if (r.data?.data?.status === 'completed') return r.data.data.result;
            if (r.data?.data?.status === 'failed') throw new Error('AI Task failed.');
            
            await new Promise(a => setTimeout(a, 2000));
            attempts++;
        }
        throw new Error('Task Timeout');
    } catch (e) {
        throw new Error(e.message);
    }
}

// --- Bot Command Structure ---
cmd({
    pattern: "editimg2",
    alias: ["editai", "nanobanana2"],
    category: "ai",
    react: "🪄",
    desc: "Edit your image using AI prompt"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image/.test(mime)) {
            await react("❓");
            return reply("Bhai, image ko reply (quote) karke command likhein!");
        }

        if (!q) return reply("Bhai, prompt toh dein! Example: .editimg make it like a king");

        await react("⏳");
        
        // Download buffer from WhatsApp
        const buffer = await quoted.download();
        
        // Execute AI Editing
        const result = await nanobanana(q, buffer);

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Edit Successful*\n✨ *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        }

    } catch (e) {
        console.error(e);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
