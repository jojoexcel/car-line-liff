// js/vehicle-schedule.js
async function initializeVehicleSchedulePage() {
    // --- 權限驗證 ---
    const liffProfile = await initializeLiff();
    if (!liffProfile) {
        // 如果 LIFF 初始化失敗，還是要處理一下
        document.getElementById('auth-panel').textContent = 'LIFF 初始化失敗或未登入。';
        return;
    }
    // const adminProfile = await callGasApi('getUserProfile', { userId: liffProfile.userId });
    // if (adminProfile.status !== 'found' || (adminProfile.data.status !== '管理者' && adminProfile.data.status !== '開發者')) {
    //     document.getElementById('auth-panel').textContent = '權限不足！'; return;
    // }
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('management-panel').style.display = 'block';

    // --- DOM 元素 ---
    const startDateElem = document.getElementById('start-date');
    const endDateElem = document.getElementById('end-date');
    const vehicleSelect = document.getElementById('vehicle-select');
    const queryBtn = document.getElementById('query-btn');
    const timelineElem = document.getElementById('schedule-timeline');

    // --- 函式 ---
    function formatDate(isoString) {
        return new Date(isoString).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function renderTimeline(reservations) {
        timelineElem.innerHTML = '';
        if (reservations.length === 0) {
            timelineElem.innerHTML = '<p>在此條件下找不到任何預約記錄。</p>';
            return;
        }
        reservations.forEach(res => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-card">
                    <h4>${res.carPlate} - ${res.applicantName}</h4>
                    <p><strong>時間：</strong>${formatDate(res.startTime)} - ${formatDate(res.endTime)}</p>
                    <p><strong>事由：</strong>${res.reason || '未填寫'}</p>
                    <p><strong>狀態：</strong>${res.status}</p>
                </div>
            `;
            timelineElem.appendChild(item);
        });
    }

    async function loadVehiclesForSelect() {
        const result = await callGasApi('getVehicles');
        if (result.status === 'success') {
            result.data.forEach(v => {
                const option = document.createElement('option');
                option.value = v.plate;
                option.textContent = `${v.plate} (${v.spec})`;
                vehicleSelect.appendChild(option);
            });
        }
    }

    async function querySchedule() {
        const params = {
            startDate: startDateElem.value,
            endDate: endDateElem.value,
            plate: vehicleSelect.value
        };
        if (!params.startDate || !params.endDate) {
            showModalAlert('請選擇完整的開始與結束日期！');
            return;
        }
        const result = await callGasApi('getReservationsByVehicleAndDate', params);
        if (result.status === 'success') {
            renderTimeline(result.data);
        } else {
            showModalAlert('查詢失敗: ' + result.message);
        }
    }

    // --- 初始化 ---
    function setDefaultDates() {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7);

        // 轉換成 YYYY-MM-DD 格式
        const toInputDateString = (date) => date.toISOString().split('T')[0];

        startDateElem.value = toInputDateString(sevenDaysAgo);
        endDateElem.value = toInputDateString(sevenDaysLater);
    }

    setDefaultDates();
    loadVehiclesForSelect();
    queryBtn.addEventListener('click', querySchedule);
    
    // 頁面載入時自動查詢一次
    querySchedule();
}
