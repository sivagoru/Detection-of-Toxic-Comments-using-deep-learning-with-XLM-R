/* d:\app\app\extension\content.js */

console.log("🚀 TOXIC COMMENT BLOCKER LOADED");

let isChecking = false;
let skipCheckForNextAction = false;
let commentHistory = []; // Store all attempted comments
let panelOpen = false;
let selectedComment = null; // Currently selected comment for radar view

/* =========================
INJECT ALL STYLES
========================= */
function injectStyles() {
    if (document.getElementById('toxic-blocker-styles')) return;
    const style = document.createElement("style");
    style.id = "toxic-blocker-styles";
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ---- POPUP NOTIFICATION ---- */
        #toxic-overlay-popup {
            position: fixed;
            top: 30px;
            right: -400px;
            z-index: 9999999999;
            background: linear-gradient(135deg, rgba(8, 10, 15, 0.96), rgba(15, 23, 42, 0.96));
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            color: #f1f5f9;
            padding: 20px 28px;
            border-radius: 20px;
            border: 1px solid rgba(59, 130, 246, 0.3);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            font-size: 15px;
            line-height: 1.5;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 15px rgba(59, 130, 246, 0.15);
            display: flex;
            align-items: center;
            gap: 18px;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
            overflow: hidden;
            width: 360px;
            text-align: left;
        }
        #toxic-overlay-popup.show {
            right: 30px;
            opacity: 1;
        }
        .toxic-content-col {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .toxic-popup-title {
            font-weight: 800;
            font-size: 20px;
            color: #fff;
            letter-spacing: -0.02em;
        }
        .toxic-popup-message {
            color: #94a3b8;
            font-size: 15px;
            font-weight: 400;
        }
        .toxic-icon-loading {
            width: 32px; height: 32px;
            border: 3px solid rgba(59, 130, 246, 0.1);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s ease-in-out infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .toxic-icon-error {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 50%;
            color: #ef4444;
            font-size: 22px;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
            flex-shrink: 0;
        }
        .toxic-progress-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
            width: 100%;
            transform-origin: left;
            animation: shrink 4s linear forwards;
        }
        @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }

        /* ---- FLOATING ICON ---- */
        #toxic-app-icon {
            position: fixed;
            bottom: 28px;
            right: 28px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border: 2px solid rgba(59, 130, 246, 0.4);
            border-radius: 50%;
            color: white;
            font-size: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999999998;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 12px rgba(59, 130, 246, 0.2);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            user-select: none;
        }
        #toxic-app-icon:hover {
            transform: scale(1.12);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.35);
        }
        #toxic-app-icon .icon-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: white;
            font-size: 11px;
            font-weight: 700;
            min-width: 20px;
            height: 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 5px;
            font-family: 'Inter', sans-serif;
        }

        /* ---- REFRESH BUTTON (inside panel header) ---- */
        .panel-refresh-btn {
            width: 32px;
            height: 32px;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #60a5fa;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }
        .panel-refresh-btn:hover {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.3);
        }
        .panel-refresh-btn.spinning svg {
            animation: spin 0.6s ease;
        }

        /* ---- PANEL ---- */
        #toxic-history-panel {
            position: fixed;
            bottom: 96px;
            right: 28px;
            width: 400px;
            max-height: 520px;
            background: linear-gradient(145deg, rgba(8, 10, 18, 0.97), rgba(15, 23, 42, 0.97));
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(59, 130, 246, 0.25);
            border-radius: 20px;
            color: #f1f5f9;
            font-family: 'Inter', system-ui, sans-serif;
            z-index: 9999999998;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(16px) scale(0.97);
            transition: opacity 0.35s ease, transform 0.35s ease;
        }
        #toxic-history-panel.open {
            display: flex;
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        /* Panel Header */
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 18px 22px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .panel-header-title {
            font-weight: 700;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .panel-tabs {
            display: flex;
            gap: 6px;
        }
        .panel-tab {
            background: rgba(255, 255, 255, 0.06);
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 6px 14px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Inter', sans-serif;
        }
        .panel-tab:hover {
            background: rgba(59, 130, 246, 0.15);
            color: #e2e8f0;
        }
        .panel-tab.active {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            border-color: rgba(59, 130, 246, 0.35);
        }

        /* Panel Body */
        .panel-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px;
            scrollbar-width: thin;
            scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }
        .panel-body::-webkit-scrollbar {
            width: 5px;
        }
        .panel-body::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.3);
            border-radius: 10px;
        }

        /* Comment Item */
        .comment-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 14px;
            margin-bottom: 10px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.2s ease;
        }
        .comment-item:hover {
            background: rgba(255, 255, 255, 0.06);
        }
        .comment-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 5px;
        }
        .comment-dot.toxic { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
        .comment-dot.safe { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
        .comment-text {
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.5;
            flex: 1;
            word-break: break-word;
        }
        .comment-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 3px 8px;
            border-radius: 6px;
            flex-shrink: 0;
        }
        .comment-label.toxic {
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.12);
        }
        .comment-label.safe {
            color: #86efac;
            background: rgba(34, 197, 94, 0.12);
        }
        .empty-state {
            text-align: center;
            color: #475569;
            padding: 40px 20px;
            font-size: 14px;
        }
        .empty-state-icon {
            font-size: 36px;
            margin-bottom: 12px;
        }

        /* Comment Item - Clickable */
        .comment-item {
            cursor: pointer;
        }
        .comment-item:hover {
            background: rgba(59, 130, 246, 0.08);
            border-color: rgba(59, 130, 246, 0.2);
        }

        /* Radar Chart View */
        .radar-view {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 16px 20px;
        }
        .radar-back-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: none;
            border: 1px solid rgba(255 ,255, 255, 0.1);
            color: #94a3b8;
            font-size: 13px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            cursor: pointer;
            padding: 6px 14px;
            border-radius: 10px;
            align-self: flex-start;
            margin-bottom: 12px;
            transition: all 0.2s ease;
        }
        .radar-back-btn:hover {
            color: #e2e8f0;
            border-color: rgba(59, 130, 246, 0.3);
            background: rgba(59, 130, 246, 0.1);
        }
        .radar-comment-preview {
            font-size: 13px;
            color: #94a3b8;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 10px 14px;
            border-radius: 12px;
            margin-bottom: 16px;
            width: 100%;
            box-sizing: border-box;
            line-height: 1.5;
            word-break: break-word;
        }
        .radar-comment-preview .preview-label {
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 2px 7px;
            border-radius: 5px;
            margin-left: 8px;
        }
        .radar-comment-preview .preview-label.toxic {
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.15);
        }
        .radar-comment-preview .preview-label.safe {
            color: #86efac;
            background: rgba(34, 197, 94, 0.15);
        }
        .radar-canvas-wrap {
            margin-bottom: 14px;
        }
        .radar-scores {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
            width: 100%;
        }
        .radar-score-item {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
            padding: 8px 12px;
            border-radius: 10px;
            text-align: center;
            min-width: 70px;
        }
        .radar-score-val {
            font-size: 16px;
            font-weight: 800;
            color: #60a5fa;
            font-family: 'Inter', sans-serif;
        }
        .radar-score-val.high {
            color: #f87171;
        }
        .radar-score-label {
            font-size: 10px;
            color: #64748b;
            font-weight: 500;
            margin-top: 2px;
        }
    `;
    document.head.appendChild(style);
}

/* =========================
POPUP CONTROLS
========================= */
let popupTimeout = null;

function showPopup(title, message, state) {
    injectStyles();
    removePopup();

    const popup = document.createElement("div");
    popup.id = "toxic-overlay-popup";

    let iconHtml = "";
    if (state === "loading") {
        iconHtml = `<div class="toxic-icon-loading"></div>`;
    } else if (state === "toxic") {
        iconHtml = `
            <div class="toxic-icon-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </div>`;
        popup.style.background = "linear-gradient(135deg, rgba(8, 10, 15, 0.98), rgba(20, 20, 30, 0.98))";
        popup.style.border = "1px solid rgba(239, 68, 68, 0.5)";
    }

    let progressHtml = state === "toxic" ? `<div class="toxic-progress-bar"></div>` : "";

    popup.innerHTML = `
        ${iconHtml}
        <div class="toxic-content-col">
            <div class="toxic-popup-title">${title}</div>
            <div class="toxic-popup-message">${message}</div>
        </div>
        ${progressHtml}
    `;

    document.body.appendChild(popup);
    requestAnimationFrame(() => {
        popup.classList.add("show");
    });
}

