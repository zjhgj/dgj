const axios = require('axios');

class WanVideoGenerator {
    constructor() {
        this.spaceId = "luca115/wan2-2-5b-fast-t2v-i2v-t2i";
        this.sessionHash = Math.random().toString(36).substring(2, 13);
    }

    async getDynamicHost() {
        const hostRes = await axios.get(`https://huggingface.co/api/spaces/${this.spaceId}/host`);
        return `https://${hostRes.data.subdomain}.hf.space`;
    }

    async generate(promptText) {
        try {
            const apiHost = await this.getDynamicHost();
            const joinUrl = `${apiHost}/gradio_api/queue/join`;
            const dataUrl = `${apiHost}/gradio_api/queue/data?session_hash=${this.sessionHash}`;

            const headers = {
                "Content-Type": "application/json",
                "x-gradio-user": "api",
                "Origin": "https://upsampler.com",
                "Referer": "https://upsampler.com/"
            };

            const payload = {
                data: [
                    promptText, 896, 896, null,
                    "Bright tones, blurred details, low quality, ugly, watermark, text", // Simplified negative prompt
                    2, 0.0, 4, Math.floor(Math.random() * 100000), true 
                ],
                event_data: null,
                fn_index: 2,
                trigger_id: 22,
                session_hash: this.sessionHash
            };

            // Step 1: Join the Queue
            await axios.post(joinUrl, payload, { headers });

            // Step 2: Listen for Process Completion (Polling simulation)
            return new Promise((resolve, reject) => {
                const checkStatus = async () => {
                    try {
                        const response = await axios.get(dataUrl, { headers });
                        const chunks = response.data.split('\n');

                        for (let chunk of chunks) {
                            if (chunk.startsWith('data: ')) {
                                const result = JSON.parse(chunk.substring(6));
                                
                                if (result.msg === "process_completed") {
                                    if (result.success) {
                                        const videoPath = result.output.data[0].video.path;
                                        resolve(`${apiHost}/gradio_api/file=${videoPath}`);
                                    } else {
                                        reject("AI Processing Failed");
                                    }
                                    return;
                                }
                                
                                if (result.msg === "process_error") {
                                    reject("GPU Busy/Error");
                                    return;
                                }
                            }
                        }
                        // Agar abhi tak complete nahi hua, toh 3 second baad phir check karo
                        setTimeout(checkStatus, 3000);
                    } catch (e) {
                        reject("Polling Error: " + e.message);
                    }
                };
                checkStatus();
            });
        } catch (err) {
            throw err;
        }
    }
}

module.exports = { WanVideoGenerator };
