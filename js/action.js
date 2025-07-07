async function initializeActionPage() {
    let liffProfile = null, availableActions = [], currentAction = null;
    const selectionPanel = document.getElementById('selection-panel'), actionListElem = document.getElementById('action-list'), infoPanel = document.getElementById('info-panel'), infoText = document.getElementById('info-text'), pickupForm = document.getElementById('pickup-form'), returnForm = document.getElementById('return-form');
    function showActionForm(action) { try { currentAction = action; if (selectionPanel) selectionPanel.style.display = 'none'; if (action.mode === 'pickup') { const el = document.getElementById('pickup-car-plate'); if(el) el.value = action.reservation.carPlate; if(pickupForm) pickupForm.style.display = 'block'; } else if (action.mode === 'return') { const el = document.getElementById('return-car-plate'); if(el) el.value = action.reservation.carPlate; if(returnForm) returnForm.style.display = 'block'; } } catch (e) { showModalAlert(`UI錯誤: ${e.message}`, '錯誤'); } }
    function renderActionList(actions) { if (infoPanel) infoPanel.style.display = 'none'; if (selectionPanel) selectionPanel.style.display = 'block'; if (actionListElem) actionListElem.innerHTML = ''; actions.forEach((action, i) => { const btn = document.createElement('button'); btn.className = action.mode; btn.innerHTML = `<strong>${action.mode === 'pickup' ? '領車' : '還車'}</strong>：${action.reservation.carPlate}`; btn.dataset.actionIndex = i; btn.addEventListener('click', () => { const sel = availableActions[btn.dataset.actionIndex]; if (sel) showActionForm(sel); }); if(actionListElem) actionListElem.appendChild(btn); }); }
    async function handleFormSubmit(e, formType) {
        e.preventDefault(); if (!currentAction) { showModalAlert('未選擇操作。'); return; }
        const btn = e.target.querySelector('button[type="submit"]'); if(btn) { btn.disabled = true; btn.textContent = '處理中...'; }
        try { const mileage = document.getElementById(`${formType}-mileage`).value; if (!mileage) { alert('請輸入公里數！'); if(btn){ btn.disabled=false; btn.textContent=`確認${formType==='pickup'?'領':'還'}車`;} return; }
            const params = { userId: liffProfile.userId, actionType: formType === 'pickup' ? '領車' : '還車', reservationId: currentAction.reservation.recordId, carPlate: currentAction.reservation.carPlate, mileage, notes: document.getElementById(`${formType}-notes`).value, gasFee: formType === 'return' ? (document.getElementById('return-gas-fee').value || '0') : '' };
            const result = await callGasApi('processCarAction', params);
            if (result.status === 'success') { showModalAlert(result.message); e.target.style.display = 'none'; if(infoPanel) infoPanel.style.display='block'; if(infoText) infoText.textContent='操作完成！'; setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000); } else { throw new Error(result.message || '儲存失敗'); }
        } catch (e) { showModalAlert(`前端錯誤: ${e.message}`, '錯誤'); if(btn){ btn.disabled=false; btn.textContent=`確認${formType==='pickup'?'領':'還'}車`;} }
    }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        const result = await callGasApi('getPickupReturnStatus', { userId: liffProfile.userId });
        if (result.status === 'actions_available' && result.actions.length > 0) { availableActions = result.actions; renderActionList(availableActions); } else { if (infoText) infoText.textContent = result.message || '無可用操作。'; }
        if (pickupForm) pickupForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pickup'));
        if (returnForm) returnForm.addEventListener('submit', (e) => handleFormSubmit(e, 'return'));
    } catch (e) { console.error("Action page init failed", e); showModalAlert("頁面初始化失敗", "錯誤"); }
}