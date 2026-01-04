//---------------------------------------------------------------------------
//           KAMRAN-MD - SONG IDENTIFIER (AHA-MUSIC)
//---------------------------------------------------------------------------
//  🚀 FIND SONG DETAILS BY SEARCHING AUDIO SAMPLES
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

/**
 * Identifies a song using Aha-Music API
 */
async function identifySong(filePath) {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('sample_size', 118784);

    const { data } = await axios.post(
        'https://api.doreso.com/humming',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'origin': 'https://www.aha-music.com',
                'referer': 'https://www.aha-music.com/'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        }
    );
    return data;
}

cmd({
    pattern: "findsong",
    alias: ["whatsong", "shazam", "identify"],
    desc: "Identify song title and artist by replying to audio.",
    category: "tools",
    use: "reply to an audio message",
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    // Check if media is audio or voice note
    if (!/audio/.test(mime)) {
        return reply("🎶 Please reply to an *audio* or *voice note* to identify the song.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

    let tmpPath;
    try {
        // Download audio media
        const media = await q.download();
        if (!media) throw new Error("Could not download audio.");

        // Create temporary file
        tmpPath = join(tmpdir(), `identify_${Date.now()}.mp3`);
        fs.writeFileSync(tmpPath, media);

        // Call API
        const result = await identifySong(tmpPath);

        if (result && result.data && result.data.title) {
            const { title, artists, album, release_date } = result.data;
            
            let caption = `╭──〔 *🎵 SONG IDENTIFIED* 〕  
├─ 📝 *Title:* ${title}
├─ 🎤 *Artist:* ${artists || 'Unknown'}
├─ 💿 *Album:* ${album || 'N/A'}
├─ 📅 *Release:* ${release_date || 'N/A'}
╰───────────────────🚀

*🚀 Powered by KAMRAN-MD*`;

            await conn.sendMessage(from, { 
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: "AHA-MUSIC IDENTIFIER",
                        body: `Detected: ${title}`,
                        thumbnailUrl: "https://files.catbox.moe/ly6553.jpg",
                        sourceUrl: "https://www.aha-music.com",
                        mediaType: 1,
                        showAdAttribution: true
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "❓", key: mek.key } });
            reply("❌ Could not identify the song. The audio might be too short, noisy, or not in the database.");
        }

    } catch (e) {
        console.error("Song Identification Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ An error occurred while identifying the song.");
    } finally {
        // Clean up temp file
        if (tmpPath && fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
        }
    }
});
