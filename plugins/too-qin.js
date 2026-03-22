const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

/**
 * NanoBanana AI Engine
 * Logic to upload, bypass CF, and poll for edited image
 */
async function nanobanana(prompt, imageBuffer) {
    try {
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                'origin': 'https://nanobananas.pro',
                'referer': 'https://nanobananas.pro/editor',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        // 1. Get Presigned Upload URL
        const up = await inst.post('/upload/presigned', {
            filename: Date.now() + '_ai.jpg',
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Upload URL not found.');

        // 2. Upload Image Buffer
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. Bypass Cloudflare Turnstile
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });

        if (!cf.data?.result) throw new Error('Failed to get Cloudflare token.');

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

        // 5. Polling for Completion
        const taskId = task.data.data.taskId;
        while (true) {
            const r = await inst.get('/task/' + taskId);
            if (r.data?.data?.status === 'completed') {
                return r.data.data.result; // This is the edited image URL array
            }
            if (r.data?.data?.status === 'failed') {
                throw new Error('AI Processing failed.');
            }
            // Wait 2 seconds before next poll
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (e) {
        throw new Error(e.message);
    }
}

// --- COMMAND DEFINITION ---
cmd({
    pattern: "editimg",
    alias: ["aiedit", "nanobanana"],
    desc: "Edit image using NanoBanana AI.",
    category: "ai",
    use: ".editimg <prompt>",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Validate Image
        if (!mime.startsWith('image/')) {
            return reply("🖼️ *براہ کرم کسی تصویر کو کوٹ (Quote) کریں یا تصویر کے ساتھ یہ کمانڈ لکھیں۔*");
        }

        // Validate Prompt
        if (!q) {
            return reply("📝 *بتائیں کہ تصویر میں کیا تبدیلی کرنی ہے؟*\n*مثال:* `.editimg make it look like a rainy night` ");
        }

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
        reply("🚀 *AI تصویر پر کام کر رہا ہے، تھوڑا انتظار کریں...*");

        // Download Media
        const imageBuffer = await quoted.download();

        // Process Image
        const result = await nanobanana(q, imageBuffer);

        if (result && result.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: result[0] }, 
                caption: `✅ *AI Transformation Success*\n\n*Prompt:* ${q}\n*Powered by Knight Bot*`
            }, { quoted: m });

            await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });
        } else {
            throw new Error("No output received from AI.");
        }

    } catch (e) {
        console.error("EditImg Plugin Error:", e);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});
