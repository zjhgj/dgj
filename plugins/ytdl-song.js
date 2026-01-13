//---------------------------------------------------------------------------
//           KAMRAN-MD - YOUTUBE AUDIO DOWNLOADER (AUTO-DL)
//---------------------------------------------------------------------------
//  🚀 SEARCH AND DOWNLOAD MP3 MUSIC AUTOMATICALLY
//---------------------------------------------------------------------------

const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

/**
 * Normalizes YouTube URLs to a standard format
 */
function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
 * Core Audio Data Fetching Logic using Jawad-Tech API
 */
async function fetchAudioData(url, retries = 2) {
  try {
    // We prioritize the dedicated audio endpoint for better MP3 conversion
    const audioApiUrl = `https://drkamran-api.vercel.app/api/downloader/ytmp3?url=${encodeURIComponent(url)}`;
    const response = await axios.get(audioApiUrl, { timeout: 20000 });
    const data = response.data;

    if (data.status === true && data.result) {
      return {
        audio_url: data.result,
        title: "YouTube Audio"
      };
    }
    
    // Fallback to general YTDL if dedicated audio fails
    const fallbackUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const fbRes = await axios.get(fallbackUrl);
    if (fbRes.data.status && fbRes.data.result.mp3) {
        return {
            audio_url: fbRes.data.result.mp3,
            title: fbRes.data.result.title
        };
    }

    throw new Error("API failed to return audio link.");
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchAudioData(url, retries - 1);
    }
    return null;
  }
}

// --- MAIN COMMAND: SONG ---

cmd(
  {
    pattern: "song",
    alias: ["play2", "music", "yta", "ytmp3"],
    react: "🎶",
    desc: "Search and download MP3 audio from YouTube.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
      if (!q) return reply(`🎶 *Audio Downloader*\n\nUsage: \`${prefix + command} <song name or link>\`\nExample: \`${prefix + command} faded alan walker\``);

      await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      // Step 1: Search for the video/audio
      const url = normalizeYouTubeUrl(q);
      let ytdata;

      if (url) {
        const searchResults = await yts({ videoId: q.split('v=')[1]?.split('&')[0] || q.split('/').pop() });
        ytdata = searchResults;
      } else {
        const searchResults = await yts(q);
        if (!searchResults.videos.length) return reply("❌ Song not found!");
        ytdata = searchResults.videos[0];
      }

      // Step 2: Send info message
      const infoText = `
🎵 *YT AUDIO DOWNLOADER* 🎵

📌 *Title:* ${ytdata.title}
🎤 *Artist:* ${ytdata.author?.name || 'Unknown'}
⏱️ *Duration:* ${ytdata.timestamp}

_📥 Processing your MP3 file, please wait..._

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`;

      await conn.sendMessage(from, { image: { url: ytdata.thumbnail || ytdata.image }, caption: infoText }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      // Step 3: Fetch download link from API
      const dlData = await fetchAudioData(ytdata.url);

      if (!dlData || !dlData.audio_url) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("❌ Audio link could not be generated. Please try again later.");
      }

      // Step 4: Send the Audio file
      await conn.sendMessage(
        from,
        {
          audio: { url: dlData.audio_url },
          mimetype: "audio/mpeg",
          ptt: false, // Send as a music file, not a voice note
          fileName: `${ytdata.title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: "YT MP3 DOWNLOADER",
              body: ytdata.title,
              thumbnailUrl: ytdata.thumbnail || ytdata.image,
              sourceUrl: ytdata.url,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        },
        { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
      console.error("Audio DL Error:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Something went wrong."}`);
    }
  }
);
