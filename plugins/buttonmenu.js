//---------------------------------------------------------------------------
//           KAMRAN-MD - LYRICS SEARCH (LRCLIB)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// Local cache to store search results per chat
if (!global.lyricCache) global.lyricCache = new Map();

function formatDuration(sec) {
    if (!sec) return 'N/A';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

cmd({
    pattern: "lirik",
    alias: ["lyrics", "songlyric"],
    desc: "Search for song lyrics.",
    category: "music",
    use: ".lirik Yellow - Coldplay",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`Contoh:\n${prefix}lirik Yellow - Coldplay`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const { data } = await axios.get('https://lrclib.net/api/search', {
            params: { q: q }
        });

        if (!Array.isArray(data) || data.length === 0) {
            return reply("❌ Lirik Tidak Ditemukan.");
        }

        const results = data.slice(0, 10);
        global.lyricCache.set(from, results);

        // If only one result, send it immediately
        if (results.length === 1) {
            const song = results[0];
            const { data: lyric } = await axios.get(`https://lrclib.net/api/get/${song.id}`);
            
            let msg = `🎵 *LIRIK DITEMUKAN*\n\n`;
            msg += `• *Judul* : ${lyric.trackName}\n`;
            msg += `• *Artis* : ${lyric.artistName}\n`;
            msg += `• *Album* : ${lyric.albumName || 'N/A'}\n`;
            msg += `• *Durasi* : ${formatDuration(lyric.duration)}\n\n`;
            msg += `──────────────────\n\n`;
            msg += lyric.plainLyrics || lyric.syncedLyrics || '_Lirik tidak tersedia_';
            
            return reply(msg);
        }

        // Multiple results
        let list = `🔍 *Ditemukan ${results.length} hasil*\n\n`;
        results.forEach((v, i) => {
            list += `*${i + 1}.* ${v.trackName} — ${v.artistName}\n`;
        });
        list += `\nKetik: *${prefix}getlirik <nomor>*\nContoh: *${prefix}getlirik 1*`;
        
        return reply(list);

    } catch (e) {
        console.error(e);
        reply(`❌ Kesalahan: ${e.message}`);
    }
});

cmd({
    pattern: "getlirik",
    desc: "Retrieve specific lyrics from previous search.",
    category: "music",
    use: ".getlirik 1",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const cache = global.lyricCache.get(from);
        if (!cache) return reply('❌ Silakan cari lirik dulu dengan command .lirik');

        const idx = parseInt(q);
        if (isNaN(idx) || idx < 1 || idx > cache.length)
            return reply('❌ Nomor list tidak valid!');

        await conn.sendMessage(from, { react: { text: "🎶", key: mek.key } });

        const song = cache[idx - 1];
        const { data: lyric } = await axios.get(`https://lrclib.net/api/get/${song.id}`);

        let msg = `🎶 *LIRIK LAGU*\n\n`;
        msg += `• *Judul* : ${lyric.trackName}\n`;
        msg += `• *Artis* : ${lyric.artistName}\n`;
        msg += `• *Album* : ${lyric.albumName || 'N/A'}\n`;
        msg += `• *Durasi* : ${formatDuration(lyric.duration)}\n\n`;
        msg += `──────────────────\n\n`;
        msg += lyric.plainLyrics || lyric.syncedLyrics || '_Lirik tidak tersedia_';

        return reply(msg);

    } catch (e) {
        console.error(e);
        reply(`❌ Kesalahan: ${e.message}`);
    }
});
