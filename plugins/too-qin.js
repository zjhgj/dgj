const { cmd } = require('../command');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const crypto = require('crypto');

// --- MAIN API LOGIC (NANOBANANA PRO) ---
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

        // 1. Get Presigned Upload URL
        const up = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_ai.jpg`,
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Upload URL not found.');
        
        // 2. Upload Image to S3/Cloud Storage
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. Cloudflare Turnstile Bypass (Using NekoLabs API)
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });
        
        if (!cf.data?.result) throw new Error('Cloudflare bypass failed.');

        // 4. Create AI Editing Task
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

        // 5. Polling (Check Status)
        let attempts = 0;
        while (attempts < 30) {
            const r = await inst.get(`/task/${task.data.data.taskId}`);
            if (r.data?.data?.status === 'completed') return r.data.data.result;
            if (r.data?.data?.status === 'failed') throw new Error('AI processing failed.');
            
            await new Promise(a => setTimeout(a, 2000)); // 2 sec wait
            attempts++;
        }
        throw new Error('Task timeout.');
    } catch (e) {
        throw new Error(e.message);
    }
}

// --- BOT COMMAND ---
cmd({
    pattern: "nanobanana2",
    alias: ["editai2", "nb2"],
    category: "ai",
    react: "🪄",
    desc: "AI Image Editor (Full API Integrated)"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Check if it's an image
        if (!/image/.test(mime)) {
            await react("❓");
            return reply("Bhai, kisi image ko reply (quote) karke command likhein!");
        }

        if (!q) return reply("Bhai, prompt toh dein! Example: .nanobanana2 change background to red");

        await react("⏳");

        // Download the image buffer from WhatsApp
        const buffer = await quoted.download();
        
        // Call the API function
        const result = await nanobanana(q, buffer);

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Edit Successful*\n✨ *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        } else {
            reply("❌ AI ne koi image generate nahi ki.");
        }

    } catch (e) {
        console.error("NB2 Error:", e);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
