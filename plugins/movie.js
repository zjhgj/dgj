//---------------------------------------------------------------------------
//           KAMRAN-MD - HAIRSTYLE AI (LIVE3D)
//---------------------------------------------------------------------------
//  🚀 CHANGE HAIR STYLES USING AI PROCESSING
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');
const FormData = require('form-data');

const CONFIG = {
  baseUrl: 'https://app.live3d.io/aitools',
  resultUrl: 'https://temp.live3d.io',
  origin: 'https://live3d.io',
  originFrom: '5b3e78451640893a',
  fnName: 'demo-change-hair',
  requestFrom: 9
};

/**
 * Generate specific headers required by Live3D API
 */
function generateHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'fp': '20cebea9c9d06e3b020503f67762edf3',
    'fp1': 'VYuryLPUfU5QZLF53k96BkHdB7IYyJ8VXkNwwNHDooU+n3SlBumb/UiX+PyrVRJv',
    'x-code': Date.now().toString(),
    'x-guide': 'PFu2MqGSK5Wgg3jFZ9VX/LCzTI03jSf6rvUSw8ydSHolxrgCsQrbpZtyycWD/+c4ttuBDSKIYhxAPt4zhxZ4qqyEwjwk6oXmK9Nc04LlwAar9K5Hw2f781SnnuKT/CU0l5PfwaeIIqxXCn3OxyJHKLpPNp6OdkBH952BZ40GETY=',
    'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q',
    'origin': CONFIG.origin,
    'referer': `${CONFIG.origin}/`
  };
}

/**
 * Upload image buffer to Live3D
 */
async function uploadImage(buffer) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
  form.append('fn_name', CONFIG.fnName);
  form.append('request_from', String(CONFIG.requestFrom));
  form.append('origin_from', CONFIG.originFrom);

  const res = await fetch(`${CONFIG.baseUrl}/upload-img`, {
    method: 'POST',
    headers: { ...generateHeaders(), ...form.getHeaders() },
    body: form
  });
  return await res.json();
}

/**
 * Create the AI task
 */
async function createTask(imagePath, prompt) {
  const res = await fetch(`${CONFIG.baseUrl}/of/create`, {
    method: 'POST',
    headers: { ...generateHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fn_name: CONFIG.fnName,
      call_type: 3,
      input: { prompt, source_image: imagePath, request_from: CONFIG.requestFrom },
      request_from: CONFIG.requestFrom,
      origin_from: CONFIG.originFrom
    })
  });
  return await res.json();
}

/**
 * Check task progress
 */
async function checkStatus(taskId) {
  const res = await fetch(`${CONFIG.baseUrl}/of/check-status`, {
    method: 'POST',
    headers: { ...generateHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      fn_name: CONFIG.fnName,
      call_type: 3,
      request_from: CONFIG.requestFrom,
      origin_from: CONFIG.originFrom
    })
  });
  return await res.json();
}

/**
 * Polling for result
 */
async function waitForResult(taskId, max = 30) {
  for (let i = 0; i < max; i++) {
    const res = await checkStatus(taskId);
    if (res.code === 200 && res.data?.status === 2 && res.data?.result_image) {
      return res.data.result_image;
    }
    if (res.data?.status === -1) throw 'AI Processing failed.';
    await new Promise(r => setTimeout(r, 3000));
  }
  throw 'Processing Timeout.';
}

// --- COMMAND: HAIRSTYLE / EDITHAIR ---

cmd({
    pattern: "hairstyle",
    alias: ["edithair", "hairai"],
    desc: "Change hairstyle in an image using AI.",
    category: "ai",
    use: ".hairstyle <prompt>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image/')) {
            return reply(`📸 *Hairstyle AI*\n\nPlease reply to an image with a prompt.\n\n*Example:* \`${prefix + command} blonde long hair\``);
        }

        if (!q) return reply("❌ Please provide a hairstyle description (prompt).");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply("_🤖 Processing hairstyle... This may take a few seconds._");

        // Download image from WhatsApp
        const buffer = await quoted.download();
        if (!buffer) throw 'Could not download image.';

        // Upload to Live3D
        const up = await uploadImage(buffer);
        if (up.code !== 200) throw 'Upload to AI server failed.';

        // Create Task
        const task = await createTask(up.data.path, q);
        if (task.code !== 200) throw 'Failed to start AI task.';

        // Wait for Result
        const result = await waitForResult(task.data.task_id);
        const url = `${CONFIG.resultUrl}/${result}`;

        // Send Result
        await conn.sendMessage(from, { 
            image: { url: url }, 
            caption: `✅ *Hairstyle Changed Successfully!*\n🎨 *Prompt:* ${q}\n\n*🚀 Powered by KAMRAN-MD*` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Hairstyle AI Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${typeof e === 'string' ? e : "Something went wrong during processing."}`);
    }
});
