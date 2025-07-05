// js/upload.js (簡化流程版)
document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    let targetRecordId = null; // 只儲存目標記錄的 ID
    let imageFiles = [];

    // DOM 元素
    const recordInfo = document.getElementById('record-info');
    const recordDetails = document.getElementById('record-details');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const uploadPanel = document.getElementById('upload-panel');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... 保持不變 ... */ }

    // 初始化頁面，獲取「最後一筆」記錄
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getLastActionRecord', { userId: liffProfile.userId });

        if (result.status === 'success' && result.data) {
            const record = result.data;
            targetRecordId = record.recordId; // 儲存起來供上傳時使用

            // 更新 UI，顯示記錄資訊並顯示上傳區塊
            const actionText = record.action === 'PICKUP' ? '領車' : '還車';
            recordDetails.textContent = `[${actionText}] ${record.carPlate} - ${record.timestamp}`;
            recordInfo.style.display = 'block';
            uploadPanel.style.display = 'block';
            infoPanel.style.display = 'none';
        } else {
            // 找不到記錄或發生錯誤
            infoText.textContent = result.message || '您沒有可上傳照片的記錄。';
        }
    }

    // 當使用者選擇照片檔案時 (邏輯不變)
    fileInput.addEventListener('change', () => { /* ... 保持不變 ... */ });

    // 點擊上傳按鈕 (邏輯微調)
    submitBtn.addEventListener('click', async () => {
        // 現在只檢查 targetRecordId
        if (!targetRecordId || imageFiles.length === 0) {
            alert('請選擇照片！');
            return;
        }
        
        showLoading();
        submitBtn.disabled = true;
        showMessage('正在上傳照片，請耐心等候...', 'info');

        try {
            const base64Images = await Promise.all(
                imageFiles.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                }))
            );

            // 使用 POST 請求發送大數據
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'uploadImages',
                    recordId: targetRecordId, // 使用儲存好的 ID
                    images: base64Images
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                showMessage(result.message, 'success');
                setTimeout(() => liff.isInClient() && liff.closeWindow(), 3000);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            showMessage(`上傳失敗: ${error.message}`, 'error');
        } finally {
            hideLoading();
            submitBtn.disabled = false;
        }
    });

    initializePage();
});
