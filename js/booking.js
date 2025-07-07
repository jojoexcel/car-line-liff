// js/booking.js (語法修正 + 結構優化版)

/**
 * booking.html 頁面的主初始化函式。
 * 這個函式將由 loader.js 在所有必要腳本載入後呼叫。
 */
async function initializeBookingPage() {
    console.log("Initializing Booking Page Logic...");

    // === 變數與 DOM 元素快取 ===
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

    // === 輔助函式 ===

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
     * 格式化並顯示時間預覽。
     */
    function updatePreview(isoDateTimeString, previewElement) {
        if (!previewElement) return;
        if (!isoDateTimeString) {
            previewElement.textContent = '';
            return;
        }
        try {
            const dateObj = new Date(isoDateTimeString);
            if (isNaN(dateObj.getTime())) {
                previewElement.textContent = '';
                return;
            }
            const yyyy = dateObj.getFullYear();
            const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const HH = String(dateObj.getHours()).padStart(2, '0');
            const mm = String(dateObj.getMinutes()).padStart(2, '0');
            previewElement.textContent = `您選擇的時間是：${yyyy}/${MM}/${dd} ${HH}:${mm}`;
        } catch (e) {
            previewElement.textContent = '無效的時間格式';
        }
    }

    // === 事件處理函式 ===

    /**
     * 處理步驟一（查詢可用車輛）的表單提交
     */
    async function handleTimeFormSubmit(e) {
        e.preventDefault();
        showMessage('', '');

        selectedStartTime = startTimeElem.value;
        selectedEndTime = endTimeElem.value;

        if (!selectedStartTime || !selectedEndTime) {
            showMessage('請選擇完整的開始與結束時間', 'error');
            return;
        }
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
    }

    /**
     * 處理步驟二（確認預約）的表單提交
     */
    async function handleDetailsFormSubmit(e) {
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
    }

    // === 初始化與事件綁定 ===
    try {
        liffProfile = await initializeLiff(); // initializeLiff 來自已載入的 main.js
        if (!liffProfile) return;

        // 綁定時間預覽事件
        if (startTimeElem) {
            startTimeElem.addEventListener('input', () => updatePreview(startTimeElem.value, startTimePreview));
        }
        if (endTimeElem) {
            endTimeElem.addEventListener('input', () => updatePreview(endTimeElem.value, endTimePreview));
        }

        // 綁定表單提交事件
        if (timeForm) {
            timeForm.addEventListener('submit', handleTimeFormSubmit);
        }
        if (detailsForm) {
            detailsForm.addEventListener('submit', handleDetailsFormSubmit);
        }

    } catch (e) {
        console.error("Initialization or event binding failed", e);
        showMessage('頁面初始化失敗', 'error');
    }
}