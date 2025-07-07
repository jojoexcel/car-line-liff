async function initializeHistoryPage() {
    let liffProfile = null, recentRecords = [], selectedRecord = null;
    const listElem = document.getElementById('record-list'), infoPanel = document.getElementById('info-panel'), infoText = document.getElementById('info-text'), editForm = document.getElementById('edit-form'), mileageInput = document.getElementById('edit-mileage'), gasInput = document.getElementById('edit-gas'), notesInput = document.getElementById('edit-notes');
    function renderList(records) { if (!listElem) return; if (records.length === 0) { if (infoText) infoText.textContent = '過去7天內無記錄。'; if (infoPanel) infoPanel.style.display = 'block'; return; } records.forEach((rec, i) => { const item = document.createElement('div'); item.className = 'record-list-item'; item.textContent = rec.displayText; item.dataset.recordIndex = i; listElem.appendChild(item); }); }
    function handleClick(e) { if (!e.target.classList.contains('record-list-item')) return; document.querySelectorAll('.record-list-item').forEach(el => el.classList.remove('selected')); e.target.classList.add('selected'); const i = e.target.dataset.recordIndex; selectedRecord = recentRecords[i]; if(mileageInput) mileageInput.value = selectedRecord.mileage; if(gasInput) gasInput.value = selectedRecord.gas; if(notesInput) notesInput.value = selectedRecord.notes; if(editForm) editForm.style.display = 'block'; }
    async function handleSubmit(e) { e.preventDefault(); if (!selectedRecord) { showModalAlert('請先選擇一筆記錄。'); return; } const params = { recordId: selectedRecord.recordId, userId: liffProfile.userId, mileage: mileageInput.value, gas: gasInput.value, notes: notesInput.value }; const result = await callGasApi('updateRecordDetails', params); if (result.status === 'success') { showModalAlert(result.message); if(editForm) editForm.style.display='none'; setTimeout(() => window.location.reload(), 2000); } else { showModalAlert(`更新失敗: ${result.message}`, '錯誤'); } }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        const result = await callGasApi('getRecentRecords', { userId: liffProfile.userId });
        if (result.status === 'success') { recentRecords = result.data; renderList(recentRecords); } else { showModalAlert(result.message || '無法載入歷史記錄。', '錯誤'); }
        if (listElem) listElem.addEventListener('click', handleClick);
        if (editForm) editForm.addEventListener('submit', handleSubmit);
    } catch(e) { console.error("History page init failed", e); showModalAlert("頁面初始化失敗", "error"); }
}