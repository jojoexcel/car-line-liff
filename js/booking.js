/**
 * 檔案說明：預約借車頁面 (booking.html) 的主要邏輯。
 * 核心功能：使用 flatpickr.js 函式庫來提供統一格式的日期時間選擇器。
 * 版本：3.2 (flatpickr + loader 整合最終版)
 */
async function initializeBookingPage() {
    console.log("Initializing Booking Page with flatpickr...");

    // === 變數與 DOM ===
    let liffProfile = null;
    let selectedStartTime = null;
    let selectedEndTime = null;

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const timeForm = document.getElementById('time-form');
    const detailsForm = document.getElementById('details-form');
    const startTimeElem = document.getElementById('start-time');
    const endTimeElem = document.getElementById('end-time');
    const carListElem = document.getElementById('car-list');

    // === 輔助函式 ===
    function initializeDateTimePickers() {
        if (typeof flatpickr === 'undefined') {
            showModalAlert("日期選擇器元件載入失敗！請檢查網路連線或刷新頁面。", "錯誤");
            return;
        }
        const commonOptions = {
            enableTime: true,
            dateFormat: "Y/m/d H:i",
            time_24hr: true,
            locale: "zh_tw",
            minuteIncrement: 30,
            minDate: "today",
            disableMobile: "true"
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

    // === 事件處理函式 ===
    async function handleTimeFormSubmit(e) {
        e.preventDefault();
        if (!selectedStartTime || !selectedEndTime) {
            showModalAlert('請選擇完整的開始與結束時間');
            return;
        }
        if (selectedEndTime <= selectedStartTime) {
            showModalAlert('結束時間必須晚于開始時間');
            return;
        }
        const result = await callGasApi('getAvailableCars', {
            start: selectedStartTime.toISOString(),
            end: selectedEndTime.toISOString(),
        });
        if (result.status === 'success' && Array.isArray(result.data)) {
            if (result.data.length > 0) {
                carListElem.innerHTML = '';
                result.data.forEach((car, index) => {
                    const item = document.createElement('div');
                    item.className = 'car-list-item';
                    item.innerHTML = `<input type="radio" id="car${index}" name="car" value="${car.plate}" required><label for="car${index}">${car.plate} (${car.spec})</label>`;
                    carListElem.appendChild(item);
                });
                step1.classList.remove('active');
                step2.classList.add('active');
            } else {
                showModalAlert('抱歉，該時段已無可用車輛。', '提示');
            }
        } else {
            showModalAlert(result.message || '查詢失敗', '錯誤');
        }
    }

    async function handleDetailsFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(detailsForm);
        const selectedCarPlate = formData.get('car');
        if (!selectedCarPlate) {
            showModalAlert('請選擇一輛車！');
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
            showModalAlert(result.message);
            if (detailsForm) detailsForm.style.display = 'none';
            setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000);
        } else {
            showModalAlert(result.message || '預約失敗', '錯誤');
        }
    }

    // === 初始化與事件綁定 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;
        initializeDateTimePickers();
        if (timeForm) timeForm.addEventListener('submit', handleTimeFormSubmit);
        if (detailsForm) detailsForm.addEventListener('submit', handleDetailsFormSubmit);
    } catch (e) {
        console.error("Booking page initialization failed", e);
        showModalAlert('頁面初始化失敗', '錯誤');
    }
}