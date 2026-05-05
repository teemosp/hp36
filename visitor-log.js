// ==================== visitor-log.js (SỬA LỖI) ====================
(function() {
    // THAY URL CỦA BẠN VÀO ĐÂY
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzY8kX6b0C9kiHHbc8fMex3ntYe6BFeVDkWAosoqp-U7Kl6YTap7zzL_iFPyza4MAKCAQ/exec";
    
    // ===== LẤY IP THẬT =====
    async function getRealIP() {
        try {
            // Dùng ip-api.com (hỗ trợ CORS tốt)
            const response = await fetch('https://ip-api.com/json/');
            if (response.ok) {
                const data = await response.json();
                if (data.status === "success") {
                    return {
                        ip: data.query,
                        city: data.city || "Unknown",
                        region: data.regionName || "Unknown",
                        country: data.country || "Unknown"
                    };
                }
            }
        } catch (e) { console.log("Lỗi ip-api:", e); }
        
        // Fallback
        return { ip: "Unknown", city: "Unknown", region: "Unknown", country: "Unknown" };
    }
    
    // ===== LẤY THÔNG TIN TRÌNH DUYỆT =====
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
    
    // ===== GHI NHẬN TRUY CẬP =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        // Chỉ ghi 1 lần mỗi ngày
        if (lastLogDate === todayStr) {
            console.log("📊 Đã ghi hôm nay, bỏ qua");
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
        
        console.log("📤 Đang gửi dữ liệu:", visitData);
        
        try {
            // Bỏ mode: "no-cors" để nhận phản hồi
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            
            const result = await response.json();
            console.log("✅ Kết quả từ server:", result);
            
            if (result.status === "success") {
                localStorage.setItem("lastVisitLogDate", todayStr);
                console.log("✅ Đã ghi nhận truy cập từ IP:", geo.ip);
            } else {
                console.error("❌ Server báo lỗi:", result.message);
            }
            
        } catch (error) {
            console.error("❌ Lỗi gửi request:", error);
        }
    }
    
    // Chạy khi tải trang
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
        recordVisit();
    }
})();
