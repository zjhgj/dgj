const axios = require("axios");
const { cmd } = require("../command");

// --- NEW API CONFIGURATION ---
// Purana movanest band ho gaya hai, isliye hum alternative use kar rahe hain.
const API_ENDPOINT = "https://api.apocalypse.web.id/download/aio"; 

cmd({
    pattern: "react",
    alias: ["reactch", "rch"],
    desc: "React to a WhatsApp Channel post (Alternative API).",
    category: 'tools', 
    react: '⚡',
    filename: __filename
}, async (conn, mek, m, { args, text, prefix, command, from, reply }) => {
  try {
    if (!text) {
      return reply(`*Incorrect Usage:*\nExample: ${prefix + command} <link> <emoji>`);
    }

    const postUrl = args[0];
    const emojis = args.slice(1).join(" ");

    if (!postUrl || !emojis) {
        return reply(`❌ *Format:* ${prefix + command} <link> <emoji>`);
    }
    
    // Status update [attachment_0](attachment)
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    reply("⏳ *KAMRAN-MD:* Switching to alternative server...");

    /* NOTE: Kyunke movanest band hai, hum filhal direct reaction API 
       dhund rahe hain. Tab tak hum link validation check kar rahe hain.
    */
    
    // Yahan hum alternative API call karenge
    const apiUrl = `https://asitha.top/creact?url=${encodeURIComponent(postUrl)}&reaction=${encodeURIComponent(emojis)}&apikey=b354f2bfca2f92fd4575d1b7ed0ce56c341a4da22674c55a34a13ced483c3f98`;

    const res = await axios.get(apiUrl);

    if (res.data.status) {
        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        return reply(`✅ *SUCCESS*\n\n🎭 *Emoji:* ${emojis}\n🚀 *Server:* Asitha Backup\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`);
    } else {
        throw new Error("Server response failed.");
    }

  } catch (e) {
    console.error("[KAMRAN-MD ERROR]", e);
    // 
    reply("❌ *API Down:* Movanest server band ho chuka hai aur alternative server bhi filhal response nahi de raha. Please kuch der baad try karein.");
  }
});
