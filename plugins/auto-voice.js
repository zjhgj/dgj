const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const converter = require('../data/converter');
const config = require('../config');

// ================= AUTO VOICE ON/OFF COMMAND =================
cmd({
    pattern: "autovoice",
    desc: "Turn Auto Voice ON or OFF",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        if (!args[0]) return reply("Usage: .autovoice on or .autovoice off");

        if (args[0].toLowerCase() === "on") {
            config.AUTO_VOICE = "true";
            return reply("✅ *Auto Voice System is now ON*");
        } 
        
        if (args[0].toLowerCase() === "off") {
            config.AUTO_VOICE = "false";
            return reply("❌ *Auto Voice System is now OFF*");
        }

    } catch (e) {
        console.error(e);
        reply("Error in AutoVoice Command");
    }
});

// ================= AUTO VOICE LISTENER (JO AUDIO BHEJEGA) =================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body }) => {
    try {
        // Condition check: Enabled hai ya nahi
        const isEnabled = config.AUTO_VOICE === "true" || config.AUTO_VOICE === true;
        if (!isEnabled) return;

        // Self-message filter aur body check
        if (m.fromMe || !body) return;

        const filePath = path.join(__dirname, '../assets/autovoice.json');
        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Trigger word find karein
        const matchText = Object.keys(data).find(trigger => trigger.toLowerCase() === body.trim().toLowerCase());
        if (!matchText) return;

        const audioFileName = data[matchText];
        const audioPath = path.join(__dirname, '../assets', audioFileName);
        
        if (!fs.existsSync(audioPath)) return;

        // Audio convert aur send karein
        const buffer = fs.readFileSync(audioPath);
        const fileExtension = audioFileName.split('.').pop();
        const pttAudio = await converter.toPTT(buffer, fileExtension);

        await conn.sendMessage(from, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.error("AutoVoice Listener Error:", error);
    }
});

