/**
@credit RijalGanzz (Original Logic)
@KAMRAN Md (Bot Integration)
**/

const axios = require("axios");
const { cmd } = require("../command");

// --- API Endpoints ---
const PRIMARY_SPOTIFY_API = "https://api.deline.web.id/downloader/spotifyplay?q=";
const FALLBACK_SPOTIFY_API = "https://api.ryzendesu.vip/api/downloader/spotify?query="; // Using a public fallback API
const CANVAS_IMAGE_API = "https://anabot.my.id/api/maker/spotify?apikey=freeApikey";

// Function to search and get Spotify track data with fallback
async function spotifyPlay(query) {
    // --- Attempt 1: Primary API ---
    try {
        const { data } = await axios.get(
            `${PRIMARY_SPOTIFY_API}${encodeURIComponent(query)}`,
            { timeout: 15000 }
        );
        
        if (data?.status && data?.result && data.result.dlink) {
            const metadata = data.result.metadata;
            return {
                title: metadata.title,
                artist: metadata.artist,
                duration: metadata.duration,
                cover: metadata.cover,
                url: metadata.url,
                audioUrl: data.result.dlink
            };
        }
        throw new Error('Primary API failed or returned incomplete link.');
    } catch (e) {
        console.warn(`Primary Spotify API failed: ${e.message}. Trying fallback.`);
    }

    // --- Attempt 2: Fallback API ---
    try {
        const { data } = await axios.get(
            `${FALLBACK_SPOTIFY_API}${encodeURIComponent(query)}`,
            { timeout: 15000 }
        );

        // Assuming fallback API returns direct fields
        if (data?.status === true && data.result?.url) {
            const result = data.result;
            return {
                title: result.title,
                artist: result.artist || 'Unknown',
                duration: 'N/A', // Duration might be unavailable in fallback
                cover: result.thumb || 'https://placehold.co/500x500/000/FFF?text=Spotify',
                url: result.url,
                audioUrl: result.download_link || result.url // Use the main link as audio URL
            };
        }
        throw new Error('Fallback API failed.');

    } catch (e) {
        console.error(`Fallback Spotify API error: ${e.message}`);
        throw new Error('❌ Maaf, gaana khojne ya download link prapt karne mein vifal rahe (Dono APIs fail).');
    }
}

cmd({
  pattern: "spotifyplay",
  alias: ["spplay", "splay", "spotify"],
  desc: "Spotify se gaana khojta aur download karta hai (API fallback ke saath).", // Searches and downloads song from Spotify with API fallback.
  category: "download",
  react: "🎶",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
  if (!q) {
    return reply(`❌ Kripya gaane ka title ya artist dein!\n\n*Udaharan:*\n${prefix + command} my city`);
  }

  await reply("🔎 *Spotify* par gaana khoja ja raha hai...");

  try {
    const track = await spotifyPlay(q);
    
    // 1. Generate the custom canvas image URL (for aesthetic display)
    const canvasUrl = `${CANVAS_IMAGE_API}&author=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}&image=${encodeURIComponent(track.cover)}`;

    // 2. Prepare the caption
    const caption = `
🎵 *Spotify Play* 🎵
-----------------------------------
∘ *Title:* ${track.title}
∘ *Artist:* ${track.artist}
∘ *Duration:* ${track.duration}
∘ *Link:* ${track.url}

_✅ Audio file bheji ja rahi hai..._
`;
    
    // 3. Send the image/cover with details
    await conn.sendMessage(from, {
      image: { url: canvasUrl },
      caption
    }, { quoted: mek }).catch(() => conn.reply(from, caption, mek)); // Fallback to text if image fails

    // 4. Send the audio file
    await conn.sendMessage(from, {
      audio: { url: track.audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${track.title.replace(/[^\w\s]/gi, '')}.mp3`,
      caption: `*${track.title}* downloaded successfully!`
    }, { quoted: mek }).catch(() => {
      // Audio sending failed, notify user for manual download
      conn.reply(from, `⚠️ Audio bhejte samay truti aayi. Aap manual download yahan se kar sakte hain:\n${track.audioUrl}`, mek);
    });
    
    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (e) {
    console.error("Spotify Play Error:", e);
    
    return conn.reply(
      from,
      `❌ *Spotify Download mein truti*\n\n${e.message || 'Anjaan galti hui.'}\n\n_Kripya doosra title try karein._`,
      mek
    );
  }
});
      
