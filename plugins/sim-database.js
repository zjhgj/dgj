const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "sim",
    alias: ["number", "simdetail"],
    react: "🔎",
    desc: "Fetch SIM owner details using Number or CNIC.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* \n${prefix + command} 03001234567\n${prefix + command} 35201xxxxxxx`);

        const accessKey = "AHMAD-786"; // Decryption Key provided by user
        const apiUrl = `https://mhcloud.kesug.com/view.php?site=ahmad-sim-database&i=1&query=${q}&key=${accessKey}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply("🚀 *KAMRAN-MD:* Searching database... Please wait.");

        const response = await axios.get(apiUrl);
        const data = response.data;

        // Note: Response handling depends on the API's JSON structure. 
        // Assuming standard format for SIM APIs.
        if (data && data.status) {
            let result = `👤 *SIM OWNER DETAILS*\n\n`;
            result += `📝 *Name:* ${data.name || 'N/A'}\n`;
            result += `🆔 *CNIC:* ${data.cnic || 'N/A'}\n`;
            result += `📱 *Number:* ${data.number || q}\n`;
            result += `🏠 *Address:* ${data.address || 'N/A'}\n`;
            result += `📅 *Date:* ${data.date || 'N/A'}\n\n`;
            result += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

            await conn.sendMessage(from, { text: result }, { quoted: m });
            await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            reply("❌ *Error:* No details found or API key expired.");
        }

    } catch (e) {
        console.error("SIM Lookup Error:", e);
        reply(`🍂 *KAMRAN-MD Error:* Failed to connect to SIM database.`);
    }
});
      
