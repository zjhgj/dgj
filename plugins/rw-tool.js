//---------------------------------------------------------------------------
//           KAMRAN-MD - AI IMAGE EDITOR (IMG2IMG)
//---------------------------------------------------------------------------
//  🚀 POWERED BY IMGEDITOR API (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional branding
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

const BASE = "https://imgeditor.co/api";

/**
 * Upload Image Buffer to ImgEditor
 */
async function uploadImage(buffer) {
    const res = await axios.post(`${BASE}/get-upload-url`, {
        fileName: "image.jpg",
        contentType: "image/jpeg",
        fileSize: buffer.length
    }, { headers: { "content-type": "application/json" } });

    const json = res.data;
    if (!json.uploadUrl || !json.publicUrl) throw new Error("Gagal mendapatkan upload url");

    await axios.put(json.uploadUrl, buffer, {
        headers: { "content-type": "image/jpeg" }
    });

    return json.publicUrl;
}

/**
 * Request AI Image Generation
 */
async function generateImage(prompt, imageUrl) {
    const res = await axios.post(`${BASE}/generate-image`, {
        prompt,
        styleId: "realistic",
        mode: "image",
        imageUrl,
        imageUrls: [imageUrl],
        numImages: 1,
        outputFormat: "png",
        model: "nano-banana"
    }, { headers: { "content-type": "application/json" } });

    if (!res.data.taskId) throw new Error("Task creation failed");
    return res.data.taskId;
}

/**
 * Wait for AI Task Completion
 */
async function waitResult(taskId) {
    while (true) {
        await new Promise(r => setTimeout(r, 2500));
        const res = await axios.get(`${BASE}/generate-image/status?taskId=${taskId}`);
        const json = res.data;

        if (json.status === "completed" && json.imageUrl) return json.imageUrl;
        if (json.status === "failed") throw new Error("Generation failed");
    }
}

// --- COMMAND: EDIT IMAGE ---

cmd({
    pattern: "editimg",
    alias: ["imgai", "reimagine"],
    desc: "Edit an image using AI prompt.",
    category: "ai",
    react: "🎨",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!/image/.test(mime)) return reply("📸 Please reply to an image with a prompt.\nExample: `.editimg change to a robot` ");
        if (!text) return reply("❓ Please provide a prompt for AI.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // 1. Download and Upload
        const mediaBuffer = await q.download();
        const publicUrl = await uploadImage(mediaBuffer);
        
        // 2. Generate Task
        const taskId = await generateImage(text, publicUrl);
        
        // 3. Wait for result
        const resultUrl = await waitResult(taskId);

        await conn.sendMessage(from, { 
            image: { url: resultUrl }, 
            caption: `*🎨 AI Edit Completed*\n\n*Prompt:* ${text}\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AI Editor Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
