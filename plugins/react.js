const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "shazam",
    alias: ["findsong", "musicsearch"],
    react: "🔍",
    desc: "Search for song details using Shazam API.",
    category: "search",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name (e.g., .shazam Mockingbird)");

        reply(`⏳ Searching for *"${q}"* on Shazam...`);

        // Shazam API URL (Note: ID is usually 'us' or 'pk' based on region)
        const region = "pk"; 
        const apiUrl = `https://www.shazam.com/services/amapi/v1/catalog/${region}/search?types=songs&term=${encodeURIComponent(q)}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        // چیک کریں کہ کیا ڈیٹا ملا ہے
        const songs = response.data?.results?.songs?.data;

        if (!songs || songs.length === 0) {
            return reply("❌ No results found for this song.");
        }

        // پہلے رزلٹ کی تفصیلات نکالیں
        const song = songs[0].attributes;
        const songTitle = song.name;
        const artistName = song.artistName;
        const albumName = song.albumName || "N/A";
        const releaseDate = song.releaseDate || "Unknown";
        const genres = song.genreNames.join(", ");
        
        // ہائی کوالٹی امیج کے لیے URL کو تبدیل کریں
        const artworkUrl = song.artwork.url
            .replace('{w}', '600')
            .replace('{h}', '600');

        let msg = `🎵 *SHAZAM MUSIC SEARCH* 🎵\n\n` +
                  `📌 *Title:* ${songTitle}\n` +
                  `🎤 *Artist:* ${artistName}\n` +
                  `💿 *Album:* ${albumName}\n` +
                  `📅 *Released:* ${releaseDate}\n` +
                  `🎭 *Genre:* ${genres}\n\n` +
                  `🔗 *Listen:* ${song.url}\n\n` +
                  `_Powered by Shazam_`;

        // تصویر اور تفصیلات بھیجیں (LID Safe)
        await conn.sendMessage(from, { 
            image: { url: artworkUrl }, 
            caption: msg 
        }, { quoted: mek });

    } catch (e) {
        console.error("Shazam Error:", e);
        reply("❌ Error: Could not connect to Shazam servers.");
    }
});
