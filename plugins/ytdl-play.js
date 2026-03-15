const { cmd } = require('../command');
const yts = require("yt-search");
const { ytmp3 } = require("yt-downld");

// Configuration
const key = "kyzo_e16fdb825ad20547";
const apiurl = "https://kyzorohan.web.id";

// --- Helper Functions ---
function fetchBuffer(url) {
    return new Promise((resolve, reject) => {
        const proto = url.startsWith("https") ? https : http;
        proto.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchBuffer(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on("data", (c) => chunks.push(c));
            res.on("end", () => resolve(Buffer.concat(chunks)));
            res.on("error", reject);
        }).on("error", reject);
    });
}

async function fetchLyrics(title) {
    try {
        const q = encodeURIComponent(title);
        const buf = await fetchBuffer(`${apiurl}/api/lyrics?key=${key}&judul=${q}`);
        const res = JSON.parse(buf.toString());
        if (!res.status || !res.data?.length) return null;
        const entry = res.data.find(d => !d.instrumental) ?? res.data[0];
        return entry.lyrics ?? null;
    } catch { return null; }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

async function generateYTCard({ thumbnailUrl, title, duration, channelName, views, uploadDate = "baru saja" }) {
    const W = 720, H = 200, THUMB_W = 240, THUMB_H = 135, PAD = 16;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, W, H);

    try {
        const buf = await fetchBuffer(thumbnailUrl);
        const img = await loadImage(buf);
        ctx.save();
        roundRect(ctx, PAD, PAD, THUMB_W, THUMB_H, 8);
        ctx.clip();
        ctx.drawImage(img, PAD, PAD, THUMB_W, THUMB_H);
        ctx.restore();
    } catch {
        ctx.fillStyle = "#3a3a3a";
        roundRect(ctx, PAD, PAD, THUMB_W, THUMB_H, 8);
        ctx.fill();
    }

    // Text & Info logic... (keeping your styling)
    ctx.font = "bold 15px Arial"; ctx.fillStyle = "#f1f1f1";
    ctx.fillText(title.slice(0, 45) + (title.length > 45 ? "..." : ""), THUMB_W + 40, PAD + 20);
    ctx.font = "13px Arial"; ctx.fillStyle = "#aaa";
    ctx.fillText(`${channelName} • ${views} views`, THUMB_W + 40, PAD + 50);
    
    return canvas.toBuffer("image/png");
}

// --- Bot Command ---
cmd({
    pattern: "play",
    alias: ["song"],
    desc: "Advanced Play with Lyrics and Card",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Masukkan judul lagu!");

        await conn.sendMessage(from, { react: { text: "🔎", key: m.key } });
        const search = await yts(q);
        const video = search.videos[0];
        if (!video) return reply("❌ Video tidak ditemukan");

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const [data, cardBuffer, lyrics] = await Promise.all([
            ytmp3(video.url),
            generateYTCard({
                thumbnailUrl: video.thumbnail,
                title: video.title,
                duration: video.timestamp,
                channelName: video.author?.name ?? "Unknown",
                views: video.views.toLocaleString(),
                uploadDate: video.ago
            }),
            fetchLyrics(video.title),
        ]);

        if (!data?.download) throw new Error("Link download tidak tersedia");

        const caption = lyrics ? `🎶 *Lyrics Found:*\n\n${lyrics.slice(0, 1000)}...` : `✅ *Downloaded:* ${video.title}\n\n> © KAMRAN-MD`;

        // Send Card Image
        await conn.sendMessage(from, { image: cardBuffer, caption }, { quoted: m });

        // Send Audio
        await conn.sendMessage(from, { 
            audio: { url: data.download }, 
            mimetype: "audio/mpeg",
            fileName: `${video.title}.mp3`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
