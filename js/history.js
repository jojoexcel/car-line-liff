// js/history.js
document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    let recentRecords = []; // 儲存從後端拿到的所有記錄
    let selectedRecord = null; // 儲存使用者當前選擇的記錄

    const recordListElem = document.getElementById('record-list');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const editForm = document.getElementById('edit-form');
    
    // 表單欄位元素
    const mileageInput = document.getElementById('edit-mileage');
    const gasInput = document.getElementById('edit-gas');
    const notesInput = document.getElementById('edit-notes');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... */ }

    // 渲染記錄列表
    function renderRecordList(records) {
        if (records.length === 0) {
            infoText.textContent = '您在過去7天內沒有任何領還車記錄。';
            infoPanel.style.display = 'block';
            return;
        }
        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'record-list-item';
            item.textContent = record.displayText;
            item.dataset.recordIndex = index; // 將記錄在陣列中的索引存起來
            recordListElem.appendChild(item);
        });
    }

    // 處理列表項目的點擊事件
    function handleRecordClick(e) {
        if (!e.target.classList.contains('record-list-item')) return;

        // 移除所有項目的 'selected' class
        document.querySelectorAll('.record-list-item').forEach(el => el.classList.remove('selected'));
        // 為被點擊的項目加上 'selected' class
        e.target.classList.add('selected');

        const index = e.target.dataset.recordIndex;
        selectedRecord = recentRecords[index];

        // 將該筆記錄的資料填入表單
        mileageInput.value = selectedRecord.mileage;
        gasInput.value = selectedRecord.gas;
        notesInput.value = selectedRecord.notes;
        
        // 顯示表單
        editForm.style.display = 'block';
    }

    // 處理表單提交
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
            editForm.style.display = 'none'; // 隱藏表單
            // 可選：刷新頁面或更新列表中的資料
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showMessage(`更新失敗: ${result.message}`, 'error');
        }
    }

    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getRecentRecords', { userId: liffProfile.userId });

        if (result.status === 'success') {
            recentRecords = result.data;
            renderRecordList(recentRecords);
        } else {
            showMessage(result.message || '無法載入歷史記錄。', 'error');
        }
    }

    // 事件綁定
    recordListElem.addEventListener('click', handleRecordClick);
    editForm.addEventListener('submit', handleFormSubmit);

    // 執行初始化
    initializePage();
});
