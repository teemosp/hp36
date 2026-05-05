// ==================== visitor-log.js ====================
const PROXY_URL = "https://script.google.com/macros/s/AKfycbxuf7yMNz4MrZ4ZK1Nuz5JHvZyV7ICp3XvkqC6dU6siZnn924XVxPuLUWZIW1lFLI5zdw/exec";

function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";
    
    return { browser, userAgent: ua };
}

async function updateCounterDisplay() {
    try {
        const response = await fetch(`${PROXY_URL}?sheet=VISIT_COUNTER`);
        const data = await response.json();
        
        const today = new Date().toISOString().split('T')[0];
        
        let todayCount = 0;
        let totalCount = 0;
        
        if (Array.isArray(data)) {
            data.forEach(row => {
                const count = parseInt(row["Số lượt truy cập"]) || 0;
                totalCount += count;
                if (row.Ngày === today) {
                    todayCount = count;
                }
            });
        }
        
        document.getElementById('todayCount').innerText = todayCount;
        document.getElementById('totalCount').innerText = totalCount;
        console.log("📊 Hôm nay:", todayCount, "| Tổng:", totalCount);
        
    } catch (error) {
        console.error("Lỗi lấy bộ đếm:", error);
    }
}

async function recordVisit() {
    const now = new Date();
    const browserInfo = getBrowserInfo();
    
    const visitData = {
        timestamp: now.toISOString(),
        datetime: now.toLocaleString("vi-VN"),
        browser: browserInfo.browser,
        userAgent: browserInfo.userAgent,
        pageUrl: window.location.href,
        referrer: document.referrer || "Direct"
    };
    
    console.log("📤 Gửi dữ liệu:", visitData);
    
    try {
        await fetch(PROXY_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitData)
        });
        
        console.log("✅ Đã ghi nhận truy cập");
        
        setTimeout(updateCounterDisplay, 1000);
        
    } catch (error) {
        console.error("❌ Lỗi gửi request:", error);
    }
}

// Cập nhật bộ đếm mỗi 30 giây
setInterval(updateCounterDisplay, 30000);

// Chạy khi tải trang
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        recordVisit();
        updateCounterDisplay();
    });
} else {
    recordVisit();
    updateCounterDisplay();
}
