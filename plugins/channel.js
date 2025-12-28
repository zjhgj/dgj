//---------------------------------------------------------------------------
//           KAMRAN-MD - CHANNEL MESSAGE REACT (RCH)
//---------------------------------------------------------------------------
//  🚀 SEND AUTO REACTIONS TO CHANNELS (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

cmd({
    pattern: "rch",
    alias: ["reactch", "channelreact"],
    desc: "React to a channel message using a link and emojis.",
    category: "utility",
    react: "🎭",
    filename: __filename,
}, async (conn, mek, m, { from, args, reply }) => {
    // API key and usage check
    const apiKey = ""; // Get your API key from https://asitha.top/channel-manager
    
    if (args.length < 2) {
        return reply("⚠️ *Format Invalid*\n\nUsage: `.rch <link> <emoji1> <emoji2> ...`\nExample: `.rch https://whatsapp.com/channel/.../123 ❤️ 🔥 👍` ");
    }

    const link = args.shift();
    let emojiList = args.join(" ")
        .replace(/,/g, " ")
        .split(/\s+/)
        .filter(e => e.trim());

    const emoji = emojiList.join(",");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const url = `https://react.whyux-xec.my.id/api/rch?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emoji)}`;
        
        const res = await axios.get(url, {
            headers: {
                "x-api-key": apiKey
            }
        });

        const json = res.data;

        // Creating a clean response message
        let statusEmoji = json.status ? "✅" : "❌";
        let responseMsg = `╭──〔 *🎭 CHANNEL REACT* 〕  
├─ ${statusEmoji} *Status:* ${json.status ? 'Success' : 'Failed'}
├─ 🔗 *Link:* ${link.substring(0, 30)}...
├─ ✨ *Emojis:* ${emoji}
╰───────────────────🚀

*Detailed Response:*
\`\`\`${JSON.stringify(json, null, 2)}\`\`\`

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, { 
            text: responseMsg,
            contextInfo: newsletterContext
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: json.status ? "✅" : "❌", key: mek.key } });

    } catch (e) {
        console.error("ReactCH Error:", e);
        reply("❌ Error while connecting to the API!");
    }
});
