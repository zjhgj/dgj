//---------------------------------------------------------------------------
//           KAMRAN-MD - AI WATERMARK REMOVER (FIXED)
//---------------------------------------------------------------------------
//  🚀 REMOVE WATERMARKS FROM IMAGES USING AIENHANCER.AI
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

/**
 * Core Logic: Interacts with aienhancer.ai API
 */
async function Removewm(buffer) {
    if (!buffer) throw new Error('Buffer is empty or undefined.');
    const base64 = buffer.toString('base64');
    
    const { data: create } = await axios.post(
        'https://aienhancer.ai/api/v1/r/image-enhance/create',
        {
            model: 5,
            image: `data:image/jpeg;base64,${base64}`,
            settings: "L7p91uXhVyp5OOJthAyqjSqhlbM+RPZ8+h2Uq9tz6Y+4Agarugz8f4JjxjEycxEzuj/7+6Q0YY9jUvrfmqkucENhHAkMq1EOilzosQlw2msQpW2yRqV3C/WqvP/jrmSu3aUVAyeFhSbK3ARzowBzQYPVHtxwBbTWwlSR4tehnoeSewAjTf2d1dr81ZHNdpu/4WcmHd8FILhKHTW6OmCYv2AdDatvgW7W0a1Gd4NBzo8Pdvv0WIqOyjYwBILaNp+iMmpMdGlqx0c8HAwv5bhRe9cQxPZ3nc3+5gOaGkQpdDLqWTBJ5ubZDRx4n9+eq5r9YwDkM6kIfIgRllWq8YXdqtedk9LlGHPskMzJxq8gMUizZVCJMcC5pfImUUlLic6G9KHERqHoNE1DmZo/aGzY4a8psucXHmUgcgsjn08PZEkEKv2r4HQoZ+yx7AGHJyOSLPT1TCkViqyUyK/ofwdwOH2zJhei4mV1TYfgzBxgnIP8zv3/fpo/diUERbN/zUmM3LJIYfYA7egJS0KeYzbsb72DD/RjCu22f4XxxF2UIftFJqSTesga8O2jfkdg8sTcrTJNgf4vefoc4azu2C1XHCEq+Ye0MxcJ6EYIhyeU7ne0k7RXJzYhzRzL9WN2PqZOUEhR18Znu3jtI6hbT//PEw=="
        },
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 13)',
                'Content-Type': 'application/json',
                'origin': 'https://aienhancer.ai/',
                'referer': 'https://aienhancer.ai/remove-watermark-from-image'
            }
        }
    );

    const taskId = create.data?.id;
    if (!taskId) throw new Error('Task ID not found from AI server.');

    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 4000));

        const { data: status } = await axios.post(
            `https://aienhancer.ai/api/v1/r/image-enhance/result`, 
            { task_id: taskId },
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 13)',
                    'Content-Type': 'application/json',
                    'origin': 'https://aienhancer.ai/',
                    'referer': 'https://aienhancer.ai/remove-watermark-from-image'
                }
            }
        );

        if (status.data.status === 'succeeded') {
            return status.data.result_image;
        }

        if (status.data.status === 'failed') {
            throw new Error(status.data.error || 'AI Processing failed');
        }
    }
    throw new Error('Processing Timeout.');
}

cmd({
    pattern: "removewm",
    alias: ["unwm", "dewm"],
    desc: "Remove watermarks from an image using AI.",
    category: "ai",
    use: ".removewm (reply to image)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/image/.test(mime)) {
            return reply(`📸 *Watermark Remover*\n\nPlease reply to an image with \`${prefix + command}\``);
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // --- FIXED DOWNLOAD LOGIC ---
        let mediaBuffer;
        try {
            mediaBuffer = await q.download();
        } catch (downloadErr) {
            // Fallback for some framework versions
            mediaBuffer = await conn.downloadMediaMessage(q);
        }

        if (!mediaBuffer) return reply("❌ Error: Could not download the image. Make sure it is still accessible in the chat.");

        const resultUrl = await Removewm(mediaBuffer);

        await conn.sendMessage(from, {
            image: { url: resultUrl },
            caption: `✅ *Watermark Removed Successfully!*\n\n*🚀 Powered by KAMRAN-MD*`,
            contextInfo: {
                externalAdReply: {
                    title: "AI WATERMARK REMOVER",
                    body: "Clean Image Generated",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: resultUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("RemoveWM Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message || "Something went wrong."}`);
    }
});
