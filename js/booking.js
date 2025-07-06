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
    const startTimeElem = document.getElementById('start-time');
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
     * 【新增】設定預設的開始與結束時間
     */
    function setDefaultTimes() {
        const now = new Date();
        
        // 1. 計算預設的開始時間 (下一個整點)
        const defaultStart = new Date(now.getTime() + 60 * 60 * 1000); // 先加一小時
        defaultStart.setMinutes(0); // 分鐘設為 00
        defaultStart.setSeconds(0); // 秒數設為 00
        defaultStart.setMilliseconds(0);

        // 2. 計算預設的結束時間 (開始時間再加兩小時)
        const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

        // 3. 將 Date 物件轉換成 datetime-local input 需要的格式 (YYYY-MM-DDTHH:mm)
        // new Date().toISOString() 的格式是 '2024-07-27T06:30:00.000Z'
        // 我們需要的是 '2024-07-27T14:30' (本地時間，且不要秒和毫秒)
        // 這需要一個輔助函式來轉換
        const toLocalISOString = (date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000; // 獲取本地時區偏移
            const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        };
        
        // 4. 設定到 input 的 value 中
        if (startTimeElem) {
            startTimeElem.value = toLocalISOString(defaultStart);
        }
        if (endTimeElem) {
            endTimeElem.value = toLocalISOString(defaultEnd);
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
        
        selectedStartTime = startTimeElem.value;
        selectedEndTime = endTimeElem.value;

        if (new Date(selectedEndTime) <= new Date(selectedStartTime)) {
            showMessage('結束時間必須晚于開始時間', 'error');
            return;
        }

        const params = {
            start: new Date(selectedStartTime).toISOString(),
            end: new Date(selectedEndTime).toISOString(),
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
            start: new Date(selectedStartTime).toISOString(),
            end: new Date(selectedEndTime).toISOString(),
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
