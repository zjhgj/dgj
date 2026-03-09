const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "channel",
    alias: ["getid", "waid"],
    react: "🔍",
    desc: "Get WhatsApp Channel Information",
    category: "tools",
    use: ".channel <link>",
    filename: __filename
},
async (arslan, mek, m, { from, args, reply }) => {
    try {
        const url = args[0];
        if (!url || !url.includes("whatsapp.com/channel/")) {
            return reply("❌ Please provide a valid WhatsApp Channel link!");
        }

        await arslan.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://api.fikprojects.web.id/cekidch?apikey=FreeKeys&url=${url}`;
        const res = await axios.get(apiUrl);

        if (!res.data || !res.data.status) {
            return reply("❌ Could not fetch channel data. Link galat ho sakta hai.");
        }

        const data = res.data.data;
        
        let caption = `📢 *CHANNEL INFORMATION*\n\n`;
        caption += `📝 *Name:* ${data.name}\n`;
        caption += `🆔 *ID:* ${data.id}\n`;
        caption += `👥 *Followers:* ${data.Pengikut}\n`;
        caption += `✅ *Verified:* ${data.Verified === "Tidak" ? "No" : "Yes"}\n`;
        caption += `🔗 *Invite Code:* ${data.Invite}\n\n`;
        caption += `📜 *Description:* \n${data.Deskripsi}\n\n`;
        caption += `> © kamran-MD`;

        await arslan.sendMessage(from, {
            image: { url: data.Photo },
            caption: caption
        }, { quoted: m });

        await arslan.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("CHANNEL ERROR:", err);
        reply("❌ System Error! Please try again later.");
        await arslan.sendMessage(from, { react: { text: "❌", key: m.key } });
    }
});

