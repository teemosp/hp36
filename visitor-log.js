// ==================== visitor-log.js ====================
// Ghi nhận lượt truy cập - Apps Script tự lấy IP và vị trí

(function() {
    // ===== CẤU HÌNH: THAY URL WEB APP CỦA BẠN VÀO ĐÂY =====
    const LOG_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzY8kX6b0C9kiHHbc8fMex3ntYe6BFeVDkWAosoqp-U7Kl6YTap7zzL_iFPyza4MAKCAQ/exec";
    
    // ===== GHI NHẬN TRUY CẬP =====
    async function recordVisit() {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const lastLogDate = localStorage.getItem("lastVisitLogDate");
        
        // Chỉ ghi 1 lần mỗi ngày (có thể bỏ dòng này nếu muốn ghi mỗi lần)
        if (lastLogDate === todayStr) {
            console.log("📊 Đã ghi hôm nay, bỏ qua");
            return;
        }
        
        try {
            // Gửi request đơn giản - Apps Script sẽ tự lấy IP, User-Agent, vị trí
            await fetch(LOG_WEB_APP_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pageUrl: window.location.href,
                    referrer: document.referrer || "Direct",
                    timestamp: now.toISOString()
                })
            });
            
            localStorage.setItem("lastVisitLogDate", todayStr);
            console.log("✅ Đã ghi nhận truy cập lúc:", now.toLocaleString("vi-VN"));
            
        } catch (error) {
            console.error("❌ Lỗi ghi log:", error);
        }
    }
    
    // Tự động chạy khi trang tải
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
        recordVisit();
    }
})();
