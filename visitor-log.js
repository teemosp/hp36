// ==================== visitor-log.js ====================
// File riêng để ghi nhận chi tiết lượt truy cập
// NHÚNG VÀO INDEX: <script src="visitor-log.js"></script>

(function() {
    // ===== CẤU HÌNH =====
    // ⚠️ QUAN TRỌNG: Sau khi tạo Google Apps Script, thay URL này
    const LOG_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyAsL-76qd12IxyqkeSWlG17kZ05f4x9jDrbCALhFIhSEmLICenfBx0UaabsXxpG3VKZw/exec";
    
    // ID Google Sheets của bạn (để tạo sheet LOG_TRUY_CAP tự động)
    const SPREADSHEET_ID = "17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY";
    const LOG_SHEET_NAME = "LOG_TRUY_CAP";
    
    // ===== HÀM LẤY THÔNG TIN TRÌNH DUYỆT =====
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
    
    // ===== LẤY IP VÀ VỊ TRÍ ĐỊA LÝ =====
    async function getGeoLocation() {
        try {
            const response = await fetch("https://ipapi.co/json/");
            const data = await response.json();
            return {
                ip: data.ip || "Unknown",
                city: data.city || "Unknown",
                region: data.region || "Unknown",
                country: data.country_name || "Unknown"
            };
        } catch (error) {
            console.error("Lỗi lấy geo:", error);
            return { ip: "Unknown", city: "Unknown", region: "Unknown", country: "Unknown" };
        }
    }
    
    // ===== GHI VÀO GOOGLE SHEETS (qua Web App) =====
    async function logVisitToSheet(visitData) {
        if (LOG_WEB_APP_URL.includes("YOUR_SCRIPT_ID")) {
            console.log("⚠️ [Visitor Log] Chưa cấu hình LOG_WEB_APP_URL, dữ liệu không được ghi");
            console.log("📊 Dữ liệu đáng lẽ được ghi:", visitData);
            return;
        }
        try {
            await fetch(LOG_WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(visitData)
            });
            console.log("✅ [Visitor Log] Đã ghi nhận truy cập:", visitData.datetime);
        } catch (error) {
            console.error("❌ [Visitor Log] Lỗi ghi log:", error);
        }
    }
    
    // ===== HÀM CHÍNH: GHI NHẬN TRUY CẬP =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        // Chỉ ghi 1 lần mỗi ngày (tránh spam)
        if (lastLogDate === todayStr) {
            console.log("📊 [Visitor Log] Đã ghi hôm nay, bỏ qua");
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
        console.log("📊 [Visitor Log] Đã lưu thông tin truy cập");
    }
    
    // Tự động chạy khi trang tải
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
        recordVisit();
    }
})();
