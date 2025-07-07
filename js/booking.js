/**
 * 檔案說明：預約借車頁面 (booking.html) 的主要邏輯。
 * 核心功能：使用原生 datetime-local 輸入框，並在旁邊提供 24 小時制的時間格式預覽。
 * 版本：2.1 (整合版本號載入器)
 */
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
    const startTimePreview = document.getElementById('start-time-preview');
    const endTimePreview = document.getElementById('end-time-preview');
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
     * 格式化並顯示時間預覽的輔助函式。
     * @param {string} isoDateTimeString - 從 input.value 讀取的值，例如 '2024-07-27T15:30'
     * @param {HTMLElement} previewElement - 要更新內容的 div 元素
     */
    function updatePreview(isoDateTimeString, previewElement) {
        if (!previewElement) return;

        if (!isoDateTimeString) {
            previewElement.textContent = ''; // 如果沒有值，就清空預覽
            return;
        }
        try {
            const dateObj = new Date(isoDateTimeString);
            if (isNaN(dateObj.getTime())) {
                previewElement.textContent = '';
                return;
            }
            
            // 手動組合 yyyy/MM/dd HH:mm (24小時制) 格式
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

    /**
     * 初始化頁面
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        
        // 為兩個時間輸入框綁定 'input' 事件監聽器
        if (startTimeElem) {
            startTimeElem.addEventListener('input', () => updatePreview(startTimeElem.value, startTimePreview));
        }
        if (endTimeElem) {
            endTimeElem.addEventListener('input', () => updatePreview(endTimeElem.value, endTimePreview));
        }
    }

    /**
     * 監聽步驟一（時間查詢）表單提交
     */
    timeForm.addEventListener('submit', async (e) => {
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
