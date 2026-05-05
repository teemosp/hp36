// ==================== visitor-log.js ====================
// Tự động lấy IP và cập nhật bộ đếm

(function() {
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzY8kX6b0C9kiHHbc8fMex3ntYe6BFeVDkWAosoqp-U7Kl6YTap7zzL_iFPyza4MAKCAQ/exec";
    
    // ===== LẤY IP THẬT =====
    async function getRealIP() {
        try {
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
        } catch (e) { console.log("Lỗi lấy IP:", e); }
        
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
    
    // ===== CẬP NHẬT GIAO DIỆN BỘ ĐẾM =====
    async function updateCounterDisplay() {
        try {
            const response = await fetch(WEB_APP_URL);
            const stats = await response.json();
            
            document.getElementById('todayCount').innerText = stats.today || 0;
            document.getElementById('monthCount').innerText = stats.month || 0;
            document.getElementById('yearCount').innerText = stats.year || 0;
            document.getElementById('totalCount').innerText = stats.total || 0;
            
            console.log("📊 Bộ đếm:", stats);
        } catch (error) {
            console.error("Lỗi lấy bộ đếm:", error);
        }
    }
    
    // ===== GHI NHẬN TRUY CẬP =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        // Chỉ ghi 1 lần mỗi ngày cho mỗi thiết bị/IP
        if (lastLogDate === todayStr) {
            console.log("📊 Đã ghi hôm nay, chỉ cập nhật bộ đếm");
            await updateCounterDisplay();
            return;
        }
        
        console.log("🌐 Đang ghi nhận truy cập...");
        
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
        
        try {
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            
            localStorage.setItem("lastVisitLogDate", todayStr);
            console.log("✅ Đã ghi nhận truy cập từ IP:", geo.ip);
            
            // Cập nhật bộ đếm sau khi ghi
            setTimeout(updateCounterDisplay, 1000);
            
        } catch (error) {
            console.error("❌ Lỗi:", error);
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
})();
