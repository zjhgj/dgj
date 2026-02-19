const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const { cmd } = require("../command");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
};

// ================= SESSION MAP =================
const sessions = new Map();

// ================= HELPERS =================
async function getFinalLink(dlPageUrl) {
  try {
    const { data } = await axios.get(dlPageUrl, {
      headers: HEADERS,
      maxRedirects: 5,
    });
    const $ = cheerio.load(data);
    return (
      $("a.button2.download-link").attr("href") ||
      $("a#download").attr("href")
    );
  } catch {
    return null;
  }
}

// ================= COMMAND =================
cmd({
  pattern: "film",
  alias: ["movie", "moviebd", "mdbd", "movies"],
  desc: "Search & download movies (manual reply system)",
  category: "downloader",
  filename: __filename,
  react: "🎬",
  use: ".film <movie name>"
}, async (client, message, match, { from, isCreator, sender, reply }) => {
  try {
    const query = match.join(" ").trim();
    if (!query) return reply("🔎 *Please provide a movie name!*");

    await client.sendMessage(from, {
      react: { text: "⏳", key: message.key }
    });

    // ================= SEARCH =================
    const searchUrl = `https://moviedrivebd.com/?s=${encodeURIComponent(
      query
    )}`;
    const { data } = await axios.get(searchUrl, { headers: HEADERS });
    const $ = cheerio.load(data);

    const results = [];
    $("div.result-item").each((i, el) => {
      const title = $(el)
        .find("article > div.details > div.title > a")
        .text()
        .trim();
      const link = $(el)
        .find("article > div.details > div.title > a")
        .attr("href");
      if (link) results.push({ title, link });
    });

    if (!results.length) return reply("❌ No results found!");

    let text = `🎬 *KAMRAN-MD Movies Search*\n\n`;
    text += `🔎 *Query:* ${query}\n\n`;

    results.forEach((v, i) => {
      text += `*${i + 1}.* ${v.title}\n`;
    });

    text += `\n✳️ Reply with *movie number* to select`;

    await client.sendMessage(
      from,
      { text, footer: config.FOOTER },
      { quoted: message }
    );

    sessions.set(sender, {
      stage: "search",
      results,
    });

    // ================= MANUAL HANDLER =================
    const handler = async (update) => {
      const msg = update.messages?.[0];
      if (!msg?.message) return;

      // Ignore bot reactions
      if (msg.message.reactionMessage) return;
      if (msg.key.remoteJid !== from) return;
      if (!sessions.has(sender)) return;

      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      const choice = parseInt(body);
      if (isNaN(choice)) return;

      const session = sessions.get(sender);

      // ========== MOVIE SELECT ==========
      if (session.stage === "search") {
        const selected = session.results[choice - 1];
        if (!selected) return reply("❌ Invalid movie number");

        setTimeout(() => {
          client.sendMessage(from, {
            react: { text: "📑", key: msg.key }
          });
        }, 300);

        const { data: detData } = await axios.get(selected.link, {
          headers: HEADERS,
        });
        const $d = cheerio.load(detData);

        const movie = {
          title: $d("h1").text().trim(),
          imdb: $d("#repimdb > strong").text() || "N/A",
          runtime: $d(".runtime").text() || "N/A",
          date: $d(".date").text() || "N/A",
          image: $d(".poster img").attr("href"),
          initLink: $d("a[href*='/links/']").first().attr("href"),
        };

        const { data: qData } = await axios.get(movie.initLink, {
          headers: HEADERS,
        });
        const dlPage = cheerio.load(qData)("#link").attr("href");

        const { data: last } = await axios.get(dlPage, {
          headers: HEADERS,
        });
        const $l = cheerio.load(last);

        const downloads = [];
        $l(".download-section a.download-btn").each((i, el) => {
          downloads.push({
            quality: $l(el)
              .find(".btn-text")
              .text()
              .replace(/\s+/g, " ")
              .trim(),
            dlPage: $l(el).attr("href"),
          });
        });

        let cap = `🎬 *${movie.title}*\n\n`;
        cap += `⭐ IMDb: ${movie.imdb}\n`;
        cap += `⏳ Duration: ${movie.runtime}\n`;
        cap += `📅 Date: ${movie.date}\n\n`;
        cap += `*Available Qualities:*\n`;

        downloads.forEach((d, i) => {
          cap += `*${i + 1}.* ${d.quality}\n`;
        });

        cap += `\n✳️ Reply with *quality number*`;

        await client.sendMessage(
          from,
          {
            image: { url: movie.image },
            caption: cap,
            footer: config.FOOTER,
          },
          { quoted: msg }
        );

        session.stage = "quality";
        session.movie = movie;
        session.downloads = downloads;
      }

      // ========== QUALITY SELECT ==========
      else if (session.stage === "quality") {
        const selected = session.downloads[choice - 1];
        if (!selected) return reply("❌ Invalid quality number");

        setTimeout(() => {
          client.sendMessage(from, {
            react: { text: "📥", key: msg.key }
          });
        }, 300);

        const finalUrl = await getFinalLink(selected.dlPage);
        if (!finalUrl)
          return reply("❌ Download link expired. Try another quality.");

        await client.sendMessage(
          from,
          {
            document: { url: finalUrl },
            mimetype: "video/mp4",
            fileName: `${session.movie.title}.mp4`,
            caption: `✅ *${session.movie.title}*\n${selected.quality}\n\n> ᴀʀꜱʟᴀɴ-ᴍᴅ`,
          },
          { quoted: msg }
        );

        sessions.delete(sender);
      }
    };

    client.ev.on("messages.upsert", handler);

    setTimeout(() => {
      sessions.delete(sender);
      client.ev.off("messages.upsert", handler);
    }, 15 * 60 * 1000);
  } catch (err) {
    console.log(err);
    reply("❌ Error while processing movie!");
  }
});
