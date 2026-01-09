const { cmd } = require('../command');
const axios = require('axios');

// --- Global Settings ---
global.api = { base: "https://hoshino-apis.vercel.app", key: "zionjs" };
global.prompt = `✨ kamu Hoshino AI, sistem auto-intelligent assistant. ✨ TUGASKU: - Pahami maksud user. - Jawab cepat, rapi, tanpa ribet. - Bisa coding, rewrite, analisa, dan lainnya. - Selalu jawab santai tapi jelas. Gaya bicara: casual profesional, friendly, gak kaku. Selalu jawab langsung inti.`;
global.model = "jokowi"; // Options: jokowi, bella, prabowo, miku
global.autoAi = true; // Default system state

/**
 * Auto AI Voice Note Handler (LID Fixed)
 */
async function autoAIVN(m, sock, isCmd) {
    try {
        // --- GUARDS ---
        if (isCmd) return; // Commands پر ٹرگر نہیں ہوگا
        if (!m.text) return; // خالی میسج پر ٹرگر نہیں ہوگا
        if (m.key.fromMe) return; // بوٹ اپنے میسج پر جواب نہیں دے گا
        if (!global.autoAi) return; // اگر سسٹم آف ہے تو کام نہیں کرے گا

        const userText = m.text;
        
        // --- TRUE LID FIX ---
        // Decode JID to handle LID groups and private chats correctly
        const targetChat = sock.decodeJid(m.chat);

        // 1️⃣ REQUEST KE AI (Gemini)
        const aiUrl = `${global.api.base}/api/ai?q=${encodeURIComponent(userText)}&prompt=${encodeURIComponent(global.prompt)}`;
        const aiRes = await axios.get(aiUrl);
        
        if (!aiRes.data || !aiRes.data.status) return;
        const aiMessage = aiRes.data.response;
        if (!aiMessage) return;

        // 2️⃣ TEXT → VOICE (TTS)
        const audioUrl = `${global.api.base}/api/elevenlabs` + 
                         `?text=${encodeURIComponent(aiMessage)}` + 
                         `&voice=${global.model}` + 
                         `&pitch=0&speed=0.9` + 
                         `&key=${global.api.key}`;

        // 3️⃣ KIRIM VN (To Decoded JID)
        await sock.sendMessage(
            targetChat, 
            { 
                audio: { url: audioUrl }, 
                mimetype: "audio/mpeg", 
                ptt: true 
            }, 
            { quoted: m }
        );

    } catch (err) {
        console.error("AutoAI VN Error:", err.message);
    }
}

// --- Control Command ---
cmd({
    pattern: "autovoice",
    alias: ["autoai", "vnai"],
    react: "🎙️",
    desc: "Turn Auto AI Voice response ON or OFF (LID Fixed).",
    category: "config",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ This command is only for the Bot Owner.");

    if (!q) {
        return reply(`*Current Status:* ${global.autoAi ? "ON ✅" : "OFF ❌"}\n\n*Usage:* \n.autovoice on\n.autovoice off`);
    }

    const action = q.toLowerCase().trim();
    const targetChat = conn.decodeJid(from);

    if (action === 'on') {
        global.autoAi = true;
        reply("🎙️ *Auto AI Voice:* Turned ON.");
    } else if (action === 'off') {
        global.autoAi = false;
        reply("🎙️ *Auto AI Voice:* Turned OFF.");
    } else {
        reply("❌ Use 'on' or 'off'.");
    }
});

module.exports = { autoAIVN };
