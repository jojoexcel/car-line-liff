// js/profile.js (即時驗證版)
document.addEventListener('DOMContentLoaded', async () => {
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
    // 【新增】獲取電話錯誤訊息的元素
    const phoneErrorElem = document.getElementById('phone-error');
    
    let liffProfile = null;

    // 顯示訊息
    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

  /**
     * 【新增】即時驗證電話號碼格式的函式
     */
    function validatePhone() {
        const phone = phoneElem.value;
        // 正規表示式：^ 和 $ 代表從頭到尾都必須完全匹配
        const phoneRegex = /^09\d{2}-\d{6}$/; 

        if (phoneRegex.test(phone)) {
            // 格式正確
            phoneErrorElem.textContent = ''; // 清空錯誤訊息
            phoneElem.style.borderColor = '#ced4da'; // 恢復正常邊框顏色
            return true;
        } else {
            // 格式錯誤
            phoneErrorElem.textContent = '格式錯誤，應為 09xx-xxxxxx';
            phoneElem.style.borderColor = 'var(--error-color)'; // 邊框變紅
            return false;
        }
    }

    /**
     * 初始化頁面
     */
    async function initializePage() {
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
            validatePhone(); // 載入資料後也驗證一次
        } else if (result.status === 'not_found') {
            statusElem.value = '尚未註冊';
            submitBtn.textContent = '建立新資料';
        } else {
            showMessage(result.message, 'error');
            form.style.display = 'none';
        }
    }

    /**
     * 監聽表單提交事件
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 【新增】在提交前，再做一次最終驗證
        if (!validatePhone()) {
            alert('電話號碼格式不正確，請修正後再提交！');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '儲存中...';

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
            setTimeout(() => {
                if (liff.isInClient()) {
                    liff.closeWindow();
                }
            }, 2000);
        } else {
            showMessage(result.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '儲存資料';
        }
    });

    // === 事件綁定 ===
    // 【新增】為電話輸入框綁定 'input' 事件，實現即時驗證
    if (phoneElem) {
        phoneElem.addEventListener('input', validatePhone);
    }

    // === 程式進入點 ===
    initializePage();
});
