async function initializeStatusPage() {
    let liffProfile = null;
    const listElem = document.getElementById('reservation-list'), infoPanel = document.getElementById('info-panel'), infoText = document.getElementById('info-text'), modal = { overlay: document.getElementById('cancel-modal-overlay'), reasonInput: document.getElementById('cancel-reason-input'), confirmBtn: document.getElementById('modal-confirm-btn'), cancelBtn: document.getElementById('modal-cancel-btn') };
    let toCancel = { rowNum: null, btn: null, userId: null };
    function render(reservations) { if (!listElem) return; listElem.innerHTML = ''; if (!reservations || reservations.length === 0) { if (infoText) infoText.textContent = '您目前沒有任何有效的預約。'; if (infoPanel) infoPanel.style.display = 'block'; return; } reservations.forEach(res => { const card = document.createElement('div'); card.className = 'reservation-card'; card.id = `reservation-${res.rowNum}`; let btnHtml = ''; if (res.status === '預約成功') { btnHtml = `<button class="cancel-btn" data-row-num="${res.rowNum}" data-user-id="${res.applicantId}">取消此預約</button>`; } card.innerHTML = `<h3>${res.carPlate} <span class="status-badge">${res.status}</span></h3><p><strong>時間：</strong>${res.startTime} - ${res.endTime}</p><p><strong>事由：</strong>${res.reason}</p>${btnHtml}`; listElem.appendChild(card); }); }
    function handleCancelClick(e) { if (!e.target.classList.contains('cancel-btn')) return; toCancel = { btn: e.target, rowNum: e.target.dataset.rowNum, userId: e.target.dataset.userId }; if (modal.reasonInput) modal.reasonInput.value = ''; if (modal.overlay) modal.overlay.style.display = 'flex'; }
    async function confirmCancellation() { const { rowNum, btn, userId } = toCancel; if (!rowNum || !btn || !userId) return; const reason = modal.reasonInput ? modal.reasonInput.value : ""; closeModal(); btn.disabled = true; btn.textContent = '取消中...'; const params = { rowNum, userId, reason }; const result = await callGasApi('cancelReservation', params); if (result.status === 'success') { const card = document.getElementById(`reservation-${rowNum}`); if (card) { card.style.transition = 'opacity .5s'; card.style.opacity = '0'; setTimeout(() => card.remove(), 500); } showModalAlert('預約已成功取消！'); } else { showModalAlert(`取消失敗: ${result.message}`, '錯誤'); btn.disabled = false; btn.textContent = '取消此預約'; } }
    function closeModal() { if (modal.overlay) modal.overlay.style.display = 'none'; }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        const result = await callGasApi('getMyReservations', { userId: liffProfile.userId });
        if (result.status === 'success') { render(result.data); } else { if (infoText) infoText.textContent = result.message || '無法載入預約。'; if (infoPanel) infoPanel.style.display = 'block'; }
        if (listElem) listElem.addEventListener('click', handleCancelClick);
        if (modal.confirmBtn) modal.confirmBtn.addEventListener('click', confirmCancellation);
        if (modal.cancelBtn) modal.cancelBtn.addEventListener('click', closeModal);
    } catch (e) { console.error("Status page init failed", e); showModalAlert("頁面初始化失敗", "錯誤"); }
}