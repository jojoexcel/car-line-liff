// js/booking.js (預設時間優化版)

document.addEventListener('DOMContentLoaded', async () => {
    // === 全域變數 ===
    let liffProfile = null;
    let selectedStartTime = null;
    let selectedEndTime = null;

     // === DOM 元素快取 ===
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const timeForm = document.getElementById('time-form');
    const detailsForm = document.getElementById('details-form');
    // 【修改】獲取新的 date 和 time 輸入框
    const startDateElem = document.getElementById('start-date');
    const startTimeElem = document.getElementById('start-time');
    const endDateElem = document.getElementById('end-date');
    const endTimeElem = document.getElementById('end-time');
    const carListElem = document.getElementById('car-list');
    const messageBox = document.getElementById('message-box');
    /**
     * 顯示訊息
     */
    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

/**
     * 【新增】當日期選擇後，自動設定結束日期為同一天
     */
    function syncDates() {
        if (startDateElem.value && !endDateElem.value) {
            endDateElem.value = startDateElem.value;
        }
    }
    
    /**
     * 初始化頁面
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        
        // 【新增】為開始日期輸入框綁定事件
        if(startDateElem) {
            startDateElem.addEventListener('change', syncDates);
        }
    }
   
    
    /**
     * 初始化頁面
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        // 【新增】在初始化時呼叫設定預設時間的函式
        setDefaultTimes();
    }

    /**
     * 監聽步驟一（時間查詢）表單提交
     */
    timeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('', ''); 
        
        // 【關鍵修改】從兩個輸入框讀取值，並組合成標準格式
        const startDateValue = startDateElem.value;
        const startTimeValue = startTimeElem.value;
        const endDateValue = endDateElem.value;
        const endTimeValue = endTimeElem.value;

        // 組合，例如 "2024-07-27" + "T" + "15:30" -> "2024-07-27T15:30"
        combinedStartTime = `${startDateValue}T${startTimeValue}`;
        combinedEndTime = `${endDateValue}T${endTimeValue}`;

        if (new Date(combinedEndTime) <= new Date(combinedStartTime)) {
            showMessage('結束時間必須晚于開始時間', 'error');
            return;
        }

        const params = {
            start: new Date(combinedStartTime).toISOString(),
            end: new Date(combinedEndTime).toISOString(),
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
            // start: new Date(selectedStartTime).toISOString(),
            // end: new Date(selectedEndTime).toISOString(),
                        start: new Date(combinedStartTime).toISOString(), // 使用組合後的時間
            end: new Date(combinedEndTime).toISOString(),     // 使用組合後的時間
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
