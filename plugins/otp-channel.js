const axios = require("axios")
const fs = require("fs")
const { cmd } = require("../command")

const NUMBERS_API = "https://arslan-apis.vercel.app/more/activenumbers"
const OTP_API = "https://arslan-apis.vercel.app/otp/messages"

const CHANNEL = "120363425374615077@newsletter"

let running = false
let sent = new Set()

/* =========================
   COUNTRY FLAG
========================= */

function getCountry(num){

if(num.startsWith("92")) return "🇵🇰 Pakistan"
if(num.startsWith("91")) return "🇮🇳 India"
if(num.startsWith("1")) return "🇺🇸 USA"
if(num.startsWith("44")) return "🇬🇧 UK"

return "🌍 Unknown"

}

/* =========================
   HIDE NUMBER
========================= */

function hideNumber(num){

const last4 = num.slice(-4)
return "+" + num.slice(0,2) + "******" + last4

}

/* =========================
   NUMBERS COMMAND
========================= */

cmd({
pattern: "numbers",
react: "📱",
desc: "Get numbers by country code",
category: "tools",
use: ".numbers 92",
filename: __filename
},

async (conn, mek, m, { args, reply }) => {

const code = args[0]

if(!code) return reply("Example: .numbers 92")

try{

const {data} = await axios.get(NUMBERS_API)

const numbers = data.result.filter(v => v.startsWith(code))

if(!numbers.length) return reply("❌ Country not available")

const file = `numbers-${code}.txt`

fs.writeFileSync(file,numbers.map(v=>"+"+v).join("\n"))

await conn.sendMessage(
m.chat,
{
document: fs.readFileSync(file),
mimetype:"text/plain",
fileName:file,
caption:`📱 Numbers (${code})\nTotal: ${numbers.length}`
},
{quoted:mek}
)

fs.unlinkSync(file)

}catch(e){

console.log(e)

reply("Error fetching numbers")

}

})

/* =========================
   OTP START
========================= */

cmd({
pattern:"otpstart",
react:"🚀",
desc:"Start OTP Forward",
category:"tools",
filename:__filename
},

async (conn,mek,m,{reply})=>{

if(running) return reply("OTP Forward already running")

running = true

reply("OTP Forward Started")

while(running){

try{

const {data} = await axios.get(OTP_API)

for(const v of data.result){

const id = v.number + v.otp

if(sent.has(id)) continue

await conn.sendMessage(
CHANNEL,
{
text:
`🔐 NEW OTP RECEIVED

🌍 Country : ${getCountry(v.number)}
📱 Number : ${hideNumber(v.number)}
📲 Service : ${v.service}
🔑 OTP : ${v.otp}
⏰ Time : ${v.time}`
}
)

sent.add(id)

}

}catch(e){

console.log(e.message)

}

await new Promise(r=>setTimeout(r,10000))

}

})

/* =========================
   OTP STOP
========================= */

cmd({
pattern:"otpstop",
react:"🛑",
desc:"Stop OTP Forward",
category:"tools",
filename:__filename
},

async (conn,mek,m,{reply})=>{

running = false

reply("OTP Forward Stopped")

})
