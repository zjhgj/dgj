const axios = require("axios");
const FormData = require("form-data");
// Assuming the command infrastructure utility is available at this path
const { cmd } = require("../command"); 

cmd({
  pattern: "tiktok2",
  alias: ["tiktoks", "tiks2", "tiktoksearch2", "tiktokdl2"],
  desc: "Download a TikTok video from a link or search for videos using a keyword (uses TikWM).",
  react: '🎶',
  category: 'download',
  limit: true,
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  // Check if input is provided
  if (!args[0]) {
    await store.react('❌');
    return reply("🌸 Please provide a TikTok link or a keyword for search.\n\n*Example (Link):*\n.tiktok https://vm.tiktok.com/ZM.../\n*Example (Search):*\n.tiktok cute dogs");
  }

  const input = args.join(" ");
  await store.react('⏳');
  
  try {
    // --- URL Validation/Detection Logic ---
    let isUrl = false;
    
    // Check if the input looks like a valid TikTok URL
    if (/(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(input)) {
      isUrl = true;
    }

    if (isUrl) {
      // --- Mode A: Download by URL (TikWM) ---
      reply(`📥 Downloading TikTok video from link: *${input}*`);
      
      const form = new FormData();
      form.append("url", input);
      form.append("web", 1);
      form.append("hd", 2); // Request HD quality

      const { data: response } = await axios.post("https://tikwm.com/api/", form, {
          headers: form.getHeaders(),
          timeout: 30000 // 30 seconds for API call
      });

      const video = response?.data;

      if (!video || !video.play) {
          await store.react('❌');
          return reply("❌ Failed to retrieve video data from the link. Please check the URL or the video might be private.");
      }
      
      // Prioritize HD if available, otherwise fallback to standard play
      const videoUrl = video.hdplay ? "https://tikwm.com" + video.hdplay : "https://tikwm.com" + video.play;
      const quality = video.hdplay ? 'HD' : 'Standard';

      const message = `✅ *TikTok Video Download Successful*\n\n`
          + `*• Title*: ${video.title || 'Unknown'}\n`
          + `*• Author*: ${video.author?.nickname || 'Unknown'}\n`
          + `*• Quality*: ${quality}\n`
          + `*• URL*: ${input}\n\n`;

      // Send the video without watermark
      await conn.sendMessage(from, {
          video: { url: videoUrl }, 
          caption: message
      }, { quoted: m });
      
      await store.react('✅');

    } else {
      // --- Mode B: Search by Keyword (TikWM Search) ---
      reply(`🔎 Searching TikTok for keyword: *${input}*`);

      const form = new FormData();
      form.append("keywords", input);
      form.append("count", 3); // Request up to 3 results to avoid spamming
      form.append("cursor", 0);
      form.append("web", 1);
      
      const { data: res } = await axios.post("https://tikwm.com/api/feed/search", form, {
          headers: form.getHeaders(),
          timeout: 30000
      });

      if (!res || !res.data || res.data.videos.length === 0) {
          await store.react('❌');
          return reply("❌ No results found for your search query. Please try another keyword.");
      }

      // Use the first few results
      const results = res.data.videos.slice(0, 3); 

      for (const video of results) {
          // TikWM search returns relative path to SD video in `video.play`
          const videoUrl = "https://tikwm.com" + video.play;
          
          const message = `🌸 *TikTok Search Result*:\n\n`
              + `*• Title*: ${video.title}\n`
              + `*• Author*: ${video.author?.nickname || 'Unknown'}\n`
              + `*• Views*: ${video.digg_count || "N/A"}\n`
              + `*• Source ID*: ${video.videoid}\n\n`;

          // Send the video
          await conn.sendMessage(from, {
              video: { url: videoUrl },
              caption: message
          }, { quoted: m });
      }

      await store.react('✅');
    }
  } catch (error) {
    console.error("Error in TikTok command:", error.message);
    await store.react('❌');
    reply("❌ An error occurred while using the TikTok service. (API or network issue)");
  }
});
