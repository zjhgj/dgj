const { cmd } = require("../command");
const axios = require("axios");

// API Configuration
const API_BASE = "https://back.asitha.top/api/endpoint";
const API_KEY = "b354f2bfca2f92fd4575d1b7ed0ce56c341a4da22674c55a34a13ced483c3f98";

cmd({
    pattern: "creact",
    alias: ["channelreact", "cmanager"],
    react: "📢",
    desc: "React to Channel Messages or Manage Channel using Asitha API.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        // Owner Check (Optional but recommended)
        // if (!m.isOwner) return reply("❌ This is an Owner-only command.");

        if (!q) return reply(`❓ *Example:* ${prefix + command} <channel_link>|<emoji>\n\nExample: ${prefix + command} https://whatsapp.com/channel/xxx|🔥`);

        const [link, emoji] = q.split("|");
        if (!link || !emoji) return reply("❌ Please use the format: *Link|Emoji*");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        // Step 1: API Request to Asitha Channel Manager
        // 
        const apiUrl = `${API_BASE}?apiKey=${API_KEY}&url=${encodeURIComponent(link)}&react=${encodeURIComponent(emoji)}`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Step 2: Handle Response
        if (data.status === "success" || data.success === true) {
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
            return reply(`✅ *KAMRAN-MD SUCCESS*\n\n📢 *Channel:* ${link}\n🎭 *Reaction:* ${emoji}\n📝 *Status:* Automation Activated`);
        } else {
            throw new Error(data.message || "API failed to process request.");
        }

    } catch (e) {
        console.error("Channel Manager Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`⚠️ *KAMRAN-MD Error:* ${e.message}\n\n_Make sure your API key is active and the link is public._`);
    }
});

