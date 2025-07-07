// js/booking.js (模組化版)

/**
 * booking.html 頁面的主初始化函式。
 * 這個函式將由 loader.js 在所有必要腳本載入後呼叫。
 */
async function initializeBookingPage() {
    console.log("Initializing Booking Page Logic...");

    // === 全域變數和 DOM 元素快取 (移到函式內部) ===
    let liffProfile = null;
    let selectedStartTime = null;
    let selectedEndTime = null;

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const timeForm = document.getElementById('time-form');
    const detailsForm = document.getElementById('details-form');
    const startTimeElem = document.getElementById('start-time');
    const endTimeElem = document.getElementById('end-time');
    const startTimePreview = document.getElementById('start-time-preview');
    const endTimePreview = document.getElementById('end-time-preview');
    const carListElem = document.getElementById('car-list');
    const messageBox = document.getElementById('message-box');

    // --- 所有輔助函式 (showMessage, updatePreview) 放在這裡 ---
    function showMessage(text, type) { /* ... */ }
    function updatePreview(isoDateTimeString, previewElement) { /* ... */ }

    // --- 初始化 LIFF 並綁定事件 ---
    try {
        liffProfile = await initializeLiff(); // initializeLiff 來自已載入的 main.js
        if (!liffProfile) return;
        
        if (startTimeElem) {
            startTimeElem.addEventListener('input', () => updatePreview(startTimeElem.value, startTimePreview));
        }
        if (endTimeElem) {
            endTimeElem.addEventListener('input', () => updatePreview(endTimeElem.value, endTimePreview));
        }
    } catch (e) {
        console.error("Initialization or event binding failed", e);
        showMessage('頁面初始化失敗', 'error');
    }

    // --- 表單提交事件監聽器 ---
    if (timeForm) {
        timeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (查詢車輛的邏輯不變) ...
        });
    }

    if (detailsForm) {
        detailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (確認預約的邏輯不變) ...
        });
    }
}
