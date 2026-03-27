const { cmd } = require("../command");
const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const converter = require('../data/converter'); // Aapka converter path

const commands = ["mp3url", "ytmp3", "audio"];

commands.forEach(command => {
    cmd({
        pattern: command,
        desc: "Download YouTube audio as PTT/Voice Note",
        category: "downloader",
        react: "🎵",
        filename: __filename
    }, async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply("❌ Please provide a YouTube link or Song Name.\nExample: .audio Brown Munde")

            await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } })

            let videoUrl = q;
            let searchResult;

            // Step 1: Link ya Search detect karein
            const isUrl = q.match(/(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/[^\s]+/);

            if (!isUrl) {
                const search = await yts(q);
                searchResult = search.videos[0];
                if (!searchResult) return reply("❌ No results found.");
                videoUrl = searchResult.url;
            } else {
                videoUrl = isUrl[0];
                const search = await yts(videoUrl).catch(() => null);
                searchResult = search?.videos?.[0];
            }

            // Step 2: API se download link lein
            const cleanUrl = videoUrl.split("&")[0].replace("https://youtu.be/", "https://www.youtube.com/watch?v=");
            const apiRes = await axios.get(`https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(cleanUrl)}`);
            const result = apiRes.data?.result;

            if (!result || !result.mp3) {
                await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
                return reply("❌ Failed to fetch audio.");
            }

            // Step 3: Audio file ko temporary save karein (Buffer banane ke liye)
            const audioFileName = `${Date.now()}.mp3`;
            const audioPath = path.join(__dirname, audioFileName);
            
            const response = await axios({
                method: 'get',
                url: result.mp3,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(audioPath);
            response.data.pipe(writer);

            writer.on('finish', async () => {
                try {
                    // Check if file exists
                    if (!fs.existsSync(audioPath)) return;

                    // Aapka provided logic
                    const buffer = fs.readFileSync(audioPath);
                    const ext = audioFileName.split('.').pop();
                    
                    // Convert to PTT (Voice Note)
                    const ptt = await converter.toPTT(buffer, ext);

                    // Pehle Info bhejien
                    await conn.sendMessage(from, {
                        image: { url: searchResult?.thumbnail || result.thumbnail },
                        caption: `🚀 *KAMRAN-MD: Processing MP3...*\n\n🎵 *Title:* ${result.title}\n\n> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ ⚡*`
                    }, { quoted: mek });

                    // PTT Voice Note Send karein
                    await conn.sendMessage(from, {
                        audio: ptt,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: false
                    }, { quoted: mek });

                    // Cleanup: File delete karein taake storage full na ho
                    fs.unlinkSync(audioPath);
                    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

                } catch (err) {
                    console.error("Conversion Error:", err);
                    reply("❌ Conversion failed.");
                }
            });

            writer.on('error', (err) => {
                console.error("Download Error:", err);
                reply("❌ Download failed.");
            });

        } catch (e) {
            console.error("Global Error:", e.message);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply("❌ Error occurred.");
        }
    });
});
