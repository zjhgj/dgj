//---------------------------------------------------------------------------
//           KAMRAN-MD - REMOVE BACKGROUND AI
//---------------------------------------------------------------------------
//  🚀 REMOVE IMAGE BACKGROUND AUTOMATICALLY USING AI ENGINE
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');

/**
 * Generates a unique client ID for session management
 */
function generateClientId() {
    return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 16).toString(16)
    ).join('');
}

/**
 * Core Background Removal Logic
 */
async function processRemoveBG(imageBuffer) {
    const clientId = generateClientId();
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
    });

    // Step 1: Upload to Server
    await fetch('https://image-upscaling.net/removebg_upload', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Origin': 'https://image-upscaling.net',
            'Referer': 'https://image-upscaling.net/removebg/en.html',
            'Cookie': `client_id=${clientId}`,
            ...formData.getHeaders()
        },
        body: formData
    });
    
    let processed = false;
    let resultUrl = null;
    let attempts = 0;

    // Step 2: Poll status until finished
    while (!processed && attempts < 40) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const statusResponse = await fetch('https://image-upscaling.net/removebg_get_status', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://image-upscaling.net/removebg/en.html',
                'Cookie': `client_id=${clientId}`
            }
        });

        const status = await statusResponse.json();
        
        if (status.processed && status.processed.length > 0) {
            processed = true;
            resultUrl = status.processed[0];
        }
    }

    if (!resultUrl) throw new Error("AI Processing Timeout.");

    // Step 3: Download final transparent image
    const imageResponse = await fetch(resultUrl, {
        headers: {
            'Referer': 'https://image-upscaling.net/removebg/en.html',
            'Cookie': `client_id=${clientId}`
        }
    });

    return await imageResponse.buffer();
}

// --- COMMAND: REMOVEBG ---

cmd({
    pattern: "removebg",
    alias: ["nobg", "rmbg", "transparent"],
    desc: "Remove background from an image using AI.",
    category: "tools",
    use: ".removebg (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!/image/.test(mime)) {
            return reply(`📸 Please reply to an *image* with \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply(`_✂️ Removing background, please wait..._`);

        // Download media from WhatsApp
        const mediaBuffer = await q.download();
        if (!mediaBuffer) throw new Error("Could not download image.");

        // Call AI Processing
        const resultBuffer = await processRemoveBG(mediaBuffer);

        // Send back the Transparent PNG
        await conn.sendMessage(from, {
            document: resultBuffer,
            mimetype: 'image/png',
            fileName: 'no_background.png',
            caption: `✅ *BACKGROUND REMOVED SUCCESSFUL*\n\n✨ *Format:* Transparent PNG\n\n*🚀 Powered by KAMRAN-MD*`,
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
        console.error("RemoveBG Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Failed to process image."}`);
    }
});
