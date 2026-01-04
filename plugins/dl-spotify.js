//---------------------------------------------------------------------------
//           KAMRAN-MD - SPOTIFY MUSIC DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD SONGS VIA SPOTIFY URL OR SEARCH KEYWORDS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

/**
 * Core Spotify Logic using spotdown.org API
 */
async function fetchSpotify(input) {
    try {
        // Step 1: Get song details
        const { data: s } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(input)}`, {
            headers: {
                origin: 'https://spotdown.org',
                referer: 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            }
        });
        
        const song = s.songs ? s.songs[0] : null;
        if (!song) return null;
        
        // Step 2: Download the audio buffer
        const { data: audioBuffer } = await axios.post('https://spotdown.org/api/download', {
            url: song.url
        }, {
            headers: {
                origin: 'https://spotdown.org',
                referer: 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            },
            responseType: 'arraybuffer'
        });
        
        return {
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            cover: song.thumbnail,
            url: song.url,
            audio: Buffer.from(audioBuffer)
        };
    } catch (error) {
        console.error("Spotify API Error:", error.message);
        return null;
    }
}

// --- COMMAND: SPOTIFY ---

cmd({
    pattern: "spotify",
    alias: ["sp", "song2"],
    desc: "Download Spotify tracks by link or name.",
    category: "download",
    use: ".spotify <song name or link>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`🎵 *Spotify Downloader*\n\nUsage: \`${prefix + command} <song name/url>\`\nExample: \`${prefix + command} stay justin bieber\``);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const result = await fetchSpotify(q);

        if (!result) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ Could not find or download the song. Please try again with a link.");
        }

        // Send confirmation/info message
        const infoMsg = `
🎶 *SPOTIFY DOWNLOAD* 🎶

📌 *Title:* ${result.title}
🎤 *Artist:* ${result.artist}
⏱️ *Duration:* ${result.duration}

_📥 Uploading audio, please wait..._

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, { 
            image: { url: result.cover }, 
            caption: infoMsg 
        }, { quoted: mek });

        // Send Audio File
        await conn.sendMessage(from, {
            audio: result.audio,
            mimetype: "audio/mpeg",
            fileName: `${result.title} - ${result.artist}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: result.title,
                    body: result.artist,
                    thumbnailUrl: result.cover,
                    sourceUrl: result.url,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Spotify Plugin Error:", e);
        reply("❌ An unexpected error occurred.");
    }
});
