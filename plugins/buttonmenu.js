//---------------------------------------------------------------------------
//           KAMRAN-MD - GPT IMAGE GENERATOR
//---------------------------------------------------------------------------
//  🚀 GENERATE AI IMAGES FROM TEXT PROMPTS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "gptimage",
    alias: ["genimage", "aiimage", "imagine"],
    desc: "Generate AI images from a text prompt.",
    category: "ai",
    use: ".gptimage <a futuristic city>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`✨ *AI Image Generator* ✨\n\nUsage: \`${prefix + command} <your prompt>\`\nExample: \`${prefix + command} a cute cat in space\``);

        // 1. Initial Reaction
        await conn.sendMessage(from, { react: { text: "🎨", key: mek.key } });
        
        // 2. Inform the user (Loading)
        const waitMsg = await reply("⏳ *Generating your vision...* Please wait a moment.");

        // 3. API Request
        // Endpoint: https://api.nexray.web.id/ai/gptimage?prompt=...
        const apiUrl = `https://api.nexray.web.id/ai/gptimage?prompt=${encodeURIComponent(q)}`;
        
        const response = await axios.get(apiUrl, { 
            timeout: 60000, // Image generation takes time
            responseType: 'json' 
        });

        // 4. Handle Response
        // Nexray usually returns the direct image link or a result object
        const imageUrl = response.data.result || response.data.url || response.data.image;

        if (!imageUrl) {
            return reply("❌ *Error:* The AI server did not return an image. Try a different prompt.");
        }

        // 5. Send the Image
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

        // Final Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("GPTImage Error:", e);
        let errorMsg = "Failed to generate image.";
        if (e.code === 'ECONNABORTED') errorMsg = "Server took too long to respond. Try again.";
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${errorMsg}`);
    }
});
