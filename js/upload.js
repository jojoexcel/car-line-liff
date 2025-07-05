/**
 * 檔案說明：拍照上傳頁面 (upload.html) 的主要邏輯。
 * 核心流程：自動獲取使用者最後一筆領/還車記錄，並允許為其上傳照片。
 * 版本：1.1 (修正了對不存在 DOM 元素的引用)
 */
document.addEventListener('DOMContentLoaded', async () => {
    // === 全域變數 ===
    let liffProfile = null;
    let targetRecordId = null; // 儲存目標記錄的 ID
    let imageFiles = [];       // 儲存使用者選擇的圖片檔案

    // === DOM 元素快取 ===
    const recordInfo = document.getElementById('record-info');
    const recordDetails = document.getElementById('record-details');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const uploadPanel = document.getElementById('upload-panel');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    /**
     * 在頁面上方顯示成功或失敗的訊息。
     */
    function showMessage(text, type) {
        if (!messageBox) return;
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        messageBox.style.display = 'block';
    }

    /**
     * 初始化頁面，獲取「最後一筆」領/還車記錄。
     */
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getLastActionRecord', { userId: liffProfile.userId });

        if (result.status === 'success' && result.data) {
            const record = result.data;
            targetRecordId = record.recordId;

            // 更新 UI，顯示記錄資訊並顯示上傳區塊
            const actionText = record.action === 'PICKUP' ? '領車' : '還車';
            if (recordDetails) {
                recordDetails.textContent = `[${actionText}] ${record.carPlate} - ${record.timestamp}`;
            }
            if (recordInfo) recordInfo.style.display = 'block';
            if (uploadPanel) uploadPanel.style.display = 'block';
            if (infoPanel) infoPanel.style.display = 'none';

        } else {
            if (infoText) infoText.textContent = result.message || '您沒有可上傳照片的記錄。';
        }
    }

    /**
     * 當使用者選擇照片檔案時的處理函式。
     */
    function handleFileSelection() {
        if (!fileInput) return;

        if (fileInput.files.length > 5) {
            alert('最多只能選擇 5 張照片！');
            fileInput.value = ''; // 清空選擇
            return;
        }
        imageFiles = Array.from(fileInput.files);
        
        if (previewArea) {
            previewArea.innerHTML = ''; // 清空預覽
            imageFiles.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-img';
                    previewArea.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
        
        if (submitBtn) {
            submitBtn.disabled = imageFiles.length === 0;
        }
    }

    /**
     * 點擊上傳按鈕時的處理函式。
     */
    async function handleSubmit() {
        if (!targetRecordId || imageFiles.length === 0) {
            alert('請先選擇照片！');
            return;
        }
        
        showLoading();
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '上傳中...';
        }
        showMessage('正在處理照片並上傳，請耐心等候...', 'info');

        try {
            // 將所有圖片檔案轉換為 Base64 字串
            const base64Images = await Promise.all(
                imageFiles.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                }))
            );

            // 使用 POST 請求發送大數據到後端
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'cors', // 明確指定 cors 模式
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'uploadImages',
                    recordId: targetRecordId,
                    images: base64Images
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                showMessage(result.message, 'success');
                setTimeout(() => {
                    if (liff.isInClient()) {
                        liff.closeWindow();
                    }
                }, 3000);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            showMessage(`上傳失敗: ${error.message}`, 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '上傳照片';
            }
        } finally {
            hideLoading();
        }
    }

    // === 事件綁定 ===
    // 檢查元素是否存在後才綁定，增加健壯性
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    // === 程式進入點 ===
    initializePage();
});
