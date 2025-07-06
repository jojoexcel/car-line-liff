/**
 * 檔案說明：預約借車頁面 (booking.html) 的主要邏輯。
 * 核心功能：使用 flatpickr.js 函式庫來提供統一格式的日期時間選擇器。
 * 版本：3.0 (flatpickr 整合版)
 */
document.addEventListener('DOMContentLoaded', async () => {
    // === 全域變數 ===
    let liffProfile = null;
    // 這兩個變數現在儲存的是由 flatpickr 回傳的、最原始的 JavaScript Date 物件
    let selectedStartTime = null;
    let selectedEndTime = null;

    // === DOM 元素快取 ===
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const timeForm = document.getElementById('time-form');
    const detailsForm = document.getElementById('details-form');
    const startTimeElem = document.getElementById('start-time');
    const endTimeElem = document.getElementById('end-time');
    const carListElem = document.getElementById('car-list');
    const messageBox = document.getElementById('message-box');

    /**
     * 在頁面上方顯示成功或失敗的訊息。
     */
    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    /**
     * 初始化 flatpickr 日期時間選擇器
     */
    function initializeDateTimePickers() {
        // 設定共用的選項
        const commonOptions = {
            enableTime: true,           // 啟用時間選擇功能
            dateFormat: "Y/m/d H:i",    // **核心：設定輸入框中「顯示」的格式**
            time_24hr: true,            // 強制使用 24 小時制
            locale: "zh_tw",            // 使用已載入的繁體中文語系
            minuteIncrement: 30,        // 分鐘的間隔為 30 分鐘
            minDate: "today"            // 只能選擇今天之後的日期
        };

        // 初始化「開始時間」選擇器
        flatpickr(startTimeElem, {
            ...commonOptions, // 展開並使用共用設定
            // 當使用者選擇了一個日期時間後，會觸發此函式
            onChange: function(selectedDates) {
                // selectedDates 是一個陣列，我們取第一個元素，它是一個 JS Date 物件
                selectedStartTime = selectedDates[0];
            }
        });

        // 初始化「結束時間」選擇器
        flatpickr(endTimeElem, {
            ...commonOptions,
            onChange: function(selectedDates) {
                selectedEndTime = selectedDates[0];
            }
        });
    }
    
    /**
     * 初始化頁面
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        // 初始化日期時間選擇器
        initializeDateTimePickers();
    }

    /**
     * 監聽步驟一（時間查詢）表單提交
     */
    timeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('', ''); 
        
        // 直接使用全域變數中儲存的 Date 物件進行判斷
        if (!selectedStartTime || !selectedEndTime) {
            showMessage('請選擇完整的開始與結束時間', 'error');
            return;
        }
        if (selectedEndTime <= selectedStartTime) {
            showMessage('結束時間必須晚于開始時間', 'error');
            return;
        }

        const params = {
            start: selectedStartTime.toISOString(),
            end: selectedEndTime.toISOString(),
        };

        const result = await callGasApi('getAvailableCars', params);

        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
            carListElem.innerHTML = '';
            result.data.forEach((car, index) => {
                const carItem = document.createElement('div');
                carItem.className = 'car-list-item';
                carItem.innerHTML = `
                    <input type="radio" id="car${index}" name="car" value="${car.plate}" required>
                    <label for="car${index}">${car.plate} (${car.spec})</label>
                `;
                carListElem.appendChild(carItem);
            });
            step1.classList.remove('active');
            step2.classList.add('active');
        } else if (result.status === 'success') {
            showMessage('抱歉，該時段已無可用車輛。', 'error');
        } else {
            showMessage(result.message || '查詢失敗', 'error');
        }
    });

    /**
     * 監聽步驟二（確認預約）表單提交
     */
    detailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(detailsForm);
        const selectedCarPlate = formData.get('car');
        
        if (!selectedCarPlate) {
            showMessage('請選擇一輛車！', 'error');
            return;
        }

        const params = {
            userId: liffProfile.userId,
            carPlate: selectedCarPlate,
            start: selectedStartTime.toISOString(), // 直接使用 Date 物件
            end: selectedEndTime.toISOString(),     // 直接使用 Date 物件
            reason: document.getElementById('reason').value,
            location: document.getElementById('location').value,
        };

        const result = await callGasApi('createReservation', params);

        if (result.status === 'success') {
            showMessage(result.message, 'success');
            detailsForm.style.display = 'none';
            setTimeout(() => {
                if (liff.isInClient()) {
                    liff.closeWindow();
                }
            }, 3000);
        } else {
            showMessage(result.message || '預約失敗', 'error');
        }
    });

    // === 程式進入點 ===
    initializePage();
});
