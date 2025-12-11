const { cmd } = require('../command');
const fetch = require('node-fetch'); 

// --- API Endpoints ---
const SPOTIFY_API_URL = "https://api.deline.web.id/downloader/spotifyplay?q=";

// Global cache to store the track data for the interactive step
const spotifyCache = new Map();

// Function to search and get Spotify track data
async function spotifyPlay(query) {
    const r = await fetch(SPOTIFY_API_URL + encodeURIComponent(query), { timeout: 20000 });
    const json = await r.json();

    if (!json.status || !json.result) {
        throw new Error('❌ Gaana khojne mein vifal rahe ya data nahi mila.');
    }

    const meta = json.result.metadata;
    return {
        title: meta.title,
        artist: meta.artist,
        duration: meta.duration,
        cover: meta.cover,
        url: meta.url,
        audioUrl: json.result.dlink
    };
}


// --- MAIN COMMAND HANDLER ---
let handler = async (conn, mek, m, { q, reply, prefix, command, from, args }) => {
    try {
        if (!q) return reply(`❌ Kripya gaane ka title dein.\n\n*Udaharan:* ${prefix + command} sparks`);

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        await reply(`🔎 *Spotify* par "${q}" khoja jaa raha hai...`);

        // 1. Fetch Spotify data
        const trackData = await spotifyPlay(q);

        // --- STEP 2: PROMPT FOR FORMAT ---
        const menu = `
🎵 *Spotify Track Found!* 🎵
*Judul:* ${trackData.title}
*Artist:* ${trackData.artist}

*Kripya bhejne ka format chunein:*
1 - MP3 (Audio Message) 🎧
2 - DOCUMENT (MP3 File) 📁

*Kripya 1 ya 2 se reply karein.*
`;
        
        // Store data for the interactive step
        const cacheKey = `${from}-${mek.key.id}`;
        spotifyCache.set(cacheKey, trackData);
        
        // Send the menu message and capture its ID
        const sentMenuMsg = await conn.sendMessage(from, { text: menu }, { quoted: mek });


        // --- STEP 3: LISTEN FOR FORMAT SELECTION ---
        const formatHandler = async (fMsgUpdate) => {
            const fMsg = fMsgUpdate.messages[0];
            if (!fMsg?.message || fMsg.key.remoteJid !== from) return;
            
            const repliedToPrompt = fMsg.message.extendedTextMessage?.contextInfo?.stanzaId === sentMenuMsg.key.id;
            if (!repliedToPrompt) return;

            const selection = fMsg.message.conversation?.trim() || fMsg.message.extendedTextMessage?.text?.trim();
            const cachedData = spotifyCache.get(cacheKey);

            if (cachedData && (selection === '1' || selection === '2')) {
                // Valid selection, remove listener and clean cache
                conn.ev.off("messages.upsert", formatHandler);
                spotifyCache.delete(cacheKey);
                
                const sendAsDocument = selection === '2';
                
                await conn.sendMessage(from, { react: { text: '⬇️', key: fMsg.key } });
                await reply(`⏳ *${cachedData.title}* bheja jaa raha hai (${sendAsDocument ? 'Document' : 'Audio'})...`);

                // Prepare final message
                const mediaKey = sendAsDocument ? 'document' : 'audio';
                const caption = `✅ *${cachedData.title}*\nArtist: ${cachedData.artist}\nFormat: ${sendAsDocument ? 'Document' : 'Audio Message'}`;
                
                // Send the file
                await conn.sendMessage(from, {
                    [mediaKey]: { url: cachedData.audioUrl },
                    mimetype: "audio/mpeg",
                    ptt: mediaKey === 'audio' ? false : undefined, // Standard audio
                    fileName: `${cachedData.title.replace(/[^\w\s]/gi, '')}.mp3`,
                    caption: caption
                }, { quoted: fMsg });

                await conn.sendMessage(from, { react: { text: '✅', key: fMsg.key } });


            } else if (cachedData) {
                // Invalid selection, keep listener on
                await reply("❌ Kripya सिर्फ 1 या 2 से reply करें।");
            }
        };
        
        // Add listener for format selection and set timeout (e.g., 2 minutes)
        conn.ev.on("messages.upsert", formatHandler);
        setTimeout(() => {
            conn.ev.off("messages.upsert", formatHandler);
            if (spotifyCache.has(cacheKey)) {
                reply("⚠️ Samay seema samapt ho gayi. Kripya dobara khojein.");
                spotifyCache.delete(cacheKey);
            }
        }, 120000); // 2 minutes timeout


    } catch (e) {
        console.error("Spotify Plays Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: m.key } });
        reply(`⚠️ Spotify download karte samay truti aayi: ${e.message}`);
    }
};

cmd({
    pattern: "plays",
    alias: ["spotify"],
    desc: "Spotify par gaana khojta aur download karta hai (MP3 ya Document).",
    category: "download",
    react: "🎶",
    filename: __filename
}, handler);

module.exports = handler;
