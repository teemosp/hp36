// ==================== visitor-log.js (ĐÃ SỬA - HOẠT ĐỘNG TỐT HƠN) ====================
(function() {
    // CẤU HÌNH - THAY URL WEB APP CỦA BẠN VÀO ĐÂY
    const LOG_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAsL-76qd12IxyqkeSWlG17kZ05f4x9jDrbCALhFIhSEmLICenfBx0UaabsXxpG3VKZw/exec";
    
    // ===== LẤY IP VÀ VỊ TRÍ ĐỊA LÝ (Dùng nhiều API dự phòng) =====
    async function getGeoLocation() {
        // Thử API ip-api.com (hỗ trợ CORS tốt)
        try {
            const response = await fetch("https://ip-api.com/json/");
            if (response.ok) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        ip: data.query || "Unknown",
                        city: data.city || "Unknown",
                        region: data.regionName || "Unknown",
                        country: data.country || "Unknown"
                    };
                }
            }
        } catch (e) { console.log("ip-api.com failed:", e); }
        
        // Thử API ipwho.is
        try {
            const response = await fetch("https://ipwho.is/");
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return {
                        ip: data.ip || "Unknown",
                        city: data.city || "Unknown",
                        region: data.region || "Unknown",
                        country: data.country || "Unknown"
                    };
                }
            }
        } catch (e) { console.log("ipwho.is failed:", e); }
        
        // Thử API ipapi.co
        try {
            const response = await fetch("https://ipapi.co/json/");
            if (response.ok) {
                const data = await response.json();
                if (data.ip && data.ip !== "unknown") {
                    return {
                        ip: data.ip || "Unknown",
                        city: data.city || "Unknown",
                        region: data.region || "Unknown",
                        country: data.country_name || "Unknown"
                    };
                }
            }
        } catch (e) { console.log("ipapi.co failed:", e); }
        
        // Nếu tất cả đều thất bại
        return {
            ip: "Unknown (CORS blocked)",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown"
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
    
    // ===== GHI VÀO GOOGLE SHEETS =====
    async function logVisitToSheet(visitData) {
        if (LOG_WEB_APP_URL.includes("YOUR_SCRIPT_ID")) {
            console.log("⚠️ Chưa cấu hình LOG_WEB_APP_URL");
            return;
        }
        try {
            await fetch(LOG_WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            console.log("✅ Đã ghi nhận truy cập:", visitData.datetime);
        } catch (error) {
            console.error("❌ Lỗi ghi log:", error);
        }
    }
    
    // ===== HÀM CHÍNH =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        if (lastLogDate === todayStr) {
            console.log("📊 Đã ghi hôm nay, bỏ qua");
            return;
        }
        
        const browserInfo = getBrowserInfo();
        const geo = await getGeoLocation();
        
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
        
        await logVisitToSheet(visitData);
        localStorage.setItem("lastVisitLogDate", todayStr);
        console.log("📊 Thông tin đã lưu:", visitData);
    }
    
    // Tự động chạy
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
        recordVisit();
    }
})();
