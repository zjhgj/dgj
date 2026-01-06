//---------------------------------------------------------------------------
//           KAMRAN-MD - AUTO AI VOICE NOTE (PTT)
//---------------------------------------------------------------------------
//  🚀 AUTOMATICALLY RESPOND TO TEXT WITH AI VOICE (JOKOWI/MIKU/ETC)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// --- SETTINGS ---
const AI_CONFIG = {
    base: "https://hoshino-apis.vercel.app",
    key: "zionjs",
    model: "jokowi", // Available: jokowi, bella, prabowo, miku
    prompt: `✨ kamu Hoshino AI, sistem auto-intelligent assistant. 
    TUGASKU: - Pahami maksud user. - Jawab cepat, rapi, tanpa ribet. 
    - Bisa coding, rewrite, analisa, dan lainnya. - Selalu jawab santai tapi jelas. 
    Gaya bicara: casual profesional, friendly, gak kaku. Selalu jawab langsung inti.`
};

// Toggle for Auto AI (Set to true to enable global auto-response)
let autoAiEnabled = true; 

/**
 * Main Auto AI Function
 * This logic handles non-command messages
 */
cmd({
    on: "text" // This listens to every text message
}, async (conn, mek, m, { from, body, isCmd, isGroup, sender }) => {
    try {
        // ❌ Guard Clauses
        if (!autoAiEnabled) return;
        if (isCmd) return; // Skip if it's a bot command
        if (m.key.fromMe) return; // Skip if message is from the bot itself
        if (!body || body.length < 2) return; // Skip very short messages or empty ones

        // 1️⃣ REQUEST TO AI (Gemini/Hoshino)
        const aiUrl = `${AI_CONFIG.base}/api/ai?q=${encodeURIComponent(body)}&prompt=${encodeURIComponent(AI_CONFIG.prompt)}`;
        
        const aiRes = await axios.get(aiUrl);
        if (!aiRes.data || !aiRes.data.status) return;

        const aiMessage = aiRes.data.response;
        if (!aiMessage) return;

        // 2️⃣ TEXT → VOICE (ElevenLabs via Hoshino API)
        const audioUrl = `${AI_CONFIG.base}/api/elevenlabs` + 
                         `?text=${encodeURIComponent(aiMessage)}` + 
                         `&voice=${AI_CONFIG.model}` + 
                         `&pitch=0&speed=0.9` + 
                         `&key=${AI_CONFIG.key}`;

        // 3️⃣ SEND AS VOICE NOTE (PTT)
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
        // Silent error to prevent console spam during auto-chat
        console.error("AutoAI VN Error:", err.message);
    }
});

// --- TOGGLE COMMAND ---
cmd({
    pattern: "autoai",
    desc: "Enable/Disable Auto AI Voice response",
    category: "owner",
    use: ".autoai on/off",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only.");
    
    if (q === "on") {
        autoAiEnabled = true;
        reply("✅ Auto AI Voice Note has been enabled.");
    } else if (q === "off") {
        autoAiEnabled = false;
        reply("❌ Auto AI Voice Note has been disabled.");
    } else {
        reply(`Current status: *${autoAiEnabled ? "ON" : "OFF"}*\nUse \`.autoai on\` or \`.autoai off\``);
    }
});
