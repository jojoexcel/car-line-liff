async function initializeUploadPage() {
    let liffProfile = null, targetRecordId = null, imageFiles = [], userSysProfile = null;
    const recInfo = document.getElementById('record-info'), recDetails = document.getElementById('record-details'), infoPanel = document.getElementById('info-panel'), infoText = document.getElementById('info-text'), uploadPanel = document.getElementById('upload-panel'), fileInput = document.getElementById('file-input'), previewArea = document.getElementById('preview-area'), submitBtn = document.getElementById('submit-btn');
    function handleFile() { if (!fileInput) return; if (fileInput.files.length > 5) { alert('最多5張！'); fileInput.value = ''; return; } imageFiles = Array.from(fileInput.files); if (previewArea) { previewArea.innerHTML = ''; imageFiles.forEach(f => { const r = new FileReader(); r.onload = e => { const i = document.createElement('img'); i.src = e.target.result; i.className = 'preview-img'; previewArea.appendChild(i); }; r.readAsDataURL(f); }); } if (submitBtn) submitBtn.disabled = imageFiles.length === 0; }
    async function handleSubmit() { if (!targetRecordId || imageFiles.length === 0) { showModalAlert('請選擇照片！'); return; } if (!userSysProfile || !userSysProfile.name) { showModalAlert('無法獲取用戶名稱。'); return; } showLoading(); if(submitBtn) submitBtn.disabled = true;
        try { const b64 = await Promise.all(imageFiles.map(f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = e => rej(e); r.readAsDataURL(f); })));
            const resp = await fetch(GAS_API_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'uploadImages', recordId: targetRecordId, images: b64, userName: userSysProfile.name }) });
            const result = await resp.json(); if (result.status === 'success') { showModalAlert(result.message); setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000); } else { throw new Error(result.message); }
        } catch (e) { showModalAlert(`上傳失敗: ${e.message}`, '錯誤'); if(submitBtn) submitBtn.disabled = false; } finally { hideLoading(); }
    }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        const profileRes = await callGasApi('getUserProfile', { userId: liffProfile.userId }); userSysProfile = (profileRes.status === 'found') ? profileRes.data : { name: liffProfile.displayName };
        const recordRes = await callGasApi('getLastActionRecord', { userId: liffProfile.userId });
        if (recordRes.status === 'success' && recordRes.data) {
            targetRecordId = recordRes.data.recordId; const act = recordRes.data.action === 'PICKUP' ? '領車' : '還車'; if (recDetails) recDetails.textContent = `[${act}] ${recordRes.data.carPlate} - ${recordRes.data.timestamp}`; if (recInfo) recInfo.style.display = 'block'; if (uploadPanel) uploadPanel.style.display = 'block'; if (infoPanel) infoPanel.style.display = 'none';
        } else { if (infoText) infoText.textContent = recordRes.message || '無記錄可上傳。'; }
        if (fileInput) fileInput.addEventListener('change', handleFile);
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    } catch(e) { console.error("Upload page init failed", e); showModalAlert("頁面初始化失敗", "錯誤"); }
}