const { cmd, commands } = require('../command');
const yts = require("yt-search");
const axios = require("axios");
const {
  downloadContentFromMessage,
  generateWAMessageFromContent,
  normalizeMessageContent,
} = require("gifted-baileys");
const { sendButtons } = require("gifted-btns");

gmd(
  {
    pattern: "sendimage",
    aliases: ["sendimg", "dlimg", "dlimage"],
    category: "downloader",
    react: "📷",
    description: "Download Audio from url",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, sender, botFooter, gmdBuffer } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide image url");
    }

    try {
      const buffer = await gmdBuffer(q);
      if (buffer instanceof Error) {
        await react("❌");
        return reply("Failed to download the image file.");
      }
      await Gifted.sendMessage(
        from,
        {
          image: imageBuffer,
          mimetype: "image/jpg",
          caption: `> *${botFooter}*`,
        },
        { quoted: mek },
      );
      await react("✅");
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "sendaudio",
    aliases: ["sendmp3", "dlmp3", "dlaudio"],
    category: "downloader",
    react: "🎶",
    description: "Download Audio from url",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, sender, botFooter, gmdBuffer, formatAudio } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide audio url");
    }

    try {
      const buffer = await gmdBuffer(q);
      const convertedBuffer = await formatAudio(buffer);
      if (buffer instanceof Error) {
        await react("❌");
        return reply("Failed to download the audio file.");
      }
      await Gifted.sendMessage(
        from,
        {
          audio: convertedBuffer,
          mimetype: "audio/mpeg",
          caption: `> *${botFooter}*`,
        },
        { quoted: mek },
      );
      await react("✅");
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "sendvideo",
    aliases: ["sendmp4", "dlmp4", "dvideo"],
    category: "downloader",
    react: "🎥",
    description: "Download Video from url",
  },
  async (from, Gifted, conText) => {
    const { q, mek, reply, react, sender, botFooter, gmdBuffer, formatVideo } =
      conText;

    if (!q) {
      await react("❌");
      return reply("Please provide video url");
    }

    try {
      const buffer = await gmdBuffer(q);
      const convertedBuffer = await formatVideo(buffer);
      if (buffer instanceof Error) {
        await react("❌");
        return reply("Failed to download the video file.");
      }
      await Gifted.sendMessage(
        from,
        {
          document: convertedBuffer,
          fileName: "Video.mp4",
          mimetype: "video/mp4",
          caption: `> *${botFooter}*`,
        },
        { quoted: mek },
      );
      await react("✅");
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "play",
    aliases: ["ytmp3", "ytmp3doc", "audiodoc", "yta"],
    category: "downloader",
    react: "🎶",
    description: "Download Video from Youtube",
  },
  async (from, Gifted, conText) => {
    const {
      q,
      mek,
      reply,
      react,
      sender,
      botPic,
      botName,
      botFooter,
      newsletterUrl,
      newsletterJid,
      gmdJson,
      gmdBuffer,
      formatAudio,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a song name");
    }

    try {
      const searchResponse = await yts(q);

      if (!searchResponse.videos.length) {
        return reply("No video found for your query.");
      }

      const firstVideo = searchResponse.videos[0];
      const videoUrl = firstVideo.url;
      const audioApi = `http://31.220.82.203:2029/api/yta?url=${encodeURIComponent(videoUrl)}&stream=true`; // can be deactivated anytime

      const bufferRes = await gmdBuffer(audioApi);

      const sizeMB = bufferRes.length / (1024 * 1024);
      if (sizeMB > 20) {
        await reply("File is large, processing might take a while...");
      }

      const convertedBuffer = await formatAudio(bufferRes);

      const dateNow = Date.now();

      // Send buttons
      await sendButtons(Gifted, from, {
        title: `${botName} 𝐒𝐎𝐍𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑`,
        text: `⿻ *Title:* ${firstVideo.title}\n⿻ *Duration:* ${firstVideo.timestamp}\n\n*Select download format:*`,
        footer: botFooter,
        image: firstVideo.thumbnail || botPic,
        buttons: [
          { id: `id1_${firstVideo.id}_${dateNow}`, text: "Audio 🎶" },
          { id: `id2_${firstVideo.id}_${dateNow}`, text: "Voice Message 🔉" },
          { id: `id3_${firstVideo.id}_${dateNow}`, text: "Audio Document 📄" },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Watch on Youtube",
              url: firstVideo.url,
            }),
          },
        ],
      });

      const handleResponse = async (event) => {
        const messageData = event.messages[0];
        if (!messageData.message) return;

        // Check if it's a template button reply
        const templateButtonReply =
          messageData.message?.templateButtonReplyMessage;
        if (!templateButtonReply) return;

        const selectedButtonId = templateButtonReply.selectedId;
        const selectedDisplayText = templateButtonReply.selectedDisplayText;

        const isFromSameChat = messageData.key?.remoteJid === from;
        if (!isFromSameChat) return;

        await react("⬇️");

        try {
          if (!selectedButtonId.includes(`_${dateNow}`)) {
            return;
          }

          const buttonType = selectedButtonId.split("_")[0];

          switch (buttonType) {
            case "id1":
              await Gifted.sendMessage(
                from,
                {
                  audio: convertedBuffer,
                  mimetype: "audio/mpeg",
                },
                { quoted: messageData },
              );
              break;

            case "id2":
              const pttBuffer = await toPtt(convertedBuffer);
              await Gifted.sendMessage(
                from,
                {
                  audio: pttBuffer,
                  mimetype: "audio/ogg; codecs=opus",
                  ptt: true,
                  waveform: [1000, 0, 1000, 0, 1000, 0, 1000],
                },
                { quoted: messageData },
              );
              break;

            case "id3":
              await Gifted.sendMessage(
                from,
                {
                  document: convertedBuffer,
                  mimetype: "audio/mpeg",
                  fileName: `${firstVideo.title}.mp3`.replace(
                    /[^\w\s.-]/gi,
                    "",
                  ),
                  caption: `${firstVideo.title}`,
                },
                { quoted: messageData },
              );
              break;

            default:
              await reply(
                "Invalid option selected. Please use the buttons provided.",
                messageData,
              );
              return;
          }

          await react("✅");
          Gifted.ev.off("messages.upsert", handleResponse);
        } catch (error) {
          console.error("Error sending media:", error);
          await react("❌");
          await reply("Failed to send media. Please try again.", messageData);
          Gifted.ev.off("messages.upsert", handleResponse);
        }
      };

      Gifted.ev.on("messages.upsert", handleResponse);

      setTimeout(() => {
        Gifted.ev.off("messages.upsert", handleResponse);
      }, 120000);
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);