function removePopup() {
    const existing = document.getElementById("toxic-overlay-popup");
    if (existing) {
        existing.classList.remove("show");
        setTimeout(() => existing.remove(), 400);
    }
    if (popupTimeout) clearTimeout(popupTimeout);
}

/* =========================
FLOATING ICON + PANEL
========================= */

function createFloatingIcon() {
    injectStyles();

    // Floating icon
    const icon = document.createElement("div");
    icon.id = "toxic-app-icon";
    icon.innerHTML = `🛡️<span class="icon-badge" style="display:none;">0</span>`;
    document.body.appendChild(icon);

    // Panel
    const panel = document.createElement("div");
    panel.id = "toxic-history-panel";
    panel.innerHTML = `
        <div class="panel-header">
            <div class="panel-header-title">🛡️ Comment History</div>
            <div class="panel-refresh-btn" id="panel-refresh-btn" title="Clear comment history">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            </div>
        </div>
        </div>
        <div class="panel-body" id="panel-body">
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                No comments intercepted yet.<br>Try posting a comment on this page.
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // Refresh button inside panel header
    document.getElementById("panel-refresh-btn").addEventListener("click", () => {
        const btn = document.getElementById("panel-refresh-btn");
        btn.classList.add("spinning");
        setTimeout(() => btn.classList.remove("spinning"), 600);
        commentHistory = [];
        selectedComment = null;
        updateBadge();
        renderPanel();
    });

    // Toggle panel on icon click
    icon.addEventListener("click", () => {
        panelOpen = !panelOpen;
        if (panelOpen) {
            panel.style.display = "flex";
            requestAnimationFrame(() => {
                panel.classList.add("open");
            });
            selectedComment = null;
            renderPanel();
        } else {
            panel.classList.remove("open");
            setTimeout(() => { panel.style.display = "none"; }, 350);
        }
    });
}

function updateBadge() {
    const badge = document.querySelector("#toxic-app-icon .icon-badge");
    if (!badge) return;
    const toxicCount = commentHistory.filter(c => c.label === "toxic").length;
    if (toxicCount > 0) {
        badge.style.display = "flex";
        badge.textContent = toxicCount;
    } else {
        badge.style.display = "none";
    }
}

function renderPanel() {
    const body = document.getElementById("panel-body");
    if (!body) return;

    if (selectedComment !== null) {
        renderRadarView(body, selectedComment);
    } else {
        renderCommentList(body);
    }
}

function renderCommentList(body) {
    if (commentHistory.length === 0) {
        body.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                No comments intercepted yet.<br>Try posting a comment on this page.
            </div>
        `;
        return;
    }

    let html = "";
    const reversed = [...commentHistory].reverse();
    reversed.forEach((c, idx) => {
        const realIdx = commentHistory.length - 1 - idx;
        const isToxic = c.label === "toxic";
        html += `
            <div class="comment-item" data-idx="${realIdx}">
                <div class="comment-dot ${isToxic ? 'toxic' : 'safe'}"></div>
                <div class="comment-text">${escapeHtml(c.text)}</div>
                <div class="comment-label ${isToxic ? 'toxic' : 'safe'}">${isToxic ? 'Toxic' : 'Safe'}</div>
            </div>
        `;
    });
    body.innerHTML = html;

    // Attach click handlers
    body.querySelectorAll(".comment-item").forEach(el => {
        el.addEventListener("click", () => {
            const idx = parseInt(el.getAttribute("data-idx"));
            selectedComment = idx;
            renderPanel();
        });
    });
}

