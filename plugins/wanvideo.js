const { cmd } = require("../command");
const { WanVideoGenerator } = require("../lib/wanvideo");

cmd({
    pattern: "wanvideo",
    alias: ["t2v", "ai-video"],
    react: "🎬",
    desc: "Generate AI Video from text.",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    if (!q) return reply(`❓ *Example:* ${prefix + command} a small cat playing with wool`);

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    reply("🎬 *KAMRAN-MD:* Generating your video... This may take a minute.");

    try {
        const wan = new WanVideoGenerator();
        const videoUrl = await wan.generate(q);

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `🎬 *AI VIDEO GENERATED*\n✨ *Prompt:* ${q}\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        reply(`❌ *Error:* GPU might be overloaded. Try again later.`);
    }
});


