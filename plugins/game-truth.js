const { cmd } = require('../command');
const crypto = require('crypto');
const axios = require('axios');
const converter = require('../data/converter');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const yts = require('yt-search');
const fetch = require('node-fetch');

// --- SAVETUBE CLASS ---
class SaveTube {
    constructor() {
        this.ky = "C5D58EF67A7584E4A29F6C35BBC4EB12";
        this.fmt = ["144", "240", "360", "480", "720", "1080", "mp3"];
        this.m = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;
        this.is = axios.create({
            headers: {
                "content-type": "application/json",
                "origin": "https://yt.savetube.me",
                "user-agent": "Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0"
            }
        });
    }

    async decrypt(enc) {
        const sr = Buffer.from(enc, "base64");
        const ky = Buffer.from(this.ky, "hex");
        const iv = sr.slice(0, 16);
        const dt = sr.slice(16);
        const dc = crypto.createDecipheriv("aes-128-cbc", ky, iv);
        const res = Buffer.concat([dc.update(dt), dc.final()]);
        return JSON.parse(res.toString());
    }

    async getCdn() {
        const res = await this.is.get("https://media.savetube.vip/api/random-cdn");
        return res.data ? { status: true, data: res.data.cdn } : { status: false };
    }

    async download(url, format = "mp3") {
        const id = url.match(this.m)?.[3];
        if (!id) return { status: false, msg: "ID not found" };
        const cdn = await this.getCdn();
        if (!cdn.status) return cdn;
        const info = await this.is.post(`https://${cdn.data}/v2/info`, { url: `https://www.youtube.com/watch?v=${id}` });
        const dec = await this.decrypt(info.data.data);
        const dl = await this.is.post(`https://${cdn.data}/download`, {
            id,
            downloadType: format === "mp3" ? "audio" : "video",
            quality: format === "mp3" ? "128" : format,
            key: dec.key
        });
        return {
            status: true,
            title: dec.title,
            thumb: dec.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            duration: dec.duration,
            dl: dl.data.data.downloadUrl
        };
    }
}

const ytdl = new SaveTube();

cmd({
    pattern: "playch",
    alias: ["ptt"],
    desc: "Search and send audio as PTT to a specific JID/Channel.",
    category: "owner",
    filename: __filename
},           
async (conn, mek, m, { q, reply, isOwner, prefix }) => {
    if (!isOwner) return reply("❌ Only Owner can use this command.");
    if (!q || !q.includes("|")) return reply(`*Format:* ${prefix}playch JID | Song Name\n*Example:* ${prefix}playch 120363xxx@g.us | daku`);

    const [jidInput, query] = q.split("|").map(v => v.trim());
    const targetJid = conn.decodeJid(jidInput); // --- LID FIX ---

    try {
        await reply("🎧 *Searching & Converting...*");

        const search = await yts(query);
        const video = search.videos.find(v => v.seconds && !v.live);
        if (!video) return reply("❌ Video not found!");

        // Download Thumbnail
        let thumbnailBuffer;
        try {
            const thumbRes = await fetch(video.thumbnail);
            thumbnailBuffer = Buffer.from(await thumbRes.arrayBuffer());
        } catch {
            thumbnailBuffer = Buffer.alloc(0);
        }

        // Download Audio
        const dlInfo = await ytdl.download(video.url, "mp3");
        if (!dlInfo.status) throw new Error(dlInfo.msg || "Download failed");

        const mp3Res = await fetch(dlInfo.dl);
        const mp3Buffer = Buffer.from(await mp3Res.arrayBuffer());

        // File Paths
        const inputPath = path.join(__dirname, `temp_${Date.now()}.mp3`);
        const outputPath = path.join(__dirname, `temp_${Date.now()}.ogg`);

        fs.writeFileSync(inputPath, mp3Buffer);

        // Convert to OGG/OPUS via FFmpeg
        await new Promise((resolve, reject) => {
            exec(`ffmpeg -y -i "${inputPath}" -ac 1 -ar 48000 -b:a 48k -c:a libopus "${outputPath}"`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        const oggBuffer = fs.readFileSync(outputPath);

        // Send Voice Note (PTT)
        await conn.sendMessage(targetJid, {
            audio: oggBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
            contextInfo: {
                externalAdReply: {
                    title: video.title,
                    body: `Duration: ${video.timestamp}`,
                    mediaType: 2,
                    thumbnail: thumbnailBuffer,
                    mediaUrl: video.url,
                    sourceUrl: video.url,
                    renderLargerThumbnail: true
                }
            }
        });

        reply(`✅ *PTT Sent successfully to:* ${targetJid}`);

        // Cleanup
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    } catch (e) {
        console.error("PlayCh Error:", e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
