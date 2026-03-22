const { cmd } = require('../command'); // Aapke bot ka standard path
const axios = require('axios');
const crypto = require('crypto');

// --- AI EDITING FUNCTION ---
async function nanobanana(prompt, imageBuffer) {
    try {
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                'origin': 'https://nanobananas.pro',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            }
        });

        // 1. Get Presigned Upload URL
        const up = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_ai.jpg`,
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Upload URL not found.');
        
        // 2. Upload Image Buffer
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. Bypass Cloudflare Turnstile (Using NekoLabs API)
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });
        
        if (!cf.data?.result) throw new Error('Cloudflare bypass failed.');

        // 4. Create Editing Task
        const task = await inst.post('/edit', {
            prompt,
            image_urls: [up.data.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.data.result,
            uploadIds: [up.data.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(imageBuffer).digest('hex')
        });

        if (!task.data?.data?.taskId) throw new Error('Task ID not found.');

        // 5. Polling for Completion
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

// --- BOT COMMAND ---
cmd({
    pattern: "editimg2",
    alias: ["editai2", "nanobanana2"],
    category: "ai",
    react: "🪄",
    desc: "Edit image using AI prompts"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    try {
        const isQuotedImage = m.quoted && (m.quoted.type === 'imageMessage' || (m.quoted.msg && m.quoted.msg.mimetype && m.quoted.msg.mimetype.startsWith('image/')));
        const isImage = m.type === 'imageMessage';

        if (!isImage && !isQuotedImage) return reply("Bhai, kisi image ko mention karein ya reply karein!");
        if (!q) return reply("Bhai, prompt toh dein ke image mein kya change karna hai?");

        await react("⏳");
        
        // Download Image
        const imageBuffer = await (m.quoted ? m.quoted.download() : m.download());
        
        const result = await nanobanana(q, imageBuffer);

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Edit Complete*\n✨ *Prompt:* ${q}\n\n> *${botFooter}*` 
            }, { quoted: mek });
            await react("✅");
        } else {
            throw new Error("No result from AI.");
        }

    } catch (e) {
        console.error(e);
        await react("❌");
        reply(`❌ Error: ${e.message}`);
    }
});
