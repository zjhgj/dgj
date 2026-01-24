const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "xv",
    alias: ["xvideo", "xvdl"],
    react: "🔞",
    desc: "Search and Download Videos via Nekolabs API",
    category: "download",
    use: ".xv <query>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        // Input validation
        if (!q) return reply("❌ Please provide a search query!");
        if (q.length > 150) return reply("❌ Search query is too long!");

        // Loading reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Step 1: Search for Video
        const searchQuery = encodeURIComponent(q.trim());
        const searchResponse = await fetch(`https://api.nekolabs.web.id/discovery/xvideos/search?q=${searchQuery}`);
        const searchData = await searchResponse.json();

        if (!searchData.success || !searchData.result || searchData.result.length === 0) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`❌ No results found for "${q}".`);
        }

        const firstVideo = searchData.result[0];
        const videoPageUrl = firstVideo.url;
        const videoTitle = firstVideo.title || "Video Clip";
        const duration = firstVideo.duration || "??";

        // Step 2: Get Download Link
        const encodedVideoUrl = encodeURIComponent(videoPageUrl);
        const downloadResponse = await fetch(`https://api.nekolabs.web.id/downloader/xvideos?url=${encodedVideoUrl}`);
        const downloadData = await downloadResponse.json();

        if (!downloadData.success || !downloadData.result || !downloadData.result.videos) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ Found the video but couldn't fetch download links.");
        }

        // Selecting high quality if available, otherwise low
        let videoDownloadUrl = downloadData.result.videos.high || downloadData.result.videos.low;
        
        if (!videoDownloadUrl) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ No MP4 link found for this video.");
        }

        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

        // Step 3: Send Video
        await conn.sendMessage(from, {
            video: { url: videoDownloadUrl },
            mimetype: "video/mp4",
            fileName: `${videoTitle}.mp4`,
            caption: `🎥 *XV DOWNLOADER*\n\n📌 *Title:* ${videoTitle}\n⏱ *Duration:* ${duration}\n\n> © KAMRAN-MD ❤️`,
            contextInfo: {
                externalAdReply: {
                    title: videoTitle,
                    body: "KAMRAN-MD Download Service",
                    thumbnailUrl: downloadData.result.thumb || firstVideo.cover,
                    sourceUrl: videoPageUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                },
            },
        }, { quoted: mek });

    } catch (error) {
        console.error("XV Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply("❌ An error occurred while processing the request.");
    }
});
      
