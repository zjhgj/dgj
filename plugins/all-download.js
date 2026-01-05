const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper function for Pinterest via SavePin
 */
async function pindl(url) {
    try {
        const endpoint = `https://www.savepin.app/pinterest/download.php?url=${encodeURIComponent(url)}&lang=en&type=redirect`;

        const { data } = await axios.get(endpoint, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                "Referer": "https://www.savepin.app/pinterest/en"
            }
        });

        const $ = cheerio.load(data);
        const results = new Set();

        $("a[href], img[src]").each((_, e) => {
            let u = $(e).attr("href") || $(e).attr("src");
            if (!u) return;

            // Handle forced download redirects
            if (u.startsWith("force-save.php")) {
                const parsedUrl = new URL("https://www.savepin.app/" + u).searchParams.get("url");
                if (parsedUrl) results.add(decodeURIComponent(parsedUrl));
            }

            // Direct Pinimg or Pin-video links
            if (u.includes("i.pinimg.com") || u.includes("v.pinimg.com") || u.includes("video-downloads")) {
                results.add(u);
            }
        });

        const dataArray = [...results];
        
        return dataArray.length > 0 
            ? { status: true, code: 200, data: dataArray }
            : { status: false, statusCode: 404, message: "No media found" };

    } catch (err) {
        return { status: false, statusCode: 500, message: err.message };
    }
}

// WhatsApp Command Registration
cmd({
    pattern: "pinterest2",
    alias: ["pindl2", "pin"],
    desc: "Download media from Pinterest.",
    category: "download",
    use: ".pinterest <url>",
    filename: __filename,
}, async (conn, mek, m, { from, args, reply, prefix, command }) => {
    try {
        if (!args[0]) return reply(`⚠️ Please provide a Pinterest URL.\n\nExample: \`${prefix + command} https://pin.it/...\``);

        const url = args[0];
        if (!/pinterest\.com|pin\.it/.test(url)) return reply("❌ Invalid Pinterest URL.");

        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const res = await pindl(url);

        if (!res.status) {
            return reply(`❌ Error: ${res.message || "Failed to fetch media."}`);
        }

        // Identify the best quality link (usually first high-res image or video)
        const mediaUrl = res.data[0];
        const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes("v.pinimg.com");

        if (isVideo) {
            await conn.sendMessage(from, {
                video: { url: mediaUrl },
                caption: `✅ *Pinterest Video Downloaded*\n\n*🚀 KAMRAN-MD*`,
                quoted: mek
            });
        } else {
            await conn.sendMessage(from, {
                image: { url: mediaUrl },
                caption: `✅ *Pinterest Image Downloaded*\n\n*🚀 KAMRAN-MD*`,
                quoted: mek
            });
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply(`❌ *An error occurred:* ${e.message}`);
    }
});
