const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

/**
 * NanoBanana AI Engine (Fixed 403 & Headers)
 */
async function nanobanana(prompt, imageBuffer) {
    try {
        // Headers ko mazeed update kiya gaya hai takay block na ho
        const commonHeaders = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://nanobananas.pro',
            'Referer': 'https://nanobananas.pro/editor',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Not A(Byte;Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        };

        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: commonHeaders
        });

        // 1. Presigned URL (Check if API endpoint changed)
        const up = await inst.post('/upload/presigned', {
            filename: `ai_edit_${Date.now()}.jpg`,
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Upload URL fetch failed (403/Forbidden).');

        // 2. Upload to S3/Storage
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. CF Turnstile Bypass (Make sure siteKey is still valid)
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });

        if (!cf.data?.result) throw new Error('Turnstile token expired or invalid.');

        // 4. Edit Task (Add all necessary fields)
        const task = await inst.post('/edit', {
            prompt: prompt,
            image_urls: [up.data.data.fileUrl],
            image_size: 'auto',
            turnstileToken: cf.data.result,
            uploadIds: [up.data.data.uploadId],
            userUUID: crypto.randomUUID(),
            imageHash: crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 64)
        });

        if (!task.data?.data?.taskId) throw new Error('Task creation failed.');

        // 5. Polling
        const taskId = task.data.data.taskId;
        let attempts = 0;
        while (attempts < 30) { // Max 1 minute wait
            const r = await inst.get('/task/' + taskId);
            const status = r.data?.data?.status;
            
            if (status === 'completed') return r.data.data.result;
            if (status === 'failed') throw new Error('AI failed to process image.');
            
            await new Promise(res => setTimeout(res, 3000));
            attempts++;
        }
        throw new Error('Processing timeout.');

    } catch (e) {
        // Detailed error for 403
        if (e.response && e.response.status === 403) {
            throw new Error('403 Forbidden: NanoBanana has blocked this request. Try again later or update User-Agent.');
        }
        throw new Error(e.message);
    }
}

cmd({
    pattern: "nanobanana",
    alias: ["editimg2"],
    desc: "Edit image with NanoBanana AI.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/')) return reply("🖼️ Image quote karein.");
        if (!q) return reply("📝 Prompt likhein (e.g. .nanobanana make it vintage)");

        await conn.sendMessage(m.chat, { react: { text: "🍌", key: m.key } });
        reply("🚀 *AI Processing Start...*");

        const buffer = await quoted.download();
        const result = await nanobanana(q, buffer);

        await conn.sendMessage(m.chat, { 
            image: { url: result[0] }, 
            caption: `✅ *Success!*\n\n*Prompt:* ${q}` 
        }, { quoted: m });

    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
    }
});
