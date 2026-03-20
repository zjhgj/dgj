const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

/**
 * NanoBanana AI Image Editing Logic
 */
async function nanobanana(prompt, imageBuffer) {
    try {
        const inst = axios.create({
            baseURL: 'https://nanobananas.pro/api',
            headers: {
                'origin': 'https://nanobananas.pro',
                'referer': 'https://nanobananas.pro/editor',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        });

        // 1. Get Presigned URL for Upload
        const up = await inst.post('/upload/presigned', {
            filename: `${Date.now()}_ai.jpg`,
            contentType: 'image/jpeg'
        });

        if (!up.data?.data?.uploadUrl) throw new Error('Failed to get upload URL.');

        // 2. Upload the Buffer to the provided URL
        await axios.put(up.data.data.uploadUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' }
        });

        // 3. Bypass Cloudflare Turnstile
        const cf = await axios.post('https://api.nekolabs.web.id/tools/bypass/cf-turnstile', {
            url: 'https://nanobananas.pro/editor',
            siteKey: '0x4AAAAAAB8ClzQTJhVDd_pU'
        });

        if (!cf.data?.result) throw new Error('Failed to bypass Turnstile.');

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

        if (!task.data?.data?.taskId) throw new Error('Task ID generation failed.');

        // 5. Poll Task Status until Completed
        const taskId = task.data.data.taskId;
        while (true) {
            const r = await inst.get(`/task/${taskId}`);
            if (r.data?.data?.status === 'completed') {
                return r.data.data.result; // This is usually an array of URLs
            }
            if (r.data?.data?.status === 'failed') {
                throw new Error('AI processing failed.');
            }
            // Wait for 2 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    } catch (e) {
        throw new Error(e.message);
    }
}

// --- BOT COMMAND ---
cmd({
    pattern: "editimg2",
    alias: ["reimage", "nanobanana"],
    desc: "Edit image using NanoBanana AI.",
    category: "ai",
    use: ".editimg <prompt>",
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/')) return reply("🖼️ *براہ کرم کسی تصویر کو کوٹ (Quote) کریں یا تصویر بھیج کر یہ کمانڈ لکھیں۔*");
        if (!q) return reply("📝 *براہ کرم بتائیں کہ تصویر میں کیا تبدیل کرنا ہے؟*\nمثال: `.editimg change background to beach` ");

        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
        reply("🚀 *AI تصویر پر کام کر رہا ہے، براہ کرم تھوڑا انتظار کریں...*");

        // Download the media
        const imageBuffer = await quoted.download();

        // Process via NanoBanana
        const resultUrls = await nanobanana(q, imageBuffer);

        if (resultUrls && resultUrls.length > 0) {
            await conn.sendMessage(m.chat, { 
                image: { url: resultUrls[0] }, 
                caption: `✅ *AI Transformation Completed!*\n\n*Prompt:* ${q}\n*Powered by Knight Bot*`,
                contextInfo: {
                    externalAdReply: {
                        title: "NanoBanana AI Editor",
                        body: "Image edited successfully",
                        mediaType: 1,
                        thumbnail: imageBuffer
                    }
                }
            }, { quoted: m });

            await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } });
        } else {
            throw new Error("No output generated from AI.");
        }

    } catch (e) {
        console.error("EditImg Error:", e);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});

