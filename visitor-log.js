// ==================== visitor-log.js ====================
// Lấy IP thật từ trình duyệt và gửi lên Apps Script

(function() {
    // ===== CẤU HÌNH =====
    const LOG_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzY8kX6b0C9kiHHbc8fMex3ntYe6BFeVDkWAosoqp-U7Kl6YTap7zzL_iFPyza4MAKCAQ/exec";
    
    // ===== HÀM LẤY IP THẬT =====
    async function getRealIP() {
        // Thử API thứ nhất: ipapi.co (ưu tiên)
        try {
            const response = await fetch('https://ipapi.co/json/', {
                mode: 'cors',
                cache: 'no-cache'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.ip) {
                    return {
                        ip: data.ip,
                        city: data.city || "Unknown",
                        region: data.region || "Unknown",
                        country: data.country_name || "Unknown",
                        latitude: data.latitude || null,
                        longitude: data.longitude || null
                    };
                }
            }
        } catch (e) { console.log("ipapi.co failed:", e); }
        
        // Thử API thứ hai: ip-api.com
        try {
            const response = await fetch('https://ip-api.com/json/', {
                mode: 'cors'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        ip: data.query,
                        city: data.city || "Unknown",
                        region: data.regionName || "Unknown",
                        country: data.country || "Unknown",
                        latitude: data.lat || null,
                        longitude: data.lon || null
                    };
                }
            }
        } catch (e) { console.log("ip-api.com failed:", e); }
        
        // Thử API thứ ba: ipwho.is
        try {
            const response = await fetch('https://ipwho.is/');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return {
                        ip: data.ip,
                        city: data.city || "Unknown",
                        region: data.region || "Unknown",
                        country: data.country || "Unknown",
                        latitude: data.latitude || null,
                        longitude: data.longitude || null
                    };
                }
            }
        } catch (e) { console.log("ipwho.is failed:", e); }
        
        // Nếu không lấy được IP
        return {
            ip: "Unable to fetch",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            latitude: null,
            longitude: null
        };
    }
    
    // ===== LẤY THÔNG TIN TRÌNH DUYỆT =====
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = "Unknown";
        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Edg")) browser = "Edge";
        else if (ua.includes("Opera")) browser = "Opera";
        
        let device = "Desktop";
        if (/(iPhone|iPad|iPod)/i.test(ua)) device = "iOS";
        else if (/Android/i.test(ua)) device = "Android";
        else if (/Mobile/i.test(ua)) device = "Mobile";
        
        return { browser, device, userAgent: ua.substring(0, 500) };
    }
    
    // ===== GỬI DỮ LIỆU LÊN APPS SCRIPT =====
    async function sendToAppsScript(visitData) {
        try {
            // Sử dụng mode: 'no-cors' để tránh lỗi CORS
            await fetch(LOG_WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            console.log("✅ Đã gửi dữ liệu truy cập");
            return true;
        } catch (error) {
            console.error("❌ Lỗi gửi:", error);
            return false;
        }
    }
    
    // ===== HÀM CHÍNH =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        // Chỉ ghi 1 lần mỗi ngày (có thể bỏ nếu muốn ghi mỗi lần)
        if (lastLogDate === todayStr) {
            console.log("📊 Đã ghi hôm nay, bỏ qua");
            return;
        }
        
        console.log("🌐 Đang lấy IP và vị trí...");
        
        // Lấy IP và vị trí
        const geo = await getRealIP();
        const browserInfo = getBrowserInfo();
        
        // Tạo dữ liệu gửi đi
        const visitData = {
            timestamp: now.toISOString(),
            datetime: now.toLocaleString("vi-VN"),
            ip: geo.ip,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            latitude: geo.latitude,
            longitude: geo.longitude,
            browser: browserInfo.browser,
            device: browserInfo.device,
            userAgent: browserInfo.userAgent,
            referrer: document.referrer || "Direct",
            pageUrl: window.location.href
        };
        
        console.log("📊 Dữ liệu sẽ gửi:", visitData);
        
        // Gửi lên Apps Script
        await sendToAppsScript(visitData);
        
        // Lưu lại ngày đã ghi
        localStorage.setItem("lastVisitLogDate", todayStr);
    }
    
    // Tự động chạy khi trang tải
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
        recordVisit();
    }
})();
