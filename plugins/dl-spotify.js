//---------------------------------------------------------------------------
//           KAMRAN-MD - SPOTIFY MUSIC DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 DOWNLOAD SPOTIFY TRACKS WITH CUSTOM CANVAS ARTWORK
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const canvafy = require('canvafy');

/**
 * Converts Duration string (MM:SS) to Milliseconds
 */
function durationToMs(duration) {
    if (!duration) return 0;
    const [min, sec] = duration.split(':').map(Number);
    return (min * 60 + sec) * 1000;
}

cmd({
    pattern: "spotify",
    alias: ["spotifyplay", "sp", "song2"],
    desc: "Download music from Spotify using URL.",
    category: "download",
    use: ".spotify <spotify_link>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`🎵 *Spotify Downloader*\n\nUsage: \`${prefix + command} <spotify track url>\`\nExample: \`${prefix + command} https://open.spotify.com/track/xxx\``);

        // --- Step 1: Fetch Song Details ---
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const { data: s } = await axios.get(`https://spotdown.org/api/song-details?url=${encodeURIComponent(q)}`, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            }
        });

        const song = s.songs ? s.songs[0] : null;
        if (!song) return reply('❌ Error: Track not found! Please check the URL.');

        // --- Step 2: Download Audio Buffer ---
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const { data: audioBuffer } = await axios.post('https://spotdown.org/api/download', {
            url: song.url
        }, {
            headers: {
                'origin': 'https://spotdown.org',
                'referer': 'https://spotdown.org/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
            },
            responseType: 'arraybuffer'
        });

        const ms = durationToMs(song.duration);

        // --- Step 3: Generate Spotify Canvas Image ---
        const spotifycanva = await new canvafy.Spotify()
            .setAuthor(song.artist || "Unknown Artist")
            .setTimestamp(40000, ms || 0) // Fixed progress for visual effect
            .setImage(song.thumbnail || "https://cdn-icons-png.flaticon.com/512/174/174868.png")
            .setTitle(song.title || "Unknown Title")
            .setBlur(5)
            .setOverlayOpacity(0.7)
            .build();

        const caption = `🎶 *SPOTIFY DOWNLOAD* 🎶\n\n📌 *Title:* ${song.title}\n🎤 *Artist:* ${song.artist}\n⏱️ *Duration:* ${song.duration}\n🔗 *Link:* ${song.url}\n\n*🚀 Powered by KAMRAN-MD*`;

        // --- Step 4: Send Results ---
        const sentMsg = await conn.sendMessage(from, {
            image: spotifycanva,
            caption: caption
        }, { quoted: mek });

        await conn.sendMessage(from, {
            audio: Buffer.from(audioBuffer),
            mimetype: "audio/mpeg",
            fileName: `${song.title}.mp3`
        }, { quoted: sentMsg });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error("Spotify Error:", error.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error: Service might be busy or the request limit reached.");
    }
});
