// js/profile.js (模組化版)

/**
 * profile.html 頁面的主初始化函式。
 */
async function initializeProfilePage() {
    console.log("Initializing Profile Page Logic...");

    // === DOM 元素快取 ===
    const form = document.getElementById('profile-form');
    const lineNameElem = document.getElementById('line-name');
    const nameElem = document.getElementById('name');
    const phoneElem = document.getElementById('phone');
    const unitElem = document.getElementById('unit');
    const titleElem = document.getElementById('title');
    const statusElem = document.getElementById('status');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');
    const phoneErrorElem = document.getElementById('phone-error');

    let liffProfile = null;

    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    function validatePhone() {
        if (!phoneElem) return false;
        const phone = phoneElem.value;
        const phoneRegex = /^09\d{2}-\d{6}$/;
        if (phoneRegex.test(phone)) {
            if (phoneErrorElem) phoneErrorElem.textContent = '';
            phoneElem.style.borderColor = '#ced4da';
            return true;
        } else {
            if (phoneErrorElem) phoneErrorElem.textContent = '格式錯誤，應為 09xx-xxxxxx';
            phoneElem.style.borderColor = 'var(--error-color)';
            return false;
        }
    }

    // --- 初始化邏輯 ---
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        lineNameElem.value = liffProfile.displayName;

        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

        if (result.status === 'found') {
            const userData = result.data;
            nameElem.value = userData.name || '';
            phoneElem.value = userData.phone || '';
            unitElem.value = userData.unit || '';
            titleElem.value = userData.title || '';
            statusElem.value = userData.status || '未知';
            submitBtn.textContent = '修改資料';
            validatePhone();
        } else if (result.status === 'not_found') {
            statusElem.value = '尚未註冊';
            submitBtn.textContent = '建立新資料';
        } else {
            showMessage(result.message, 'error');
            if(form) form.style.display = 'none';
        }
    } catch(e) {
        console.error("Profile page initialization failed", e);
        showMessage("頁面初始化失敗，請重試", "error");
    }

    // --- 事件綁定 ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validatePhone()) {
                alert('電話號碼格式不正確，請修正後再提交！');
                return;
            }
            if(submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '儲存中...';
            }
            const params = {
                userId: liffProfile.userId,
                lineName: liffProfile.displayName,
                linePicUrl: liffProfile.pictureUrl,
                name: nameElem.value,
                phone: phoneElem.value,
                unit: unitElem.value,
                title: titleElem.value
            };
            const result = await callGasApi('upsertUserProfile', params);
            if (result.status === 'success') {
                showMessage(result.message, 'success');
                setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 2000);
            } else {
                showMessage(result.message, 'error');
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '儲存資料';
                }
            }
        });
    }

    if (phoneElem) {
        phoneElem.addEventListener('input', validatePhone);
    }
}