//---------------------------------------------------------------------------
//           KAMRAN-MD - GITHUB GISTS DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 GET CODE FROM GITHUB GISTS (TEXT OR DOCUMENT SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

/**
 * Function to extract ID from Github Gist URL
 */
function extractId(url) {
    try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        const id = parts.pop();
        return id || null;
    } catch (e) {
        return null;
    }
}

// --- COMMAND: GITS ---

cmd({
    pattern: "gits",
    alias: ["getgits", "gist"],
    desc: "Get code/files from Github Gists.",
    category: "tools",
    react: "📁",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) {
        return reply(`⚠️ *Format Invalid*\n\nUsage: \`.gits <link>\` (Text output)\nUsage: \`.gits <link> --doc\` (File output)`);
    }

    try {
        let [link, type] = text.split(" ");
        if (!link.includes("github")) return reply("❌ Please provide a valid Github Gist link.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const id = extractId(link);
        if (!id) return reply("❌ Could not extract Gist ID.");

        // Fetching Gist Data from Github API
        const response = await axios.get(`https://api.github.com/gists/${id}`);
        const getRaw = response.data;
        const files = Object.values(getRaw?.files || []);

        if (files.length === 0) return reply("❌ No files found in this Gist.");

        for (const file of files) {
            if (type === "--doc") {
                // Send as Document
                const buffer = Buffer.from(file.content, "utf-8");

                await conn.sendMessage(from, {
                    document: buffer,
                    fileName: file.filename,
                    mimetype: 'text/plain', // Standard text file type
                    caption: `*📄 File:* ${file.filename}\n*🚀 From:* KAMRAN-MD`,
                    contextInfo: newsletterContext
                }, { quoted: mek });

            } else {
                // Send as Text Message
                const codeMsg = `*📄 File:* ${file.filename}\n\n\`\`\`${file.content}\`\`\`\n\n*🚀 KAMRAN-MD*`;
                
                await conn.sendMessage(from, { 
                    text: codeMsg,
                    contextInfo: newsletterContext
                }, { quoted: mek });
            }
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Gits Error:", e);
        reply("❌ Error fetching Gist data. Please check the link or API status.");
    }
});
