//---------------------------------------------------------------------------
//           KAMRAN-MD - NANO BANANA (AI PHOTO EDITOR)
//---------------------------------------------------------------------------
//  🎨 EDIT PHOTOS USING AI STYLES (ANIME, CYBERPUNK, ETC.)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

// API Headers for PhotoEditorAI
const headers = {
    'Product-Code': '067003',
    'Product-Serial': 'vj6o8n'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Creates an AI editing job
 */
async function createJob(buffer, prompt) {
    const form = new FormData();
    form.append('model_name', 'seedream');
    form.append('edit_type', 'style_transfer');
    form.append('prompt', prompt);
    
    // Convert buffer to readable stream for form-data
    const stream = Readable.from(buffer);
    form.append('target_images', stream, { 
        filename: 'input.jpg', 
        contentType: 'image/jpeg' 
    });

    const { data } = await axios.post(
        'https://api.photoeditorai.io/pe/photo-editor/create-job',
        form,
        { headers: { ...form.getHeaders(), ...headers } }
    );

    if (!data.result || !data.result.job_id) throw new Error("Failed to create AI job.");
    return data.result.job_id;
}

/**
 * Polls the job status until completion
 */
async function getResult(jobId) {
    let attempts = 0;
    while (attempts < 20) {
        const { data } = await axios.get(
            `https://api.photoeditorai.io/pe/photo-editor/get-job/${jobId}`,
            { headers }
        );
        
        // Status 2 means completed
        if (data.result.status === 2 && data.result.output?.length) {
            return data.result.output[0];
        }
        
        if (data.result.status === -1) throw new Error("AI Job failed.");
        
        await sleep(3000);
        attempts++;
    }
    throw new Error("Job polling timeout.");
}

// --- COMMAND: NANOBANANA ---

cmd({
    pattern: "nanobanana",
    alias: ["editimg", "style", "ai-edit"],
    desc: "Edit image style using AI prompt.",
    category: "ai",
    use: ".nanobanana change to anime (reply to photo)",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text) return reply(`📸 Please provide a prompt!\n*Example:* \`${prefix + command} convert to professional oil painting\``);

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!/image/.test(mime)) return reply("❌ Please reply to an image.");

        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
        
        // Downloading media
        const buffer = await q.download();
        
        reply("_🎨 AI is transforming your image, please wait..._");

        // Step 1: Create Job
        const jobId = await createJob(buffer, text.trim());

        // Step 2: Get Result URL
        const resultUrl = await getResult(jobId);

        // Step 3: Send processed image
        await conn.sendMessage(from, {
            image: { url: resultUrl },
            caption: `✨ *IMAGE TRANSFORMED*\n\n📝 *Prompt:* ${text}\n🤖 *Model:* Nano Banana AI\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Failed to edit image."}`);
    }
});
