// js/history.js

async function initializeHistoryPage() {
    console.log("Initializing History Page Logic...");

    let liffProfile = null;
    let recentRecords = [];
    let selectedRecord = null;

    const recordListElem = document.getElementById('record-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const editForm = document.getElementById('edit-form');
    const mileageInput = document.getElementById('edit-mileage');
    const gasInput = document.getElementById('edit-gas');
    const notesInput = document.getElementById('edit-notes');
    
    // 【新增】作廢按鈕
    const voidBtn = document.getElementById('void-btn');

    function renderRecordList(records) {
        if (!recordListElem) return;
        recordListElem.innerHTML = '';
        if (records.length === 0) {
            if (infoText) infoText.textContent = '在此限制區間內，您沒有任何領還車記錄。';
            if (infoPanel) infoPanel.style.display = 'block';
            return;
        }
        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'record-list-item';
            // 這裡顯示的文字包含了後端傳來的 (預約: xx/xx xx:xx ~ xx/xx xx:xx)
            item.textContent = record.displayText; 
            item.dataset.recordIndex = index;
            recordListElem.appendChild(item);
        });
    }

    function handleRecordClick(e) {
        if (!e.target.classList.contains('record-list-item')) return;
        document.querySelectorAll('.record-list-item').forEach(el => el.classList.remove('selected'));
        e.target.classList.add('selected');
        
        const index = e.target.dataset.recordIndex;
        selectedRecord = recentRecords[index];
        
        if (mileageInput) mileageInput.value = selectedRecord.mileage;
        if (gasInput) gasInput.value = selectedRecord.gas;
        if (notesInput) notesInput.value = selectedRecord.notes;
        
        if (editForm) editForm.style.display = 'block';
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!selectedRecord) {
            showModalAlert('請先選擇一筆要修改的記錄。');
            return;
        }
        const params = {
            recordId: selectedRecord.recordId,
            userId: liffProfile.userId,
            mileage: mileageInput.value,
            gas: gasInput.value,
            notes: notesInput.value,
            mode: 'update' // 標示為正常更新
        };
        const result = await callGasApi('updateRecordDetails', params);
        if (result.status === 'success') {
            showModalAlert(result.message);
            if (editForm) editForm.style.display = 'none';
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showModalAlert(`更新失敗: ${result.message}`, '錯誤');
        }
    }

    // 【新增】作廢記錄的邏輯
    async function handleVoidRecord() {
        if (!selectedRecord) return;
        
        // 使用全域的確認視窗
        const isConfirmed = await showModalConfirm('確定要作廢這筆紀錄嗎？作廢後將從列表中隱藏。', '作廢紀錄');
        if (!isConfirmed) return;

        showLoading();
        const params = {
            recordId: selectedRecord.recordId,
            userId: liffProfile.userId,
            mode: 'void' // 【關鍵】標示為作廢模式
        };

        try {
            const result = await callGasApi('updateRecordDetails', params);
            if (result.status === 'success') {
                showModalAlert('紀錄已成功作廢！');
                if (editForm) editForm.style.display = 'none';
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showModalAlert(`作廢失敗: ${result.message}`, '錯誤');
            }
        } catch (error) {
            showModalAlert(`前端錯誤: ${error.message}`, '錯誤');
        } finally {
            hideLoading();
        }
    }

    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getRecentRecords', { userId: liffProfile.userId });
        if (result.status === 'success') {
            recentRecords = result.data;
            renderRecordList(recentRecords);
        } else {
            showModalAlert(result.message || '無法載入歷史記錄。', '錯誤');
        }

        if (recordListElem) recordListElem.addEventListener('click', handleRecordClick);
        if (editForm) editForm.addEventListener('submit', handleFormSubmit);
        
        // 綁定作廢按鈕事件
        if (voidBtn) voidBtn.addEventListener('click', handleVoidRecord);

    } catch(e) {
        console.error("History page init failed", e);
        showModalAlert("頁面初始化失敗", "錯誤");
    }
}
