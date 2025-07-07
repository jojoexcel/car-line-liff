/**
 * 檔案說明：預約借車頁面 (booking.html) 的主要邏輯。
 * 核心功能：使用 flatpickr.js 函式庫來提供統一格式的日期時間選擇器。
 * 版本：3.1 (整合版本號載入器)
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
    const carListElem = document.getElementById('car-list');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    function initializeDateTimePickers() {
        if (typeof flatpickr === 'undefined') {
            console.error("flatpickr 函式庫未載入！");
            alert("日期選擇器元件載入失敗，請刷新頁面。");
            return;
        }

        const commonOptions = {
            enableTime: true,
            dateFormat: "Y/m/d H:i",
            time_24hr: true,
            locale: "zh_tw",
            minuteIncrement: 30,
            minDate: "today"
        };

        flatpickr(startTimeElem, {
            ...commonOptions,
            onChange: function(selectedDates) {
                selectedStartTime = selectedDates[0];
            }
        });

        flatpickr(endTimeElem, {
            ...commonOptions,
            onChange: function(selectedDates) {
                selectedEndTime = selectedDates[0];
            }
        });
    }
    
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        initializeDateTimePickers();
    }

    timeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showMessage('', ''); 
        
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
            start: selectedStartTime.toISOString(),
            end: selectedEndTime.toISOString(),
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

    initializePage();
});
