//---------------------------------------------------------------------------
//           KAMRAN-MD - GPT IMAGE GENERATOR (FIXED)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "gptimage",
    alias: ["genimage", "aiimage"],
    desc: "Generate AI images from a text prompt.",
    category: "ai",
    use: ".gptimage <prompt>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`✨ *AI Image Generator* ✨\n\nUsage: \`${prefix + command} <prompt>\``);

        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
        await reply("⏳ *Processing your AI Image...* This can take up to 30-60 seconds.");

        const apiUrl = `https://api.nexray.web.id/ai/gptimage?prompt=${encodeURIComponent(q)}`;
        
        // Increased timeout to 2 minutes (120000ms) for slow AI generation
        const response = await axios.get(apiUrl, { 
            timeout: 120000 
        });

        // Robust data parsing to find the URL
        let imageUrl = null;
        if (typeof response.data === 'string' && response.data.startsWith('http')) {
            imageUrl = response.data;
        } else if (response.data) {
            imageUrl = response.data.result || response.data.url || response.data.image || response.data.data;
        }

        if (!imageUrl) {
            return reply("❌ *API Error:* The server responded but didn't provide an image link. Try a simpler prompt.");
        }

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `✨ *AI GENERATED IMAGE* ✨\n\n📝 *Prompt:* ${q}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`,
            contextInfo: {
                externalAdReply: {
                    title: "GPT-IMAGE GENERATOR",
                    body: "Created via Nexray AI",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: imageUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("GPTImage Error:", e);
        let errorMsg = "API Server is busy or down.";
        if (e.code === 'ECONNABORTED') errorMsg = "Generation took too long. Please try again.";
        if (e.response && e.response.status === 404) errorMsg = "API Endpoint not found.";
        
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${errorMsg}`);
    }
});
