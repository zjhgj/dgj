const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

/* ============================= */
/* UTILS (AI LOGIC)              */
/* ============================= */

function genserial() {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

async function upimage(filename) {
    const form = new FormData();
    form.append('file_name', filename);
    const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
        headers: { ...form.getHeaders(), origin: 'https://imgupscaler.ai', referer: 'https://imgupscaler.ai/' }
    });
    return res.data.result;
}

async function uploadtoOSS(putUrl, buffer, mimeType) {
    await axios.put(putUrl, buffer, {
        headers: { 'Content-Type': mimeType, 'Content-Length': buffer.length },
        maxBodyLength: Infinity
    });
    return true;
}

async function createJob(imageUrl, prompt) {
    const form = new FormData();
    form.append('model_name', 'magiceraser_v4');
    form.append('original_image_url', imageUrl);
    form.append('prompt', prompt);
    form.append('ratio', 'match_input_image');
    form.append('output_format', 'jpg');

    const res = await axios.post('https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job', form, {
        headers: { 
            ...form.getHeaders(), 
            'product-code': 'magiceraser', 
            'product-serial': genserial(), 
            origin: 'https://imgupscaler.ai', 
            referer: 'https://imgupscaler.ai/' 
        }
    });
    return res.data.result.job_id;
}

async function cekjob(jobId) {
    const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
        headers: { origin: 'https://imgupscaler.ai', referer: 'https://imgupscaler.ai/' }
    });
    return res.data;
}

/* ============================= */
/* MAIN COMMAND                  */
/* ============================= */

cmd({
    pattern: "nano",
    alias: ["banana", "nanobanana", "editimg"],
    react: "🍌",
    desc: "AI Image Editor (Magic Eraser V4)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quotedMsg = m.quoted ? m.quoted : m;
        const mime = (quotedMsg.msg || quotedMsg).mimetype || '';

        if (!/image/.test(mime)) return reply(`❌ Reply a photo to edit.\nExample: *${prefix + command}* wearing sunglasses`);
        if (!q) return reply(`❌ Please provide a prompt.\nExample: *${prefix + command}* smile wide`);

        // Step 1: Download Image to Buffer
        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        const buffer = await quotedMsg.download();
        const filename = `nano_${Date.now()}.jpg`;

        // Step 2: Process with AI APIs
        const uploadInfo = await upimage(filename);
        await uploadtoOSS(uploadInfo.url, buffer, mime);

        const cdnUrl = 'https://cdn.imgupscaler.ai/' + uploadInfo.object_name;
        const jobId = await createJob(cdnUrl, q);

        let result;
        do {
            await new Promise(r => setTimeout(r, 3000));
            result = await cekjob(jobId);
        } while (result.code === 300006); // Job Pending

        if (result.code !== 0) throw new Error("AI Processing failed.");

        // Step 3: Send Edited Image
        await conn.sendMessage(from, {
            image: { url: result.result.output_url[0] },
            caption: `✅ *KAMRAN-MD AI EDIT SUCCESS*\n\n✨ *Prompt:* ${q}\n🆔 *Job ID:* ${jobId}\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("Nano Error:", err);
        reply("❌ *Error:* " + err.message);
    }
});
        
