// js/booking.js
document.addEventListener('DOMContentLoaded', async () => {
    // 全域變數，儲存使用者和查詢狀態
    let liffProfile = null;
    let selectedStartTime = null;
    let selectedEndTime = null;

    // 取得 HTML 元素
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const timeForm = document.getElementById('time-form');
    const detailsForm = document.getElementById('details-form');
    const startTimeElem = document.getElementById('start-time');
    const endTimeElem = document.getElementById('end-time');
    const carListElem = document.getElementById('car-list');
    const messageBox = document.getElementById('message-box');

    // 顯示訊息
    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }
    
    // 初始化 LIFF
    liffProfile = await initializeLiff();
    if (!liffProfile) return;

    // 監聽步驟一（時間查詢）表單提交
    timeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('', ''); // 清空訊息
        
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

        if (result.status === 'success' && result.data.length > 0) {
            // 渲染可用車輛列表
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
            // 切換到步驟二
            step1.classList.remove('active');
            step2.classList.add('active');
        } else if (result.status === 'success' && result.data.length === 0) {
            showMessage('抱歉，該時段已無可用車輛。', 'error');
        } else {
            showMessage(result.message || '查詢失敗', 'error');
        }
    });

    // 監聽步驟二（確認預約）表單提交
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
            detailsForm.style.display = 'none'; // 隱藏表單
            setTimeout(() => {
                if (liff.isInClient()) {
                    liff.closeWindow();
                }
            }, 3000); // 3秒後自動關閉
        } else {
            showMessage(result.message || '預約失敗', 'error');
        }
    });
});