function renderRadarView(body, idx) {
    const c = commentHistory[idx];
    if (!c) { selectedComment = null; renderCommentList(body); return; }

    const categories = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate'];
    const categoryLabels = ['Toxic', 'Severe Toxic', 'Obscene', 'Threat', 'Insult', 'Identity Hate'];
    const scores = categories.map(cat => (c.scores && c.scores[cat] !== undefined) ? c.scores[cat] : 0);
    const isToxic = c.label === "toxic";

    let scoresHtml = '';
    categories.forEach((cat, i) => {
        const val = (scores[i] * 100).toFixed(1);
        const isHigh = scores[i] > 0.5;
        scoresHtml += `
            <div class="radar-score-item">
                <div class="radar-score-val ${isHigh ? 'high' : ''}">${val}%</div>
                <div class="radar-score-label">${categoryLabels[i]}</div>
            </div>
        `;
    });

    body.innerHTML = `
        <div class="radar-view">
            <button class="radar-back-btn" id="radar-back">← Back</button>
            <div class="radar-comment-preview">
                ${escapeHtml(c.text)}
                <span class="preview-label ${isToxic ? 'toxic' : 'safe'}">${isToxic ? 'Toxic' : 'Safe'}</span>
            </div>
            <div class="radar-canvas-wrap">
                <canvas id="toxic-radar-chart" width="300" height="300"></canvas>
            </div>
            <div class="radar-scores">
                ${scoresHtml}
            </div>
        </div>
    `;

    document.getElementById("radar-back").addEventListener("click", () => {
        selectedComment = null;
        renderPanel();
    });

    setTimeout(() => drawRadarChart(categoryLabels, scores), 50);
}

