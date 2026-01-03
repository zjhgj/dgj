const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "roseday",
    alias: ["rose", "rosequote"],
    react: "🌹",
    desc: "Get a romantic Rose Day quote or message.",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // API کال کرنا
        const apiUrl = `https://api.princetechn.com/api/fun/roseday?apikey=prince`;
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            return reply("❌ API server error. Please try again later.");
        }
        
        const json = await res.json();
        
        // چیک کریں کہ رزلٹ موجود ہے یا نہیں
        if (json && json.result) {
            const rosedayMessage = json.result;
            
            // میسج بھیجنا (LID Safe)
            await conn.sendMessage(from, { 
                text: `🌹 *ROSE DAY MESSAGE* 🌹\n\n${rosedayMessage}` 
            }, { quoted: mek });
        } else {
            reply("❌ Could not fetch a Rose Day quote at the moment.");
        }

    } catch (error) {
        console.error('Error in roseday command:', error);
        reply("❌ Failed to get Rose Day message. Connection error!");
    }
});
