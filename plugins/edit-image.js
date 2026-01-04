//---------------------------------------------------------------------------
//           KAMRAN-MD - THERESA AI CHATBOT
//---------------------------------------------------------------------------
//  🤖 AN ADVANCED AI PERSONALITY FOR CONVERSATIONS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "theresa",
    alias: ["th", "ai2"],
    desc: "Chat with Theresa AI assistant.",
    category: "ai",
    use: ".theresa hello, how are you?",
    filename: __filename,
}, async (conn, mek, m, { from, reply, text, prefix, command }) => {
    try {
        // Validation: Ensure text is provided
        if (!text) {
            return reply(`💬 *Please provide a message!*\n\n*Example:* \`${prefix + command} hello theresa, what's the weather?\``);
        }

        // Check for forbidden characters
        if (text.includes('~')) {
            return reply('❌ The character `~` is not allowed in your query.');
        }

        // React with waiting emoji
        await conn.sendMessage(from, { react: { text: "🧠", key: mek.key } });

        // API Request to Theresa AI
        const url = `https://theresapisv3.vercel.app/ai/theresa?ask=${encodeURIComponent(text)}`;
        const res = await axios.get(url);
        const data = res.data;

        // Check for valid API response
        if (!data.status || !data.result) {
            throw new Error(data.message || 'No result found from Theresa AI.');
        }

        // Process the result: Clean up any tildes if returned by AI
        let responseText = String(data.result).trim();
        responseText = responseText.replace(/~/g, '');

        // Send the AI response with branding
        await conn.sendMessage(from, { 
            text: responseText,
            contextInfo: {
                externalAdReply: {
                    title: "THERESA AI ASSISTANT",
                    body: "KAMRAN-MD Intelligence",
                    thumbnailUrl: "https://files.catbox.moe/k37o6v.jpg", // You can replace this with a Theresa image
                    sourceUrl: "https://github.com/Kamran-Amjad/KAMRAN-MD",
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

        // React with success emoji
        await conn.sendMessage(from, { react: { text: "✨", key: mek.key } });

    } catch (error) {
        console.error("Theresa AI Error:", error);
        
        // React with error emoji
        await conn.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
        
        const errorMsg = error.response?.data?.message || error.message;
        reply(`❌ *An error occurred:* ${errorMsg}`);
    }
});
