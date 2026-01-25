const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// --- Helper Functions ---

function genserial() {
    let s = '';
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

async function uploadFileToAPI(filename) {
    const form = new FormData();
    form.append('file_name', filename);
    const res = await axios.post('https://api.imgupscaler.ai/api/common/upload/upload-image', form, {
        headers: { 
            ...form.getHeaders(), 
            'origin': 'https://imgupscaler.ai', 
            'referer': 'https://imgupscaler.ai/' 
        }
    });
    return res.data.result;
}

async function uploadtoOSS(putUrl, filePath) {
    const file = fs.readFileSync(filePath);
    const type = path.extname(filePath) === '.png' ? 'image/png' : 'image/jpeg';
    const res = await axios.put(putUrl, file, {
        headers: { 
            'Content-Type': type, 
            'Content-Length': file.length 
        },
        maxBodyLength: Infinity
    });
    return res.status === 200;
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
            'origin': 'https://imgupscaler.ai',
            'referer': 'https://imgupscaler.ai/'
        }
    });
    return res.data.result.job_id;
}

async function cekJob(jobId) {
    const res = await axios.get(`https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`, {
        headers: { 
            'origin': 'https://imgupscaler.ai', 
            'referer': 'https://imgupscaler.ai/' 
        }
    });
    return res.data;
}

// --- Main Command ---

cmd({
    pattern: "editai",
    alias: ["nanobanana", "modify"],
    desc: "AI Image Editor.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        // Media detection fix
        const isImage = m.type === 'imageMessage' || (m.type === 'viewOnceMessage' && m.msg.type === 'imageMessage');
        const isQuotedImage = quoted && (quoted.type === 'imageMessage' || (quoted.type === 'viewOnceMessage' && quoted.msg.type === 'imageMessage'));

        if (!isImage && !isQuotedImage) {
            return reply("⚠️ *Instruction:* Ek image bhejein (ya reply karein) aur prompt likhein.\n\n*Example:* .editai make him smile");
        }
        
        if (!q) return reply("⚠️ Aap kya badalna chahte hain? Prompt likhein (e.g. .editai add sunglasses)");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Download Image
        const filePath = `./temp_ai_${Date.now()}.jpg`;
        const buffer = isImage ? await m.download() : await quoted.download();
        fs.writeFileSync(filePath, buffer);

        reply("_🚀 AI processing shuru ho gayi hai..._");

        // Step 1: Upload to server
        const filename = path.basename(filePath);
        const uploadData = await uploadFileToAPI(filename);
        await uploadtoOSS(uploadData.url, filePath);

        // Step 2: Create AI Job
        const cdnUrl = 'https://cdn.imgupscaler.ai/' + uploadData.object_name;
        const jobId = await createJob(cdnUrl, q);

        // Step 3: Polling (Wait for result)
        let result;
        let attempts = 0;
        do {
            await new Promise(r => setTimeout(r, 4000));
            result = await cekJob(jobId);
            attempts++;
            if (attempts > 20) throw new Error("AI Server busy hai, baad mein koshish karein.");
        } while (result.code === 300006 || !result.result?.output_url);

        // Step 4: Send Final Image
        await conn.sendMessage(from, {
            image: { url: result.result.output_url[0] },
            caption: `*🎨 AI EDIT COMPLETED*\n\n*📝 Prompt:* ${q}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`
        }, { quoted: mek });

        // Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        reply("❌ *Error:* " + (e.message || "An error occurred during AI processing"));
    }
});