gmd(
  {
    pattern: "video",
    aliases: ["ytmp4doc", "mp4", "ytmp4", "dlmp4"],
    category: "downloader",
    react: "🎥",
    description: "Download Video from Youtube",
  },
  async (from, Gifted, conText) => {
    const {
      q,
      mek,
      reply,
      react,
      sender,
      botPic,
      botName,
      botFooter,
      newsletterUrl,
      newsletterJid,
      gmdJson,
      gmdBuffer,
      formatVideo,
      GiftedTechApi,
      GiftedApiKey,
    } = conText;

    if (!q) {
      await react("❌");
      return reply("Please provide a video name");
    }

    try {
      const searchResponse = await yts(q);

      if (!searchResponse.videos.length) {
        return reply("No video found for your query.");
      }

      const firstVideo = searchResponse.videos[0];
      const videoUrl = firstVideo.url;

      const videoApi = `http://31.220.82.203:2029/api/ytv?url=${encodeURIComponent(videoUrl)}&stream=true`; // can be deactivated anytime

      const response = await gmdBuffer(videoApi);

      const sizeMB = response.length / (1024 * 1024);
      if (sizeMB > 20) {
        await reply("File is large, processing might take a while...");
      }

      const convertedBuffer = await formatVideo(response);

      const dateNow = Date.now();

      await sendButtons(Gifted, from, {
        title: `${botName} 𝐕𝐈𝐃𝐄𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑`,
        text: `⿻ *Title:* ${firstVideo.title}\n⿻ *Duration:* ${firstVideo.timestamp}\n\n*Select download format:*`,
        footer: botFooter,
        image: firstVideo.thumbnail || botPic,
        buttons: [
          { id: `vid1_${firstVideo.id}_${dateNow}`, text: "Video 🎥" },
          { id: `vid2_${firstVideo.id}_${dateNow}`, text: "Video Document 📄" },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Watch on Youtube",
              url: firstVideo.url,
            }),
          },
        ],
      });

      const handleResponse = async (event) => {
        const messageData = event.messages[0];
        if (!messageData.message) return;

        const templateButtonReply =
          messageData.message?.templateButtonReplyMessage;
        if (!templateButtonReply) return;

        const selectedButtonId = templateButtonReply.selectedId;

        const isFromSameChat = messageData.key?.remoteJid === from;
        if (!isFromSameChat) return;

        await react("⬇️");

        try {
          if (!selectedButtonId.includes(`_${dateNow}`)) {
            return;
          }

          const buttonType = selectedButtonId.split("_")[0];

          switch (buttonType) {
            case "vid1":
              await Gifted.sendMessage(
                from,
                {
                  video: convertedBuffer,
                  mimetype: "video/mp4",
                  fileName: `${firstVideo.title}.mp4`.replace(
                    /[^\w\s.-]/gi,
                    "",
                  ),
                  caption: `🎥 ${firstVideo.title}`,
                },
                { quoted: messageData },
              );
              break;

            case "vid2":
              await Gifted.sendMessage(
                from,
                {
                  document: convertedBuffer,
                  mimetype: "video/mp4",
                  fileName: `${firstVideo.title}.mp4`.replace(
                    /[^\w\s.-]/gi,
                    "",
                  ),
                  caption: `📄 ${firstVideo.title}`,
                },
                { quoted: messageData },
              );
              break;

            default:
              await reply(
                "Invalid option selected. Please use the buttons provided.",
                messageData,
              );
              return;
          }
          await react("✅");
          Gifted.ev.off("messages.upsert", handleResponse);
        } catch (error) {
          console.error("Error sending media:", error);
          await react("❌");
          await reply("Failed to send media. Please try again.", messageData);
          Gifted.ev.off("messages.upsert", handleResponse);
        }
      };

      Gifted.ev.on("messages.upsert", handleResponse);

      setTimeout(() => {
        Gifted.ev.off("messages.upsert", handleResponse);
      }, 120000);
    } catch (error) {
      console.error("Error during download process:", error);
      await react("❌");
      return reply("Oops! Something went wrong. Please try again.");
    }
  },
);
            
