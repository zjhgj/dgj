const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "musiccard",
    alias: ["mcard", "songcard"],
    react: "🎵",
    desc: "Generate an iPhone style music card image",
    category: "tools",
    use: ".musiccard Song Name | Artist Name | Image URL (optional)",
    filename: __filename
},
async (conn, mek, m, { args, reply, usedPrefix, command }) => {
    try {
        const text = args.join(" ");
        
        // Input check: Title|Artist format hona chahiye
        if (!text.includes("|")) {
            return reply(`💡 *Usage:* .${command} Shape of You | Ed Sheeran | https://link-to-cover.jpg\n\n_Note: Image URL optional hai._`);
        }

        const [judul, nama, imageUrl] = text.split("|").map(v => v.trim());

        if (!judul || !nama) {
            return reply("❌ Please provide both Song Title and Artist Name separated by |");
        }

        // React with loading
        await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        // API Parameters setup
        const params = new URLSearchParams({ judul, nama });
        if (imageUrl) params.set("image_url", imageUrl);

        const apiUrl = `https://api.nexray.web.id/canvas/musiccard?${params.toString()}`;

        // Fetching image using Axios
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        // Sending the generated card
        await conn.sendMessage(m.chat, { 
            image: buffer, 
            caption: `🎶 *Music Card Generated*\n✨ *Title:* ${judul}\n👤 *Artist:* ${nama}\n\n*DR KAMRAN-MD UTILS*` 
        }, { quoted: mek });

        // React with success
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error("MusicCard Error:", e);
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        reply("⚠️ *Gagal generate music card.* API down ho sakti hai ya image link invalid hai.");
    }
});
