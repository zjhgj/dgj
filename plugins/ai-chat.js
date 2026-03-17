const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ai",
    alias: ["blackbox", "chatgpt", "kamran"],
    react: "🧠",
    desc: "Ask anything from AI (Blackbox v4).",
    category: "ai",
    use: ".ai what is javascript?",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    
    // SAFE KEY: Crash rokne ke liye
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!text) return reply("❓ Please provide a question!\nExample: .ai write a short poem.");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Send Loading Message
        let waitMsg = await conn.sendMessage(from, { text: "🔍 *AI is thinking...*" }, { quoted: m });

        // Step 2: API Call (Using Blackbox v4 as it's usually faster)
        const apiUrl = `https://arslan-apis.vercel.app/ai/blackboxv4?q=${encodeURIComponent(text)}`;
        const res = await axios.get(apiUrl, { timeout: 30000 });

        if (!res.data || !res.data.status) {
            // Fallback to Blackbox v1 if v4 fails
            const fallbackUrl = `https://arslan-apis.vercel.app/ai/blackbox?q=${encodeURIComponent(text)}`;
            const fallbackRes = await axios.get(fallbackUrl);
            if (!fallbackRes.data?.status) throw new Error("AI service is currently unavailable.");
            
            var aiResponse = fallbackRes.data.result;
        } else {
            var aiResponse = res.data.result;
        }

        let resultMsg = `🤖 *AI RESPONSE (Blackbox)*\n\n${aiResponse}\n\n> © DR KAMRAN ❤️`;

        // Step 3: SAFE EDIT Logic
        if (waitMsg && waitMsg.key) {
            await conn.sendMessage(from, { text: resultMsg, edit: waitMsg.key });
        } else {
            await reply(resultMsg);
        }

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error("AI Error:", e);
        reply(`❌ *AI Error:* ${e.message || "Failed to get response."}`);
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
