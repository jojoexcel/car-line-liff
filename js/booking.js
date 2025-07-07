async function initializeBookingPage() {
    let liffProfile = null, selectedStartTime = null, selectedEndTime = null;
    const step1 = document.getElementById('step1'), step2 = document.getElementById('step2'), timeForm = document.getElementById('time-form'), detailsForm = document.getElementById('details-form'), startTimeElem = document.getElementById('start-time'), endTimeElem = document.getElementById('end-time'), startTimePreview = document.getElementById('start-time-preview'), endTimePreview = document.getElementById('end-time-preview'), carListElem = document.getElementById('car-list');
    function updatePreview(iso, elem) { if (!elem) return; if (!iso) { elem.textContent = ''; return; } try { const d = new Date(iso); if (isNaN(d.getTime())) { elem.textContent = ''; return; } const y=d.getFullYear(),M=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'),H=String(d.getHours()).padStart(2,'0'),m=String(d.getMinutes()).padStart(2,'0'); elem.textContent = `您選的是：${y}/${M}/${dd} ${H}:${m}`; } catch (e) { elem.textContent = '無效時間'; } }
    async function handleTimeSubmit(e) {
        e.preventDefault(); selectedStartTime = startTimeElem.value; selectedEndTime = endTimeElem.value; if (!selectedStartTime || !selectedEndTime) { showModalAlert('請選擇完整的時間'); return; } if (new Date(selectedEndTime) <= new Date(selectedStartTime)) { showModalAlert('結束時間必須晚于開始時間'); return; }
        const result = await callGasApi('getAvailableCars', { start: new Date(selectedStartTime).toISOString(), end: new Date(selectedEndTime).toISOString() });
        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
            carListElem.innerHTML = ''; result.data.forEach((car, i) => { const item = document.createElement('div'); item.className = 'car-list-item'; item.innerHTML = `<input type="radio" id="car${i}" name="car" value="${car.plate}" required><label for="car${i}">${car.plate} (${car.spec})</label>`; carListElem.appendChild(item); });
            step1.classList.remove('active'); step2.classList.add('active');
        } else { showModalAlert(result.data.length === 0 ? '該時段已無可用車輛' : (result.message || '查詢失敗'), '提示'); }
    }
    async function handleDetailsSubmit(e) {
        e.preventDefault(); const formData = new FormData(detailsForm); const selectedCarPlate = formData.get('car'); if (!selectedCarPlate) { showModalAlert('請選擇一輛車！'); return; }
        const params = { userId: liffProfile.userId, carPlate: selectedCarPlate, start: new Date(selectedStartTime).toISOString(), end: new Date(selectedEndTime).toISOString(), reason: document.getElementById('reason').value, location: document.getElementById('location').value };
        const result = await callGasApi('createReservation', params);
        if (result.status === 'success') { showModalAlert(result.message); if (detailsForm) detailsForm.style.display = 'none'; setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000); } else { showModalAlert(result.message || '預約失敗', '錯誤'); }
    }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        if (startTimeElem) startTimeElem.addEventListener('input', () => updatePreview(startTimeElem.value, startTimePreview));
        if (endTimeElem) endTimeElem.addEventListener('input', () => updatePreview(endTimeElem.value, endTimePreview));
        if (timeForm) timeForm.addEventListener('submit', handleTimeSubmit);
        if (detailsForm) detailsForm.addEventListener('submit', handleDetailsSubmit);
    } catch (e) { console.error("Booking page init failed", e); showModalAlert('頁面初始化失敗', '錯誤'); }
}