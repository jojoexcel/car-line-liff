// js/profile.js
document.addEventListener('DOMContentLoaded', async () => {
    // 取得 HTML 元素
    const form = document.getElementById('profile-form');
    const lineNameElem = document.getElementById('line-name');
    const nameElem = document.getElementById('name');
    const phoneElem = document.getElementById('phone');
    const unitElem = document.getElementById('unit');
    const titleElem = document.getElementById('title');
    const statusElem = document.getElementById('status');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');
    
    let liffProfile = null;

    // 顯示訊息
    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    // 主初始化流程
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return; // 初始化失敗或跳轉登入

        lineNameElem.value = liffProfile.displayName;
        
        // 呼叫 API 取得已儲存的個人資料
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });

        if (result.status === 'found') {
            const userData = result.data;
            // 填入既有資料
            nameElem.value = userData.name || '';
            phoneElem.value = userData.phone || '';
            unitElem.value = userData.unit || '';
            titleElem.value = userData.title || '';
            statusElem.value = userData.status || '未知';
            submitBtn.textContent = '修改資料';
        } else if (result.status === 'not_found') {
            // 新使用者
            statusElem.value = '尚未註冊';
            submitBtn.textContent = '建立新資料';
        } else {
            // 發生錯誤
            showMessage(result.message, 'error');
            form.style.display = 'none'; // 隱藏表單
        }
    }

    // 監聽表單提交事件
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // 防止表單傳統提交
        submitBtn.disabled = true;

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
            }, 2000); // 2秒後自動關閉
        } else {
            showMessage(result.message, 'error');
            submitBtn.disabled = false;
        }
    });

    // 執行初始化
    initializePage();
});
