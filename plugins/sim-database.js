const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "sim",
    react: "🔎",
    desc: "Search SIM database.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* ${prefix + command} 03001234567`);

        const accessKey = "AHMAD-786";
        // Ensure the URL is correct for your specific API version
        const apiUrl = `https://mhcloud.kesug.com/view.php?site=ahmad-sim-database&i=1&query=${q}&key=${accessKey}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data;

        // Added more robust check for data
        if (data && (data.status === true || data.name)) {
            let result = `👤 *SIM DETAILS FOUND*\n\n`;
            result += `📝 *Name:* ${data.name || 'N/A'}\n`;
            result += `🆔 *CNIC:* ${data.cnic || 'N/A'}\n`;
            result += `📱 *Number:* ${data.number || q}\n`;
            result += `🏠 *Address:* ${data.address || 'N/A'}\n\n`;
            result += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;
            reply(result);
        } else {
            // Detailed error message
            reply("❌ *Error:* Details not found. The database might not have this number or the API key 'AHMAD-786' is invalid.");
        }
    } catch (e) {
        reply(`❌ *Network Error:* API is currently unreachable.`);
    }
});
