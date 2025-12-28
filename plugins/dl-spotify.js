//---------------------------------------------------------------------------
//           KAMRAN-MD - SPOTIFY MUSIC DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 SEARCH & DOWNLOAD FROM SPOTIFY (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

/**
 * Spotify Search Function
 */
async function spotifysearch(query) {
    try {
        const html = await axios.get('https://spotify.downloaderize.com');
        const security = html.data.match(/var\s+sts_ajax\s*=\s*\{[^}]*"nonce":"([^"]+)"/i)?.[1];

        if (!security) throw 'Search nonce not found';

        const r = await axios.get('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', {
            params: { action: 'sts_search_spotify', query, security },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'x-requested-with': 'XMLHttpRequest',
                referer: 'https://spotify.downloaderize.com/'
            }
        });

        const items = r.data?.data?.tracks?.items || [];
        return items.map(v => ({
            title: v.name,
            artist: v.artists.map(a => a.name).join(', '),
            thumbnail: v.album.images?.[0]?.url || null,
            url: `https://open.spotify.com/track/${v.id}`
        }));
    } catch (e) {
        console.error("Search Error:", e);
        return [];
    }
}

/**
 * Spotify Download Function
 */
async function spotifydl(url) {
    try {
        const html = await axios.get('https://spotify.downloaderize.com');
        const nonce = html.data.match(/var\s+spotifyDownloader\s*=\s*\{[^}]*"nonce":"([^"]+)"/i)?.[1];

        if (!nonce) throw 'Download nonce not found';

        const r = await axios.post(
            'https://spotify.downloaderize.com/wp-admin/admin-ajax.php',
            new URLSearchParams({ action: 'spotify_downloader_get_info', url, nonce }).toString(),
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-requested-with': 'XMLHttpRequest',
                    origin: 'https://spotify.downloaderize.com',
                    referer: 'https://spotify.downloaderize.com/'
                }
            }
        );

        const d = r.data?.data;
        if (!d) return null;
        
        return {
            title: d.title,
            artist: d.author,
            thumbnail: d.thumbnail,
            audio: d.medias?.[0]?.url
        };
    } catch (e) {
        console.error("DL Error:", e);
        return null;
    }
}

// --- COMMAND: SPOTIFY ---

cmd({
    pattern: "spotify",
    alias: ["sp", "song2"],
    desc: "Search and download songs from Spotify.",
    category: "download",
    react: "🎧",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("🎧 *Spotify Downloader*\n\nUsage: `.spotify <song name>`\nExample: `.spotify Night Changes` ");

    try {
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search for the song
        const search = await spotifysearch(text);
        if (!search.length) return reply("❌ Song not found on Spotify.");

        const song = search[0];
        
        // 2. Fetch download details
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const dl = await spotifydl(song.url);
        
        if (!dl || !dl.audio) return reply("❌ Audio not available for this song.");

        // 3. Send Audio with Professional Player UI
        await conn.sendMessage(from, {
            audio: { url: dl.audio },
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                ...newsletterContext,
                externalAdReply: {
                    title: dl.title,
                    body: `Artist: ${dl.artist}`,
                    thumbnailUrl: dl.thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    sourceUrl: song.url,
                    showAdAttribution: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ An error occurred while downloading from Spotify.");
    }
});
