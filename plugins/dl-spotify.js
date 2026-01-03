const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "goodnight",
    alias: ["gn", "night"],
    react: "🌙",
    desc: "Get a romantic or sweet goodnight message.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // API کلید اور یو آر ایل
        const shizokeys = 'shizo';
        const url = `https://shizoapi.onrender.com/api/texts/lovenight?apikey=${shizokeys}`;
        
        // ڈیٹا حاصل کرنا
        const res = await fetch(url);
        
        if (!res.ok) {
            return reply("❌ API server error. Please try again later.");
        }
        
        const json = await res.json();
        
        // چیک کریں کہ رزلٹ موجود ہے یا نہیں
        if (json && json.result) {
            const goodnightMessage = json.result;
            // میسج بھیجنا
            await conn.sendMessage(from, { text: goodnightMessage }, { quoted: mek });
        } else {
            reply("❌ Could not fetch a goodnight message at the moment.");
        }

    } catch (error) {
        console.error('Error in goodnight command:', error);
        reply("❌ Failed to get goodnight message. Connection error!");
    }
});
