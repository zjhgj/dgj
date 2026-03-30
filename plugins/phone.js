const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "numbers",
    alias: ["numlist", "panel"],
    desc: "Search numbers from the API panel",
    category: "search",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        // Agar user ne kuch nahi likha
        if (!q) return reply("❌ Please provide a name or query to search.\nExample: .numbers kamran");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Call
        const apiUrl = `https://drkamran-api-site.vercel.app/api/search/numbers?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        const data = response.data;

        // Check if data exists
        if (!data || !data.status || !data.result || data.result.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply(`❌ No results found for "${q}".`);
        }

        // Panel List Formatting
        let responseText = `*📊 NUMBERS PANEL LIST*\n\n`;
        responseText += `🔍 *Search Query:* ${q}\n`;
        responseText += `🔢 *Total Found:* ${data.result.length}\n`;
        responseText += `───────────────────\n\n`;

        data.result.forEach((item, index) => {
            responseText += `*${index + 1}.* 👤 *Name:* ${item.name || 'N/A'}\n`;
            responseText += `📱 *Number:* ${item.number || 'N/A'}\n`;
            if (item.address) responseText += `📍 *Address:* ${item.address}\n`;
            responseText += `───────────────────\n`;
        });

        responseText += `\n> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ ⚡*`;

        // Send the list
        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("API ERROR:", e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ API connection error or invalid response.");
    }
});
