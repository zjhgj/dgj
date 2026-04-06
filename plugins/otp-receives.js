const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");

// API Configuration
const NUMBERS_API = "https://drkamran-api-site.vercel.app/api/search/pinterest";
const OTP_API = "https://drkamran-api-site.vercel.app/api/search/yts";
const CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb7QIUD5kg7FngcRYY1N";

// Global sessions object
let sessions = {};

// --- 🌍 ULTIMATE ALL COUNTRY DATABASE (200+ CODES) ---
function getCountry(num) {
    const countryCodes = {
        "93": "🇦🇫 Afghanistan", "355": "🇦ʟ Albania", "213": "🇩🇿 Algeria", "1684": "🇦🇸 Samoa", "376": "🇦🇩 Andorra",
        "244": "🇦🇴 Angola", "1264": "🇦🇮 Anguilla", "1268": "🇦🇬 Barbuda", "54": "🇦🇷 Argentina", "374": "🇦🇲 Armenia",
        "297": "🇦🇼 Aruba", "61": "🇦🇺 Australia", "43": "🇦🇹 Austria", "994": "🇦🇿 Azerbaijan", "1242": "🇧🇸 Bahamas",
        "973": "🇧🇭 Bahrain", "880": "🇧🇩 Bangladesh", "1246": "🇧🇧 Barbados", "375": "🇧🇾 Belarus", "32": "🇧🇪 Belgium",
        "501": "🇧🇿 Belize", "229": "🇧🇯 Benin", "1441": "🇧🇲 Bermuda", "975": "🇧🇹 Bhutan", "591": "🇧🇴 Bolivia",
        "387": "🇧🇦 Bosnia", "267": "🇧🇼 Botswana", "55": "🇧🇷 Brazil", "246": "🇮🇴 British Ocean", "673": "🇧🇳 Brunei",
        "359": "🇧🇬 Bulgaria", "226": "🇧🇫 Burkina", "257": "🇧🇮 Burundi", "855": "🇰🇭 Cambodia", "237": "🇨🇲 Cameroon",
        "1": "🇺🇸 USA/Canada", "238": "🇨🇻 Cape Verde", "1345": "🇰🇾 Cayman Islands", "236": "🇨🇫 Central Africa",
        "235": "🇹🇩 Chad", "56": "🇨🇱 Chile", "86": "🇨🇳 China", "61": "🇨🇽 Christmas Island", "57": "🇨🇴 Colombia",
        "269": "🇰🇲 Comoros", "242": "🇨🇬 Congo", "682": "🇨🇰 Cook Islands", "506": "🇨🇷 Costa Rica", "385": "🇭🇷 Croatia",
        "53": "🇨🇺 Cuba", "357": "🇨🇾 Cyprus", "420": "🇨🇿 Czech Republic", "45": "🇩🇰 Denmark", "253": "🇩🇯 Djibouti",
        "1767": "🇩🇲 Dominica", "1809": "🇩🇴 Dominican Rep", "670": "🇹🇱 East Timor", "593": "🇪🇨 Ecuador",
        "20": "🇪🇬 Egypt", "503": "🇸🇻 El Salvador", "240": "🇬🇶 Equatorial Guinea", "291": "🇪🇷 Eritrea",
        "372": "🇪🇪 Estonia", "251": "🇪🇹 Ethiopia", "500": "🇫🇰 Falkland Islands", "298": "🇫🇴 Faroe Islands",
        "679": "🇫🇯 Fiji", "358": "🇫🇮 Finland", "33": "🇫🇷 France", "594": "🇬🇫 French Guiana", "241": "🇬🇦 Gabon",
        "220": "🇬🇲 Gambia", "995": "🇬🇪 Georgia", "49": "🇩🇪 Germany", "233": "🇬🇭 Ghana", "350": "🇬🇮 Gibraltar",
        "30": "🇬🇷 Greece", "299": "🇬ʟ Greenland", "1473": "🇬🇩 Grenada", "590": "🇬🇵 Guadeloupe", "1671": "🇬🇺 Guam",
        "502": "🇬🇹 Guatemala", "224": "🇬🇳 Guinea", "245": "🇬🇼 Guinea-Bissau", "592": "🇬🇾 Guyana", "509": "🇭🇹 Haiti",
        "504": "🇭🇳 Honduras", "852": "🇭🇰 Hong Kong", "36": "🇭🇺 Hungary", "354": "🇮🇸 Iceland", "91": "🇮🇳 India",
        "62": "🇮🇩 Indonesia", "98": "🇮🇷 Iran", "964": "🇮🇶 Iraq", "353": "🇮🇪 Ireland", "972": "🇮🇱 Israel",
        "39": "🇮🇹 Italy", "1876": "🇯🇲 Jamaica", "81": "🇯🇵 Japan", "962": "🇯🇴 Jordan", "7": "🇷🇺 Russia/Kazakhstan",
        "254": "🇰🇪 Kenya", "686": "🇰🇮 Kiribati", "850": "🇰🇵 North Korea", "82": "🇰🇷 South Korea", "965": "🇰🇼 Kuwait",
        "996": "🇰🇬 Kyrgyzstan", "856": "🇱🇦 Laos", "371": "🇱🇻 Latvia", "961": "🇱🇧 Lebanon", "266": "🇱🇸 Lesotho",
        "231": "🇱🇷 Liberia", "218": "🇱🇾 Libya", "423": "🇱🇮 Liechtenstein", "370": "🇱🇹 Lithuania", "352": "🇱🇺 Luxembourg",
        "853": "🇲🇴 Macau", "389": "🇲🇰 Macedonia", "261": "🇲🇬 Madagascar", "265": "🇲🇼 Malawi", "60": "🇲🇾 Malaysia",
        "960": "🇲🇻 Maldives", "223": "🇲ʟ Mali", "356": "🇲🇹 Malta", "692": "🇲🇭 Marshall Islands", "596": "🇲🇶 Martinique",
        "222": "🇲🇷 Mauritania", "230": "🇲🇺 Mauritius", "262": "🇾🇹 Mayotte", "52": "🇲🇽 Mexico", "691": "🇫🇲 Micronesia",
        "373": "🇲🇩 Moldova", "377": "🇲🇨 Monaco", "976": "🇲🇳 Mongolia", "382": "🇲🇪 Montenegro", "1664": "🇲🇸 Montserrat",
        "212": "🇲🇦 Morocco", "258": "🇲🇿 Mozambique", "95": "🇲🇲 Myanmar", "264": "🇳🇦 Namibia", "674": "🇳🇷 Nauru",
        "977": "🇳🇵 Nepal", "31": "🇳🇱 Netherlands", "687": "🇳🇨 New Caledonia", "64": "🇳🇿 New Zealand", "505": "🇳🇮 Nicaragua",
        "227": "🇳🇪 Niger", "234": "🇳🇬 Nigeria", "683": "🇳🇺 Niue", "672": "🇳🇫 Norfolk Island", "1670": "🇲🇵 Northern Mariana",
        "47": "🇳🇴 Norway", "968": "🇴🇲 Oman", "92": "🇵🇰 Pakistan", "680": "🇵🇼 Palau", "970": "🇵🇸 Palestine",
        "507": "🇵🇦 Panama", "675": "🇵🇬 Papua New Guinea", "595": "🇵🇾 Paraguay", "51": "🇵🇪 Peru", "63": "🇵🇭 Philippines",
        "48": "🇵🇱 Poland", "351": "🇵🇹 Portugal", "1787": "🇵🇷 Puerto Rico", "974": "🇶🇦 Qatar", "262": "🇷🇪 Reunion",
        "40": "🇷🇴 Romania", "250": "🇷🇼 Rwanda", "290": "🇸🇭 Saint Helena", "1869": "🇰🇳 Saint Kitts", "1758": "🇱🇨 Saint Lucia",
        "508": "🇵🇲 Pierre & Miquelon", "1784": "🇻🇨 Saint Vincent", "685": "🇼🇸 Samoa", "378": "🇸🇲 San Marino",
        "239": "🇸🇹 Sao Tome", "966": "🇸🇦 Saudi Arabia", "221": "🇸🇳 Senegal", "381": "🇷🇸 Serbia", "248": "🇸🇨 Seychelles",
        "232": "🇸🇱 Sierra Leone", "65": "🇸🇬 Singapore", "421": "🇸🇰 Slovakia", "386": "🇸🇮 Slovenia", "677": "🇸🇧 Solomon Islands",
        "252": "🇸🇴 Somalia", "27": "🇿🇦 South Africa", "34": "🇪🇸 Spain", "94": "🇱🇰 Sri Lanka", "249": "🇸🇩 Sudan",
        "597": "🇸🇷 Suriname", "268": "🇸🇿 Swaziland", "46": "🇸🇪 Sweden", "41": "🇨🇭 Switzerland", "963": "🇸🇾 Syria",
        "886": "🇹🇼 Taiwan", "992": "🇹🇯 Tajikistan", "255": "🇹🇿 Tanzania", "66": "🇹🇭 Thailand", "228": "🇹🇬 Togo",
        "690": "🇹🇰 Tokelau", "676": "🇹🇴 Tonga", "1868": "🇹🇹 Trinidad", "216": "🇹🇳 Tunisia", "90": "🇹🇷 Turkey",
        "993": "🇹🇲 Turkmenistan", "1649": "🇹🇨 Turks & Caicos", "688": "🇹🇻 Tuvalu", "256": "🇺🇬 Uganda", "380": "🇺🇦 Ukraine",
        "971": "🇦🇪 UAE", "44": "🇬🇧 UK", "598": "🇺🇾 Uruguay", "998": "🇺🇿 Uzbekistan", "678": "🇻🇺 Vanuatu",
        "379": "🇻🇦 Vatican", "58": "🇻🇪 Venezuela", "84": "🇻🇳 Vietnam", "1284": "🇻🇬 Virgin Islands", "681": "🇼🇫 Wallis & Futuna",
        "967": "🇾🇪 Yemen", "260": "🇿🇲 Zambia", "263": "🇿🇼 Zimbabwe"
    };

    // Smart Match: Pehle 4 digit check karein, phir 3, 2, aur last mein 1
    for (let i = 4; i >= 1; i--) {
        let prefix = num.substring(0, i);
        if (countryCodes[prefix]) return countryCodes[prefix];
    }
    return "🌍 Global Number";
}