function drawRadarChart(labels, values) {
    const canvas = document.getElementById("toxic-radar-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 110;
    const sides = labels.length;
    const angleStep = (Math.PI * 2) / sides;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw concentric grid rings with percentage labels
    const rings = 5;
    for (let r = 1; r <= rings; r++) {
        const ringRadius = (radius / rings) * r;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
            const angle = -Math.PI / 2 + angleStep * i;
            const x = centerX + Math.cos(angle) * ringRadius;
            const y = centerY + Math.sin(angle) * ringRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 + r * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fill innermost rings
        if (r <= 3) {
            ctx.fillStyle = `rgba(135, 206, 250, ${0.03 * r})`;
            ctx.fill();
        }

        // Ring percentage label on the top axis
        const pct = Math.round((r / rings) * 100);
        ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
        ctx.font = "500 9px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${pct}%`, centerX + 4, centerY - ringRadius);
    }

    // Draw axis lines
    for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + angleStep * i;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw the data polygon shadow/glow
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + angleStep * i;
        const val = Math.max(values[i], 0.02);
        const x = centerX + Math.cos(angle) * radius * val;
        const y = centerY + Math.sin(angle) * radius * val;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(135, 206, 250, 0.35)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw data points with value labels
    for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + angleStep * i;
        const val = Math.max(values[i], 0.02);
        const x = centerX + Math.cos(angle) * radius * val;
        const y = centerY + Math.sin(angle) * radius * val;

        // Dot
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = values[i] > 0.5 ? "#ef4444" : "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Value label next to dot
        const valPct = (values[i] * 100).toFixed(0);
        const labelOffsetX = Math.cos(angle) * 16;
        const labelOffsetY = Math.sin(angle) * 16;
        ctx.fillStyle = values[i] > 0.5 ? "#fca5a5" : "#93c5fd";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${valPct}%`, x + labelOffsetX, y + labelOffsetY);
    }

    // Draw axis labels
    for (let i = 0; i < sides; i++) {
        const angle = -Math.PI / 2 + angleStep * i;
        const labelDist = radius + 26;
        const x = centerX + Math.cos(angle) * labelDist;
        const y = centerY + Math.sin(angle) * labelDist;

        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i], x, y);
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/* =========================
INTERCEPTOR LOGIC
========================= */

function getPageTitle() {
    const host = location.hostname;
    if (host.includes("youtube")) {
        const el = document.querySelector("h1.ytd-watch-metadata yt-formatted-string") || document.querySelector("h1");
        return el?.innerText || document.title;
    }
    return document.title;
}

document.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (handleSubmissionAttempt(e)) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
}, true);

document.addEventListener('click', async (e) => {
    // Don't intercept clicks inside our own UI
    if (e.target.closest('#toxic-app-icon') || e.target.closest('#toxic-history-panel')) return;

    if (handleSubmissionAttempt(e)) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, true);

function handleSubmissionAttempt(e) {
    if (skipCheckForNextAction) {
        skipCheckForNextAction = false;
        return false;
    }

    if (isChecking) {
        return true;
    }

    let text = null;
    let targetEl = e.target;
    let isValidSubmit = false;
    let eventNode = targetEl;

    const host = location.hostname;

    if (host.includes("youtube")) {
        const btn = targetEl.closest('#submit-button');
        if (btn && btn.closest('ytd-commentbox')) {
            const input = btn.closest('ytd-commentbox').querySelector('#contenteditable-root');
            if (input) text = input.innerText || input.textContent;
            isValidSubmit = true;
            eventNode = btn;
        }
    }
    else if (host.includes("instagram")) {
        const btn = targetEl.closest('div[role="button"]');
        if (btn && btn.innerText && btn.innerText.trim().toLowerCase() === "post") {
            const form = btn.closest('form');
            if (form) {
                const input = form.querySelector('textarea, input[type="text"]');
                if (input) text = input.value;
            } else {
                const parent = btn.parentElement ? btn.parentElement.parentElement : null;
                if (parent) {
                    const input = parent.querySelector('textarea, input[type="text"]');
                    if (input) text = input.value || input.innerText;
                }
            }
            isValidSubmit = true;
            eventNode = btn;
        }
        else if (e.type === 'keydown' && e.key === 'Enter') {
            const input = targetEl.closest('textarea');
            if (input && input.placeholder && input.placeholder.toLowerCase().includes("comment")) {
                text = input.value;
                isValidSubmit = true;
                eventNode = input;
            }
        }
    }
    else if (host.includes("facebook")) {
        if (e.type === 'keydown' && e.key === 'Enter' && targetEl.closest('div[role="textbox"][contenteditable="true"]')) {
            text = targetEl.innerText || targetEl.textContent;
            isValidSubmit = true;
            eventNode = targetEl;
        }
        else if (e.type === 'click') {
            const btn = targetEl.closest('div[aria-label="Comment"], div[aria-label="Leave a comment"]');
            if (btn) {
                const container = btn.closest('form, [role="article"], [role="dialog"]') || document;
                const input = container.querySelector('div[role="textbox"][contenteditable="true"]');
                if (input) text = input.innerText || input.textContent;
                isValidSubmit = true;
                eventNode = btn;
            }
        }
    }

    if (isValidSubmit) {
        text = text ? text.trim() : "";
        if (text.length === 0) return false;

        console.log("🛡️ Intercepted comment submission:", text);

        isChecking = true;
        showPopup("Scanning Content", "Checking your comment against safety guidelines...", "loading");

        const contextTitle = getPageTitle();

        chrome.runtime.sendMessage({ action: "predict", text: text, context: contextTitle }, (res) => {
            isChecking = false;

            if (chrome.runtime.lastError || !res || res.error) {
                console.error("API Error - allowing comment through:", chrome.runtime.lastError || res);
                commentHistory.push({ text: text, label: "safe", scores: {}, time: Date.now() });
                updateBadge();
                if (panelOpen) renderPanel();
                removePopup();
                skipCheckForNextAction = true;
                reTriggerEvent(e, eventNode);
                return;
            }

            const label = (res.label || "").toLowerCase();
            const scores = res.raw?.scores || {};

            // Save to history with scores
            commentHistory.push({ text: text, label: label, scores: scores, time: Date.now() });
            updateBadge();
            if (panelOpen) renderPanel();

            // Save to local file via backend
            chrome.runtime.sendMessage({
                action: "save_comment",
                data: {
                    comment: text,
                    label: label,
                    scores: scores,
                    platform: location.hostname,
                    page_title: contextTitle
                }
            });

            if (label === "toxic") {
                showPopup("Comment Blocked", "Your message violates our safety policies and was not posted.", "toxic");
                popupTimeout = setTimeout(() => {
                    removePopup();
                }, 4000);
            } else {
                removePopup();
                skipCheckForNextAction = true;
                reTriggerEvent(e, eventNode);
            }
        });

        return true;
    }

    return false;
}

function reTriggerEvent(originalEvent, targetNode) {
    if (originalEvent.type === 'click') {
        targetNode.click();
    } else if (originalEvent.type === 'keydown') {
        const evt = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
        });
        targetNode.dispatchEvent(evt);
    }
}

/* =========================
INIT
========================= */
createFloatingIcon();