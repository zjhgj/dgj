//---------------------------------------------------------------------------
//           KAMRAN-MD - PURE YOUTUBE AUTO-DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 NO COMMANDS - JUST PASTE A LINK AND GET THE VIDEO AUTOMATICALLY
//---------------------------------------------------------------------------

const { cmd } = require("../command");
const axios = require("axios");

/**
 * Core Data Fetching Logic using Jawad-Tech API
 */
async function fetchDownloadData(url, retries = 2) {
  try {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { timeout: 20000 });
    const data = response.data;

    if (data.status === true && data.result) {
      return {
        video_url: data.result.mp4,
        title: data.result.title || "YouTube Video",
      };
    }
    throw new Error("API error");
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchDownloadData(url, retries - 1);
    }
    return null;
  }
}

// --- AUTO-DL LISTENER: Pure Background Task ---

cmd({
    on: "body"
}, async (conn, mek, m, { from, body }) => {
    // Regex to detect YouTube URLs (Standard, Mobile, and Shorts)
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;
    const match = body.match(ytRegex);

    if (match) {
        const videoUrl = match[0];

        // Step 1: Initial reaction to show link detection
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        // Step 2: Fetch the data
        const dlData = await fetchDownloadData(videoUrl);

        if (dlData && dlData.video_url) {
            // Step 3: Send the video file
            await conn.sendMessage(from, {
                video: { url: dlData.video_url },
                mimetype: "video/mp4",
                caption: `🎬 *YouTube Auto-DL*\n📌 *Title:* ${dlData.title}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: 'KAMRAN-MD',
                        serverMessageId: 143
                    },
                    externalAdReply: {
                        title: "AUTO VIDEO DOWNLOADER",
                        body: dlData.title,
                        mediaType: 2,
                        sourceUrl: videoUrl,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: mek });
            
            // Step 4: Final success reaction
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            // Reaction for failure
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
    }
});
