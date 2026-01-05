//---------------------------------------------------------------------------
//           KAMRAN-MD - PREMIUM YOUTUBE DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD MP3/MP4 WITH INTERACTIVE SELECTION & STYLISH UI
//---------------------------------------------------------------------------

const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// Cache to prevent redundant API calls
const cache = new Map();

/**
 * Normalizes different YouTube URL formats
 */
function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
 * Fetches Download Data (MP4/MP3) from the Jawad-Tech API
 */
async function fetchMediaData(url) {
  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { timeout: 15000 });
    if (response.data && response.data.status) {
        return response.data.result;
    }
    return null;
  } catch (e) {
    console.error("API Error:", e.message);
    return null;
  }
}

cmd(
  {
    pattern: "play",
    alias: ["song4", "video3", "yt", "yta", "ytv"],
    desc: "Download YouTube audio/video with a stylish UI.",
    category: "download",
    use: ".play <song name>",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
      if (!q) return reply(`✨ *YouTube Downloader* ✨\n\nUsage: \`${prefix + command} <song name/url>\``);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Search Logic
      const searchUrl = normalizeYouTubeUrl(q);
      const searchResults = await yts(searchUrl ? { videoId: searchUrl.split('v=')[1] } : q);
      const video = searchUrl ? searchResults : searchResults.videos[0];

      if (!video) return reply("❌ *Media not found!* Check the name or link.");

      // STYLISH UI TEXT
      let premiumCard = `
┏━━━━━━━  『 **YOUTUBE DOWNLOADER** 』  ━━━━━━┓
┃
┃  ✨ **ᴛɪᴛʟᴇ:** ${video.title}
┃  👤 **ᴄʜᴀɴɴᴇʟ:** ${video.author.name}
┃  ⏱️ **ᴅᴜʀᴀᴛɪᴏɴ:** ${video.timestamp}
┃  👁️ **ᴠɪᴇᴡꜱ:** ${video.views.toLocaleString()}
┃  📅 **ᴜᴘʟᴏᴀᴅᴇᴅ:** ${video.ago}
┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔢 *ʀᴇᴘʟʏ ᴡɪᴛʜ ᴀ ɴᴜᴍʙᴇʀ:*
1️⃣ | **MP4 (Video) 🎥**
2️⃣ | **MP3 (Audio) 🎶**

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ **ᴋᴀᴍʀᴀɴ-ᴍᴅ** 🚀`;

      // Send Search Card
      const sentMsg = await conn.sendMessage(
        from,
        { 
          image: { url: video.thumbnail || video.image }, 
          caption: premiumCard,
          contextInfo: {
            externalAdReply: {
              title: "YT-DOWNLOADER",
              body: video.title,
              mediaType: 1,
              sourceUrl: video.url,
              thumbnailUrl: video.thumbnail || video.image,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

      // --- LISTENER FOR SELECTION ---
      conn.ev.on("messages.upsert", async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        if (!msg.message || !msg.message.extendedTextMessage) return;
        
        const context = msg.message.extendedTextMessage.contextInfo;
        if (context.stanzaId !== sentMsg.key.id) return;

        const selection = msg.message.extendedTextMessage.text.trim();
        if (!["1", "2"].includes(selection)) return;

        await conn.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        
        // Fetch API Data
        const apiData = await fetchMediaData(video.url);
        if (!apiData) return reply("❌ *Server Error:* Could not fetch download links.");

        const isAudio = selection === "2";
        let downloadUrl = isAudio ? apiData.mp3 : apiData.mp4;

        // Custom Audio API override for higher quality (as per previous code request)
        if (isAudio) {
           try {
             const audioApi = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(video.url)}`;
             const audioRes = await axios.get(audioApi);
             if (audioRes.data.status) downloadUrl = audioRes.data.result;
           } catch (e) { console.log("Falling back to standard MP3..."); }
        }

        // Send Media
        await conn.sendMessage(
          from,
          {
            [isAudio ? 'audio' : 'video']: { url: downloadUrl },
            mimetype: isAudio ? 'audio/mpeg' : 'video/mp4',
            fileName: `${video.title}.${isAudio ? 'mp3' : 'mp4'}`,
            caption: isAudio ? undefined : `✅ **${video.title}**\n📥 *Downloaded via KAMRAN-MD*`,
            headerType: 4
          },
          { quoted: msg }
        );

        await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });
      });

    } catch (e) {
      console.error(e);
      reply("❌ *Error:* Processing failed.");
    }
  }
);
