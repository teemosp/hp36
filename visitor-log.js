// ==================== visitor-log.js ====================
const PROXY_URL = "https://script.google.com/macros/s/AKfycbyrAuBWt4v77hURogvOCwvktfj1Gd7KhtlIOjGMjhY5ikN3JOLYaNckTWtzSAQ7e28rTQ/exec";

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";
    
    let device = "Desktop";
    if (/(iPhone|iPad|iPod)/i.test(ua)) device = "iOS";
    else if (/Android/i.test(ua)) device = "Android";
    else if (/Mobile/i.test(ua)) device = "Mobile";
    
    return { browser, device, userAgent: ua };
}

async function recordVisit() {
    const browserInfo = getBrowserInfo();
    
    const visitData = {
        browser: browserInfo.browser,
        device: browserInfo.device,
        userAgent: browserInfo.userAgent,
        pageUrl: window.location.href,
        referrer: document.referrer || "Direct",
        timestamp: new Date().toISOString()
    };
    
    console.log("📤 Gửi dữ liệu:", visitData);
    
    try {
        await fetch(PROXY_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitData)
        });
        console.log("✅ Đã gửi yêu cầu ghi log");
    } catch (error) {
        console.error("❌ Lỗi:", error);
    }
}

// Chạy khi tải trang
window.addEventListener('load', recordVisit);
