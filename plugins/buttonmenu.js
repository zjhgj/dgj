//---------------------------------------------------------------------------
//           KAMRAN-MD - IMPROVED AUTO AI VOICE NOTE
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// --- SETTINGS ---
const AI_CONFIG = {
    base: "https://hoshino-apis.vercel.app",
    key: "zionjs",
    model: "jokowi", 
    prompt: `Kamu Hoshino AI, assistant yang cerdas. Jawab dengan santai, singkat, padat, dan jelas. Langsung ke inti jawaban.`
};

// Global toggle
let autoAiEnabled = true;

cmd({
    on: "text"
}, async (conn, mek, m, { from, body, isCmd, isGroup, sender, pushname }) => {
    try {
        // 1. Validation logic
        if (!autoAiEnabled) return;
        if (isCmd) return; 
        if (m.key.fromMe) return;
        if (!body || body.length < 1) return;

        // 2. Add "Typing" status so user knows bot is thinking
        await conn.sendPresenceUpdate('composing', from);

        // 3. Get AI Response
        const aiUrl = `${AI_CONFIG.base}/api/ai?q=${encodeURIComponent(body)}&prompt=${encodeURIComponent(AI_CONFIG.prompt)}`;
        
        const aiRes = await axios.get(aiUrl, { timeout: 20000 });
        
        if (!aiRes.data || !aiRes.data.status || !aiRes.data.response) {
            // If AI fails, we stop here silently
            return;
        }

        const aiText = aiRes.data.response;

        // 4. Generate Audio (Voice Note)
        const audioUrl = `${AI_CONFIG.base}/api/elevenlabs` + 
                         `?text=${encodeURIComponent(aiText)}` + 
                         `&voice=${AI_CONFIG.model}` + 
                         `&pitch=0&speed=0.9` + 
                         `&key=${AI_CONFIG.key}`;

        // 5. Send as Recording (VN)
        await conn.sendPresenceUpdate('recording', from);
        
        await conn.sendMessage(
            from,
            { 
                audio: { url: audioUrl }, 
                mimetype: "audio/mpeg", 
                ptt: true 
            }, 
            { quoted: mek }
        );

    } catch (err) {
        console.error("AutoAI Error:", err.message);
    }
});

// --- TOGGLE COMMAND ---
cmd({
    pattern: "autoai",
    desc: "Turn Auto AI VN On/Off",
    category: "owner",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Only Owner can use this.");
    
    if (q === "on") {
        autoAiEnabled = true;
        reply("✅ Auto AI Voice enabled.");
    } else if (q === "off") {
        autoAiEnabled = false;
        reply("❌ Auto AI Voice disabled.");
    } else {
        reply(`Status: *${autoAiEnabled ? "ON" : "OFF"}*\nUse \`.autoai on\` or \`.autoai off\``);
    }
});
