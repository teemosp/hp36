// ==================== visitor-log.js (ĐÃ SỬA) ====================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyMaY4wcPcdCO4fLIoSl0BCX1Ze5Okja0vplkZ3V06hAsB81MhLhNiDLMnqXIl4ZNSSHw/exec";

// ===== LẤY IP THẬT (Dùng nhiều API dự phòng) =====
async function getRealIP() {
    // API 1: ipwho.is (hỗ trợ CORS tốt)
    try {
        const response = await fetch('https://ipwho.is/');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                return {
                    ip: data.ip,
                    city: data.city || "Unknown",
                    region: data.region || "Unknown",
                    country: data.country || "Unknown"
                };
            }
        }
    } catch (e) { console.log("ipwho.is failed:", e); }
    
    // API 2: ipapi.co
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            if (data.ip) {
                return {
                    ip: data.ip,
                    city: data.city || "Unknown",
                    region: data.region || "Unknown",
                    country: data.country_name || "Unknown"
                };
            }
        }
    } catch (e) { console.log("ipapi.co failed:", e); }
    
    // Fallback - không lấy được IP
    return { ip: "Unknown", city: "Unknown", region: "Unknown", country: "Unknown" };
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
        const response = await fetch(WEB_APP_URL);
        const text = await response.text();
        const stats = JSON.parse(text);
        
        if (stats.today !== undefined) {
            document.getElementById('todayCount').innerText = stats.today || 0;
            document.getElementById('monthCount').innerText = stats.month || 0;
            document.getElementById('yearCount').innerText = stats.year || 0;
            document.getElementById('totalCount').innerText = stats.total || 0;
            console.log("📊 Bộ đếm:", stats);
        }
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
    
    console.log("🌐 Đang lấy IP...");
    const geo = await getRealIP();
    const browserInfo = getBrowserInfo();
    
    const visitData = {
        timestamp: now.toISOString(),
        datetime: now.toLocaleString("vi-VN"),
        ip: geo.ip,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        browser: browserInfo.browser,
        device: browserInfo.device,
        userAgent: browserInfo.userAgent,
        referrer: document.referrer || "Direct",
        pageUrl: window.location.href
    };
    
    console.log("📤 Gửi dữ liệu:", visitData);
    
    try {
        // Dùng mode: 'no-cors' để tránh lỗi CORS (nhưng sẽ không nhận được phản hồi)
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitData)
        });
        
        localStorage.setItem("lastVisitLogDate", todayStr);
        console.log("✅ Đã gửi yêu cầu ghi nhận truy cập từ IP:", geo.ip);
        
        // Đợi 1 giây rồi cập nhật bộ đếm
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
