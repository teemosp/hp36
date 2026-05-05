// ==================== visitor-log.js ====================
(function() {
    // THAY URL CỦA BẠN VÀO ĐÂY
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxgQjmZzmmlVTja-ub4q5N3GFU6l6HrBoQlmbUjmN2lbUtLAef46sjpmpvv-_scYK2nXQ/exec";
    
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
        } catch (e) { console.log("Lỗi ip-api:", e); }
        
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
    
    // ===== CẬP NHẬT HIỂN THỊ BỘ ĐẾM =====
    async function updateCounterDisplay() {
        try {
            const response = await fetch(WEB_APP_URL);
            const text = await response.text();
            
            // Thử parse JSON
            let stats;
            try {
                stats = JSON.parse(text);
            } catch (e) {
                console.error("JSON parse error:", text.substring(0, 100));
                return;
            }
            
            if (stats.today !== undefined) {
                document.getElementById('todayCount').innerText = stats.today || 0;
                document.getElementById('monthCount').innerText = stats.month || 0;
                document.getElementById('yearCount').innerText = stats.year || 0;
                document.getElementById('totalCount').innerText = stats.total || 0;
                console.log("📊 Bộ đếm:", stats);
            } else if (stats.error) {
                console.error("Lỗi từ server:", stats.error);
            }
        } catch (error) {
            console.error("Lỗi lấy bộ đếm:", error);
        }
    }
    
    // ===== GHI NHẬN TRUY CẬP =====
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
            const response = await fetch(WEB_APP_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            
            const result = await response.json();
            console.log("✅ Kết quả:", result);
            
            if (result.status === "success") {
                localStorage.setItem("lastVisitLogDate", todayStr);
                console.log("✅ Đã ghi nhận truy cập từ IP:", geo.ip);
            } else {
                console.error("❌ Lỗi:", result.message);
            }
            
            // Cập nhật bộ đếm sau khi ghi
            await updateCounterDisplay();
            
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
})();
