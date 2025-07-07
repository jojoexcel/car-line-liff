// js/history.js (模組化版)

/**
 * history.html 頁面的主初始化函式。
 */
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
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... */ }

    function renderRecordList(records) {
        if (!recordListElem) return;
        if (records.length === 0) {
            if (infoText) infoText.textContent = '您在過去7天內沒有任何領還車記錄。';
            if (infoPanel) infoPanel.style.display = 'block';
            return;
        }
        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'record-list-item';
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
            alert('請先選擇一筆要修改的記錄。');
            return;
        }
        const params = {
            recordId: selectedRecord.recordId,
            userId: liffProfile.userId,
            mileage: mileageInput.value,
            gas: gasInput.value,
            notes: notesInput.value
        };
        const result = await callGasApi('updateRecordDetails', params);
        if (result.status === 'success') {
            showMessage(result.message, 'success');
            if (editForm) editForm.style.display = 'none';
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showMessage(`更新失敗: ${result.message}`, 'error');
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
            showMessage(result.message || '無法載入歷史記錄。', 'error');
        }
        if (recordListElem) recordListElem.addEventListener('click', handleRecordClick);
        if (editForm) editForm.addEventListener('submit', handleFormSubmit);
    } catch(e) {
        console.error("History page initialization failed", e);
        showMessage("頁面初始化失敗", "error");
    }
}