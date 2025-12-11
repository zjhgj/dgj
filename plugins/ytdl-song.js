const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// NOTE: This file is a universal downloader that prompts the user for 4 distinct options (Audio/Video x Standard/Document).

const cache = new Map(); // Caching search results

// --- Helper Functions ---

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Function to fetch base data and links (used for fallback and metadata)
async function fetchBaseData(url, retries = 2) {
  const cacheKey = `baseData:${getVideoId(url)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { timeout: 15000 });
    const data = response.data;

    if (data.status === true && data.result) {
      const downloadData = data.result;
      
      const result = {
        download_url_mp4: downloadData.mp4, // Video link
        download_url_mp3: downloadData.mp3, // Audio link (fallback)
        title: downloadData.title || "",
        thumbnail: `https://i.ytimg.com/vi/${getVideoId(url)}/hqdefault.jpg`,
      };
      cache.set(cacheKey, result);
      setTimeout(() => cache.delete(cacheKey), 3600000);
      return result;
    }
    throw new Error("API status failure or result missing.");
  } catch (error) {
    console.error(`Base Data fetch failed: ${error.message}`);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchBaseData(url, retries - 1);
    }
    return null;
  }
}

async function searchYouTube(query, maxResults = 1) {
  try {
    const searchResults = await yts({ query, pages: 1 });
    return searchResults.videos.slice(0, maxResults);
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    return [];
  }
}

// --- MAIN COMMAND ---
cmd(
  {
    pattern: "play3", 
    alias: ["play2", "sania", "song", "audvid"],
    react: "🎧",
    desc: "Download media as Audio/Video or Document.",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Kripya video ka naam ya URL dein aur phir menu se select karein."); 

      await robin.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const url = normalizeYouTubeUrl(q);
      let ytdata;

      if (url) {
        const searchResults = await searchYouTube(url);
        if (!searchResults.length) return reply("❌ Video not found!");
        ytdata = searchResults[0];
      } else {
        const searchResults = await searchYouTube(q);
        if (!searchResults.length) return reply("❌ No videos found matching your query!");
        ytdata = searchResults[0];
      }

      // --- Simplified Menu for User (4 Options) ---
      let desc = `
 👑 *KAMRAN MD DOWNLOADER* 👑

📌 *Title:* ${ytdata.title}
⏱️ *Duration:* ${ytdata.timestamp}

🔢 *Kripya format select karne ke liye number se reply karein:*
1 - MP3 (AUDIO) 🎧
2 - MP4 (VIDEO) 🎥
3 - DOCUMENT (MP3) 📁
4 - DOCUMENT (MP4) 📄
   
> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ ᴍᴅ`; 

      // Send the menu message
      const vv = await robin.sendMessage(
        from,
        { image: { url: ytdata.thumbnail }, caption: desc },
        { quoted: mek }
      );

      await robin.sendMessage(from, { react: { text: "✅", key: mek.key } });

      // --- LISTEN FOR USER'S REPLY ---
      robin.ev.on("messages.upsert", async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        
        // Ensure the message is a reply to the menu we just sent
        if (
          !msg.message || 
          !msg.message.extendedTextMessage || 
          msg.message.extendedTextMessage.contextInfo.stanzaId !== vv.key.id
        ) return;

        const selectedOption = msg.message.extendedTextMessage.text.trim();
        
        try {
            
          const validOptions = ["1", "2", "3", "4"]; 
          if (!validOptions.includes(selectedOption)) {
            await robin.sendMessage(from, { react: { text: "❓", key: msg.key } });
            return reply("Kripya sahi option (1, 2, 3 ya 4) se reply karein."); 
          }

          await robin.sendMessage(from, { react: { text: "⏳", key: msg.key } });

          // Determine parameters based on selection
          const isAudio = selectedOption === "1" || selectedOption === "3";
          const sendAsDocument = selectedOption === "3" || selectedOption === "4";
          
          let downloadUrl;
          let formatText;
          let fileExtension;
          let mimeType;
          let mediaKey;

          const data = await fetchBaseData(ytdata.url);

          if (isAudio) {
              formatText = sendAsDocument ? "MP3 Document" : "MP3 Audio";
              mediaKey = sendAsDocument ? 'document' : 'audio';
              fileExtension = 'mp3';
              mimeType = 'audio/mpeg';
              
              // Use the dedicated /download/audio endpoint for reliability
              const audioApiUrl = `https://jawad-tech.vercel.app/download/audio?url=${encodeURIComponent(ytdata.url)}`;
              try {
                  const audioRes = await axios.get(audioApiUrl, { timeout: 15000 });
                  if (audioRes.data.status === true && audioRes.data.result) {
                      downloadUrl = audioRes.data.result;
                  } else {
                      throw new Error("Dedicated Audio API failed.");
                  }
              } catch (audioApiError) {
                  console.error("Dedicated Audio API Failed. Falling back to /ytdl link:", audioApiError.message);
                  downloadUrl = data?.download_url_mp3; 
              }
          } else {
              // Video (MP4) Logic
              formatText = sendAsDocument ? "MP4 Document" : "MP4 Video";
              mediaKey = sendAsDocument ? 'document' : 'video';
              fileExtension = 'mp4';
              mimeType = 'video/mp4';
              downloadUrl = data?.download_url_mp4;
          }

          if (!data || !downloadUrl) {
            await robin.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ Download link nahi mil paaya! Kripya dobara koshish karein."); 
          }
          
          // Send the final media
          await robin.sendMessage(
            from,
            {
              [mediaKey]: { url: downloadUrl },
              mimetype: mimeType,
              // CRITICAL FIX: Explicitly setting ptt: false for audio to prevent corruption error
              ptt: mediaKey === 'audio' ? false : undefined, 
              fileName: `${ytdata.title}_${formatText}.${fileExtension}`,
              caption: `✅ *${ytdata.title}* Downloaded Successfully!\n*Format:* ${formatText}`,
            },
            { quoted: msg }
          );
          
          // Final success reaction
          await robin.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
          console.error("Download error:", error);
          await robin.sendMessage(from, { react: { text: "❌", key: msg.key } });
          reply(`⚠️ Download karte samay truti aayi: ${error.message}`);
        }
      });
    } catch (e) {
      console.error("Command error:", e);
      await robin.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠️ *Error:* ${e.message || "Anjaan truti hui"}`);
    }
  }
);
    
