console.log("🚀 BACKGROUND SCRIPT LOADED");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

    console.log("📩 MESSAGE RECEIVED:", msg);

    // Save comment to local file
    if (msg.action === "save_comment") {
        const SAVE_URLS = [
            "http://127.0.0.1:5000/save_comment",
            "http://localhost:5000/save_comment"
        ];

        (async () => {
            for (let url of SAVE_URLS) {
                try {
                    const res = await fetch(url, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(msg.data)
                    });
                    if (res.ok) {
                        const result = await res.json();
                        console.log("💾 Comment saved:", result);
                        sendResponse(result);
                        return;
                    }
                } catch (err) {
                    console.warn("Save error:", err.message);
                }
            }
            sendResponse({ status: "error", error: "Could not save" });
        })();
        return true;
    }

    if (msg.action === "predict_batch" && Array.isArray(msg.texts)) {
        const BATCH_URLS = [
            "http://127.0.0.1:5000/predict_batch",
            "http://localhost:5000/predict_batch"
        ];
        
        async function callBatchAPI(url) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texts: msg.texts, context: msg.context }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (!res.ok) throw new Error("HTTP " + res.status);
            return await res.json();
        }

        (async () => {
            let lastErr = null;
            for (let url of BATCH_URLS) {
                try {
                    const data = await callBatchAPI(url);
                    sendResponse(data);
                    return;
                } catch (err) {
                    lastErr = err;
                }
            }
            sendResponse({ error: "Backend not reachable for batch" });
        })();
        return true;
    }

    // Accept both text or comment fields
    const text = msg?.text || msg?.comment;

    if (!text || typeof text !== "string") {
        console.error("❌ Invalid message:", msg);
        sendResponse({
            label: "error",
            error: "Invalid text input"
        });
        return true;
    }

    const API_URLS = [
        "http://127.0.0.1:5000/predict",
        "http://localhost:5000/predict"
    ];

    const payload = {
        text: text.trim(),
        context: msg?.context || ""
    };

    async function callAPI(url) {

        try {

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            const data = await response.json();

            console.log("✅ BACKEND RESPONSE:", data);

            return data;

        } catch (err) {

            console.warn("⚠ API ERROR:", url, err.message);
            throw err;

        }
    }

    (async () => {

        let lastError = null;

        for (let url of API_URLS) {

            try {

                const data = await callAPI(url);

                let label =
                    data?.label ||
                    data?.prediction ||
                    data?.result ||
                    data?.class ||
                    "safe";

                label = label.toString().trim().toLowerCase();

                // Normalize label
                if (label === "1") label = "toxic";
                if (label === "0") label = "safe";

                sendResponse({
                    label: label,
                    raw: data
                });

                return;

            } catch (err) {

                lastError = err;

            }

        }

        console.error("❌ Backend not reachable");

        sendResponse({
            label: "error",
            error: "Backend not reachable",
            details: lastError?.message || "Unknown error"
        });

    })();

    return true;
});