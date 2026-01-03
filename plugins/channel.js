const { cmd } = require('../command');
const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Axios instance with cookie support
const jar = new CookieJar();
const client = wrapper(
    axios.create({
        jar,
        withCredentials: true,
        headers: {
            "user-agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/137 Mobile Safari/537.36",
            accept: "*/*"
        }
    })
);

const BASE = "https://spotmate.online";

// Helper function to get XSRF Token
async function getXsrf() {
    await client.get(`${BASE}/en1`);
    const cookies = await jar.getCookies(BASE);
    const xsrf = cookies.find(c => c.key === "XSRF-TOKEN");
    if (!xsrf) throw new Error("XSRF-TOKEN not found");
    return decodeURIComponent(xsrf.value);
}

// Helper to convert Spotify URL
async function convertSpotify(url) {
    const xsrf = await getXsrf();

    const trackRes = await client.post(
        `${BASE}/getTrackData`,
        { spotify_url: url },
        {
            headers: {
                "content-type": "application/json",
                "x-xsrf-token": xsrf,
                origin: BASE,
                referer: `${BASE}/en1`
            }
        }
    );

    const convertRes = await client.post(
        `${BASE}/convert`,
        { urls: url },
        {
            headers: {
                "content-type": "application/json",
                "x-xsrf-token": xsrf,
                origin: BASE,
                referer: `${BASE}/en1`
            }
        }
    );

    const t = trackRes.data;
    const d = convertRes.data;

    return {
        title: t.name,
        artist: t.artists.map(a => a.name).join(", "),
        thumbnail: t.album.images?.[0]?.url || null,
        download_url: d.url
    };
}

// --- CMD COMMAND ---
cmd({
    pattern: "spotify",
    alias: ["spdl", "song"],
    react: "🎧",
    desc: "Download song from Spotify link.",
    category: "download",
    filename: __filename
},           
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Spotify URL.");
        if (!q.includes("spotify.com")) return reply("❌ Invalid URL! Please provide a valid Spotify link.");

        reply("⏳ Fetching track data, please wait...");

        const result = await convertSpotify(q);

        // Send Details with Thumbnail
        const msg = `🎵 *Spotify Downloader* 🎵\n\n` +
                    `📌 *Title:* ${result.title}\n` +
                    `🎤 *Artist:* ${result.artist}\n\n` +
                    `*Sending audio file...*`;

        await conn.sendMessage(from, { 
            image: { url: result.thumbnail }, 
            caption: msg 
        }, { quoted: mek });

        // Send Audio File
        await conn.sendMessage(from, { 
            audio: { url: result.download_url }, 
            mimetype: 'audio/mpeg',
            fileName: `${result.title}.mp3`
        }, { quoted: mek });

    } catch (e) {
        console.error("Spotify Error:", e);
        reply("❌ Error downloading from Spotify. The link might be invalid or the server is busy.");
    }
});