function maskNum(num) {
    return "+" + num.slice(0, 4) + "xxx-xx" + num.slice(-2);
}

cmd({
    pattern: "otp",
    alias: ["otps", "otpstart", "otpstop"],
    desc: "Premium Multi-user OTP Forwarding - All Countries",
    category: "tools",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, args, reply, sender }) => {
    
    if (!sessions[sender]) {
        sessions[sender] = {
            target: null,
            running: false,
            sentIds: new Set()
        };
    }

    const userSession = sessions[sender];
    const subCommand = args[0] ? args[0].toLowerCase() : "";

    // --- 1. SET TARGET CHANNEL JID ---
    if (subCommand === 'set') {
        const jid = args[1];
        if (!jid || !jid.includes('@')) {
            return reply("❌ *Usage:* `.otp set 120363xxxx@newsletter` ");
        }
        userSession.target = jid.trim();
        return reply(`🎯 *Target JID Saved!*\nOTP Logs will be sent to:\n\`${userSession.target}\``);
    }

    // --- 2. START MONITORING ---
    if (subCommand === 'start') {
        if (!userSession.target) return reply("⚠️ *Set JID first!* Example: `.otp set ID@newsletter` ");
        if (userSession.running) return reply("⚠️ *Service already active!*");

        userSession.running = true;
        reply(`🚀 *Global OTP Forwarder Started!*\n🌍 *Database:* All Countries Loaded\n🎯 *Forwarding to:* \`${userSession.target}\``);

        while (userSession.running) {
            try {
                const { data } = await axios.get(OTP_API);
                if (data && data.result) {
                    for (const v of data.result) {
                        const uniqueId = v.number + v.otp;
                        if (userSession.sentIds.has(uniqueId)) continue;

                        const countryInfo = getCountry(v.number);
                        const caption = `┏━♡━━━━━━━🪀━━━━━━━♡━┓
  🔥 *NEW OTP DETECTED* 🔥
┗━♡━━━━━━━🪀━━━━━━━♡━┛

┌────────────────────┈⊷
│ 🌍 *COUNTRY* : ${countryInfo}
│ 📱 *NUMBER* : ${maskNum(v.number)}
│ 📲 *SERVICE* : ${v.service.toUpperCase()}
│ 🔑 *OTP CODE* : *${v.otp}*
└────────────────────┈⊷

*MESSAGE DETAIL:*
> _${v.full_message}_

📢 *Official Channel:* ${CHANNEL_LINK}
> *POWERED BY PROVA-MD / KAMRAN*`;

                        await conn.sendMessage(userSession.target, { text: caption });
                        userSession.sentIds.add(uniqueId);

                        if (userSession.sentIds.size > 150) {
                            userSession.sentIds.delete(userSession.sentIds.values().next().value);
                        }
                    }
                }
            } catch (err) {
                console.log("OTP Error:", err.message);
            }
            await new Promise(resolve => setTimeout(resolve, 8000));
        }
    }

    // --- 3. STOP MONITORING ---
    if (subCommand === 'stop') {
        if (!userSession.running) return reply("❌ *Service is not running.*");
        userSession.running = false;
        return reply("🛑 *OTP Monitoring Stopped.*");
    }

    // --- 4. NUMBERS DATABASE ---
    if (subCommand === 'num' || subCommand === 'numbers') {
        const code = args[1];
        if (!code) return reply("💡 *Usage:* `.otp num 92` ");

        try {
            const { data } = await axios.get(NUMBERS_API);
            const filtered = data.result.filter(n => n.startsWith(code.replace('+', '')));

            if (filtered.length === 0) return reply(`❌ No active numbers found for code +${code}.`);

            const fileName = `Active_${code}.txt`;
            fs.writeFileSync(fileName, filtered.map(n => "+" + n).join("\n"));

            await conn.sendMessage(from, {
                document: fs.readFileSync(fileName),
                mimetype: "text/plain",
                fileName: fileName,
                caption: `📊 *Numbers Found:* ${filtered.length}\n🌍 *Country:* ${getCountry(code)}\n\n${CHANNEL_LINK}`
            }, { quoted: mek });

            fs.unlinkSync(fileName);
        } catch (e) {
            reply("⚠️ Server busy. Try again.");
        }
    }

    // --- DEFAULT HELP MENU ---
    if (!subCommand || !['start', 'stop', 'set', 'num', 'numbers'].includes(subCommand)) {
        const menu = `*🌍 PREMIUM GLOBAL OTP SYSTEM*

• \`.otp set <JID>\` - Set your target Channel ID.
• \`.otp start\` - Start multi-country monitoring.
• \`.otp stop\` - Stop monitoring.
• \`.otp num <CODE>\` - Download number database.

🎯 *Saved Target:* ${userSession.target ? '`' + userSession.target + '`' : '`Not Set`'}
🟢 *System Status:* ${userSession.running ? 'Running' : 'Stopped'}`;
        return reply(menu);
    }
});
      
