const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// --- Helper Functions ---

function normalizeYouTubeUrl(url) {
const match = url.match(/(?:youtu.be\/|youtube.com\/shorts\/|youtube.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
Fetch Audio Link (Koyeb API)
*/
async function fetchAudioData(url) {
try {
const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/song?search=${encodeURIComponent(url)}`;
const { data } = await axios.get(apiUrl);
return data.status && data.data ? data.data.url : null;
} catch (e) { return null; }
}

// --- MAIN AUDIO COMMAND ---

cmd(
{
pattern: "dl",
alias: ["play", "audio"],
react: "🎧",
desc: "Download YouTube Audio (MP3).",
category: "download",
filename: __filename,
},
async (conn, mek, m, { from, q, reply, prefix }) => {
try {

if (!q) return reply(`❓ *Usage:* \`${prefix}dl <song name / link>\``);

await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

// Step 1: Search Video
let ytdata;
const url = normalizeYouTubeUrl(q);

if (url) {
const results = await yts({ videoId: url.split('v=')[1] });
ytdata = results;
} else {
const search = await yts(q);
if (!search.videos.length) return reply("❌ *No results found!*");
ytdata = search.videos[0];
}

// Stylish Caption
const caption = `
╔═══════〔 🎵 𝚈𝚃  𝙰𝚄𝙳𝙸𝙾  𝙳𝙻 〕═══════╗

🎼 *Title:* ${ytdata.title}
⏱️ *Duration:* ${ytdata.timestamp}
👀 *Views:* ${ytdata.views.toLocaleString()}
🔗 *URL:* ${ytdata.url}

╚══════════════════════════╝
⏳ *Please wait… Preparing high quality MP3*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ KAMRAN-MD
`;

await conn.sendMessage(
from,
{ image: { url: ytdata.thumbnail || ytdata.image }, caption },
{ quoted: mek }
);

// Step 2: Fetch & Send Audio
const audioUrl = await fetchAudioData(ytdata.url);
if (!audioUrl) return reply("❌ *Audio download failed!*");

await conn.sendMessage(
from,
{
audio: { url: audioUrl },
mimetype: "audio/mpeg",
ptt: false
},
{ quoted: mek }
);

await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

} catch (e) {
console.error(e);
reply("⚠️ *Error occurred while processing!*");
}
}
);
