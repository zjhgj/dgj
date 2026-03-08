const { cmd } = require("../command");
const axios = require("axios");

// API Configuration
const WEB = "https://yogaxd-react.zone.id";
const VIP_KEY = "YOUR_VIP_KEY_HERE"; // Yahan apni VIP Key dalein

async function sendReaction(url, emoji) {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/145.0.0.0 Mobile Safari/537.36",
        "X-Requested-With": "XMLHttpRequest"
    };

    // 1. Get CSRF Token
    const tokenRes = await axios.get(`${WEB}/api/get-token`, { headers });
    const token = tokenRes.data?.token;
    if (!token) throw new Error("Token generation failed.");

    // 2. Submit Reaction
    const payload = {
        postUrl: url,
        reac: emoji,
        vipKey: VIP_KEY
    };

    const res = await axios.post(`${WEB}/api/submit-vip`, payload, {
        headers: {
            ...headers,
            "Content-Type": "application/json",
            "X-CSRF-Token": token
        }
    });

    return res.data;
}

cmd({
    pattern: "react",
    alias: ["rch", "chreact"],
    react: "🔥",
    desc: "React to a WhatsApp Channel post.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* ${prefix + command} <url>|<emoji>\n\n*Example:* ${prefix + command} https://whatsapp.com/channel/xxx/123|🗿`);

        const [url, emoji] = q.split('|');
        if (!url) return reply("❌ *Please provide a valid URL.*");

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const result = await sendReaction(url.trim(), emoji ? emoji.trim() : "🗿");

        if (result.status === "success" || result.message) {
            reply(`✅ *Reaction Success!*\n\n🚀 *Target:* ${url}\n✨ *Emoji:* ${emoji || '🗿'}\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`);
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } else {
            throw new Error(JSON.stringify(result));
        }

    } catch (e) {
        console.error("RCH Error:", e);
        reply(`🍂 *KAMRAN-MD Error:* ${e.message}`);
    }
});
  
