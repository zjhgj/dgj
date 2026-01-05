//---------------------------------------------------------------------------
//           KAMRAN-MD - JAPAN CECAN RANDOM IMAGE
//---------------------------------------------------------------------------
//  🚀 FETCH RANDOM BEAUTIFUL JAPANESE GIRL IMAGES
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "japan",
    alias: ["cecanjp", "japan-cecan"],
    desc: "Get a random beautiful Japanese girl image.",
    category: "random",
    use: ".japan",
    filename: __filename,
}, async (conn, mek, m, { from, reply, prefix, command }) => {
    try {
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "🇯🇵", key: mek.key } });

        const apiUrl = 'https://api.zenitsu.web.id/api/random/cecan/japan';
        
        // Fetch data from API
        const response = await axios.get(apiUrl);
        
        // Validation: Some APIs return the URL directly, some return an object
        const imageUrl = response.data.result || response.data.url || response.data;

        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
            return reply("❌ *Error:* Failed to fetch image from the server.");
        }

        const caption = `✨ *JAPANESE CECAN* ✨\n\n` +
                        `🌸 *Origin:* Japan\n` +
                        `🖼️ *Source:* Zenitsu API\n\n` +
                        `*🚀 Powered by KAMRAN-MD*`;

        // Send the image with a professional card layout
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: "JAPAN RANDOM IMAGE",
                    body: "Beautiful Japan Girl",
                    mediaType: 1,
                    sourceUrl: "https://whatsapp.com/channel/0029VbAhxYY90x2vgwhXJV3O",
                    thumbnailUrl: imageUrl,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Japan Cecan Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *API Error:* ${e.message || "Failed to connect to Zenitsu API."}`);
    }
});
