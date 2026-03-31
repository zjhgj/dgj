const { cmd } = require("../command");
const axios = require("axios");

const FOOTER = "> *🤍ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD🤍*";

cmd({
    pattern: "channel",
    alias: ["wa-channel", "metadata"],
    desc: "Fetch WhatsApp Channel Details",
    category: "tools",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a WhatsApp Channel link.");
        if (!q.includes("whatsapp.com/channel/")) return reply("❌ Invalid WhatsApp Channel link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Headers as per your provided code
        const headers = {
            'host': 'back.asitha.top',
            'sec-ch-ua-platform': '"Android"',
            'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MzVhMWY3MTE0YWI3MTE5ZmM4ZTViMyIsImlhdCI6MTc3NDk2NDYwMywiZXhwIjoxNzc1NTY5NDAzfQ.6tyg2Qa9KrxsEEp6K6_nECfwrhZjBZmG3r-AnzS-_Eo',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36',
            'accept': 'application/json, text/plain, */*',
            'origin': 'https://asitha.top',
            'referer': 'https://asitha.top/'
        };

        // Step 1: Fetch Metadata from API
        const apiRes = await axios.get(`https://back.asitha.top/api/channel/metadata-proxy?url=${encodeURIComponent(q)}`, { headers });
        const res = apiRes.data;

        // Step 2: Fetch Image from HTML (Fallback logic)
        const htmlPage = await axios.get(q);
        const html = htmlPage.data;
        const image = html.match(/<meta property="og:image" content="(.*?)"/)?.[1]?.replace(/&amp;/g, '&') || res.preview;

        // Step 3: Format Response
        let channelInfo = `📢 *WHATSAPP CHANNEL INFO*\n\n`;
        channelInfo += `📝 *Name:* ${res.name || "N/A"}\n`;
        channelInfo += `👥 *Followers:* ${res.followers || "Hidden"}\n`;
        channelInfo += `🆔 *JID:* ${res.jid || "N/A"}\n`;
        channelInfo += `🔗 *Invite:* ${q.split('/').filter(Boolean).pop()}\n\n`;
        channelInfo += FOOTER;

        // Send with Profile Photo
        if (image) {
            await conn.sendMessage(from, {
                image: { url: image },
                caption: channelInfo
            }, { quoted: mek });
        } else {
            await reply(channelInfo);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Channel Metadata Error:", e);
        reply("❌ Error: API Token expired or connection blocked.");
    }
});
