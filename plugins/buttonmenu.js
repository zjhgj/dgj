const { cmd } = require('../command');
const axios = require('axios');

// --- SETTINGS ---
const AI_CONFIG = {
    base: "https://hoshino-apis.vercel.app",
    key: "zionjs", // <-- Agar ye key block hai to reply nahi aayega
    model: "jokowi", 
    prompt: `Kamu Hoshino AI. Jawablah setiap pertanyaan user dengan sangat singkat dan jelas.`
};

let autoAiEnabled = true;

cmd({
    on: "text"
}, async (conn, mek, m, { from, body, isCmd, sender }) => {
    try {
        // Validation
        if (!autoAiEnabled || isCmd || m.key.fromMe || !body) return;

        // Start Typing
        await conn.sendPresenceUpdate('composing', from);

        // 1. Get AI Text Response
        const aiUrl = `${AI_CONFIG.base}/api/ai?q=${encodeURIComponent(body)}&prompt=${encodeURIComponent(AI_CONFIG.prompt)}`;
        const aiRes = await axios.get(aiUrl);
        
        if (!aiRes.data || !aiRes.data.status || !aiRes.data.response) return;
        const aiText = aiRes.data.response;

        // 2. Try to send Voice Note
        try {
            const audioUrl = `${AI_CONFIG.base}/api/elevenlabs?text=${encodeURIComponent(aiText)}&voice=${AI_CONFIG.model}&key=${AI_CONFIG.key}`;
            
            await conn.sendPresenceUpdate('recording', from);
            await conn.sendMessage(from, { 
                audio: { url: audioUrl }, 
                mimetype: "audio/mpeg", 
                ptt: true 
            }, { quoted: mek });

        } catch (vnError) {
            // 3. Fallback: Agar Voice API fail ho jaye to Text bhej do
            console.log("Voice API Failed, sending text instead...");
            await conn.sendMessage(from, { text: aiText }, { quoted: mek });
        }

    } catch (err) {
        console.error("AutoAI Error:", err.message);
    }
});

// Command to turn it on/off
cmd({
    pattern: "autoai",
    category: "owner",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Owner only.");
    if (q === "on") { autoAiEnabled = true; reply("✅ Auto AI ON"); }
    else if (q === "off") { autoAiEnabled = false; reply("❌ Auto AI OFF"); }
    else reply(`Status: ${autoAiEnabled ? "ON" : "OFF"}`);
});
