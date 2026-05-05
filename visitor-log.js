// ==================== visitor-log.js (Bỏ lấy IP) ====================
const PROXY_URL = "https://script.google.com/macros/s/AKfycbwbyKlTjhQMDFTHHOw_LTNoovVCRJjqZ6NXeFDJjlyvpLF_6fNZtjOex3pLhkr547nh-Q/exec";

// ===== BỎ LẤY IP, DÙNG IP MẶC ĐỊNH =====
async function getRealIP() {
    // Không gọi API bên ngoài, trả về IP mặc định
    return {
        ip: "Visited from web",
        city: "Unknown",
        region: "Unknown",
        country: "Unknown"
    };
}

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

async function updateCounterDisplay() {
    try {
        const response = await fetch(`${PROXY_URL}?sheet=VISIT_COUNTER`);
        const data = await response.json();
        
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = today.substring(0, 7);
        const currentYear = today.substring(0, 4);
        
        let todayCount = 0, monthCount = 0, yearCount = 0, totalCount = 0;
        
        if (Array.isArray(data)) {
            data.forEach(row => {
                const date = row.Ngày;
                if (date === today) todayCount++;
                if (date && date.startsWith(currentMonth)) monthCount++;
                if (date && date.startsWith(currentYear)) yearCount++;
                totalCount++;
            });
        }
        
        document.getElementById('todayCount').innerText = todayCount;
        document.getElementById('monthCount').innerText = monthCount;
        document.getElementById('yearCount').innerText = yearCount;
        document.getElementById('totalCount').innerText = totalCount;
        console.log("📊 Bộ đếm:", { today: todayCount, month: monthCount, year: yearCount, total: totalCount });
        
    } catch (error) {
        console.error("Lỗi lấy bộ đếm:", error);
    }
}

async function recordVisit() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastLogDate = localStorage.getItem("lastVisitLogDate");
    
    if (lastLogDate === todayStr) {
        console.log("📊 Đã ghi hôm nay, chỉ cập nhật bộ đếm");
        await updateCounterDisplay();
        return;
    }
    
    // Tạo ID duy nhất cho phiên truy cập
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const geo = await getRealIP();
    const browserInfo = getBrowserInfo();
    
    const visitData = {
        timestamp: now.toISOString(),
        datetime: now.toLocaleString("vi-VN"),
        ip: `Session_${sessionId}`,
        city: "Web Visitor",
        region: browserInfo.device,
        country: browserInfo.browser,
        browser: browserInfo.browser,
        device: browserInfo.device,
        userAgent: browserInfo.userAgent,
        referrer: document.referrer || "Direct",
        pageUrl: window.location.href
    };
    
    console.log("📤 Gửi dữ liệu:", visitData);
    
    try {
        await fetch(PROXY_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitData)
        });
        
        localStorage.setItem("lastVisitLogDate", todayStr);
        console.log("✅ Đã gửi yêu cầu ghi nhận truy cập");
        
        setTimeout(updateCounterDisplay, 1000);
        
    } catch (error) {
        console.error("❌ Lỗi gửi request:", error);
    }
}

setInterval(updateCounterDisplay, 30000);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        recordVisit();
        updateCounterDisplay();
    });
} else {
    recordVisit();
    updateCounterDisplay();
}
