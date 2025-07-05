// js/upload.js
document.addEventListener('DOMContentLoaded', async () => {
    let liffProfile = null;
    let selectedRecordId = null;
    let imageFiles = [];

    const recordSelect = document.getElementById('record-select');
    const step2 = document.getElementById('step2');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... */ }

    // 初始化頁面，獲取記錄列表
    async function initializePage() {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getMyPickupReturnRecords', { userId: liffProfile.userId });
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(record => {
                const option = document.createElement('option');
                option.value = record.recordId;
                option.textContent = `[${record.action}] ${record.carPlate} - ${record.timestamp}`;
                recordSelect.appendChild(option);
            });
        } else {
            showMessage('您近期沒有可上傳照片的記錄。', 'info');
        }
    }

    // 當使用者選擇一筆記錄時
    recordSelect.addEventListener('change', () => {
        selectedRecordId = recordSelect.value;
        if (selectedRecordId) {
            step2.style.display = 'block';
        } else {
            step2.style.display = 'none';
        }
    });

    // 當使用者選擇照片檔案時
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 5) {
            alert('最多只能選擇 5 張照片！');
            fileInput.value = ''; // 清空選擇
            return;
        }
        imageFiles = Array.from(fileInput.files);
        previewArea.innerHTML = '';
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
        submitBtn.disabled = imageFiles.length === 0;
    });

    // 點擊上傳按鈕
    submitBtn.addEventListener('click', async () => {
        if (!selectedRecordId || imageFiles.length === 0) {
            alert('請先選擇記錄並選擇照片！');
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
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 避免 CORS preflight
                body: JSON.stringify({
                    action: 'uploadImages',
                    recordId: selectedRecordId,
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
