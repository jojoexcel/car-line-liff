async function initializeProfilePage() {
    const form = document.getElementById('profile-form'), lineNameElem = document.getElementById('line-name'), nameElem = document.getElementById('name'), phoneElem = document.getElementById('phone'), unitElem = document.getElementById('unit'), titleElem = document.getElementById('title'), statusElem = document.getElementById('status'), submitBtn = document.getElementById('submit-btn'), phoneErrorElem = document.getElementById('phone-error');
    let liffProfile = null;
    function validatePhone() { if (!phoneElem) return false; const phoneRegex = /^09\d{2}-\d{6}$/; if (phoneRegex.test(phoneElem.value)) { if (phoneErrorElem) phoneErrorElem.textContent = ''; phoneElem.style.borderColor = '#ced4da'; return true; } else { if (phoneErrorElem) phoneErrorElem.textContent = '格式錯誤，應為 09xx-xxxxxx'; phoneElem.style.borderColor = 'var(--error-color)'; return false; } }
    try {
        liffProfile = await initializeLiff(); if (!liffProfile) return;
        lineNameElem.value = liffProfile.displayName;
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (result.status === 'found') {
            const userData = result.data; nameElem.value = userData.name || ''; phoneElem.value = userData.phone || ''; unitElem.value = userData.unit || ''; titleElem.value = userData.title || ''; statusElem.value = userData.status || '未知'; submitBtn.textContent = '修改資料'; validatePhone();
        } else if (result.status === 'not_found') { statusElem.value = '尚未註冊'; submitBtn.textContent = '建立新資料'; } else { showModalAlert(result.message, '錯誤'); if(form) form.style.display = 'none'; }
    } catch(e) { console.error("Profile page init failed", e); showModalAlert("頁面初始化失敗", "錯誤"); }
    if (form) { form.addEventListener('submit', async (e) => { e.preventDefault(); if (!validatePhone()) { showModalAlert('電話號碼格式不正確！'); return; }
        if(submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '儲存中...'; }
        const params = { userId: liffProfile.userId, lineName: liffProfile.displayName, linePicUrl: liffProfile.pictureUrl, name: nameElem.value, phone: phoneElem.value, unit: unitElem.value, title: titleElem.value };
        const result = await callGasApi('upsertUserProfile', params);
        if (result.status === 'success') { showModalAlert(result.message); setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 2000); } else { showModalAlert(result.message, '錯誤'); if(submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '儲存資料'; } } });
    }
    if (phoneElem) phoneElem.addEventListener('input', validatePhone);
}