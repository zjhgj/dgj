const { cmd } = require("../command");
const axios = require('axios');

// ================= NOVA AI LOGIC =================

const headers = {
  'User-Agent': 'okhttp/4.10.0',
  'Accept-Encoding': 'gzip',
  'platform': 'Android',
  'version': '1.4.0',
  'language': 'in',
  'content-type': 'application/json; charset=utf-8'
};

async function novaAi(text) {
  const payload = {
    question_text: text,
    conversation: {
      conversation_items: []
    }
  };

  const res = await axios.post('https://us-central1-nova-ai---android.cloudfunctions.net/app/ai-response/v2', payload, {
    headers: headers
  });

  return res.data;
}

// ================= COMMAND REGISTER =================

cmd({
    pattern: "nova",
    alias: ["ai", "ask"],
    desc: "Chat with Nova AI assistant.",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a question!\nExample: .nova what is photosynthesis?");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Call
        const result = await novaAi(q);

        if (result && result.answer_text) {
            let response = `*🤖 DR KAMRAN RESPONSE*\n\n${result.answer_text}\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD`;
            
            await conn.sendMessage(from, { 
                text: response,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363424268743982@newsletter",
                        newsletterName: "KAMRAN-MD",
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            reply("❌ Sorry, I couldn't get a response from Nova AI.");
        }

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + (e.response?.data?.message || e.message));
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
