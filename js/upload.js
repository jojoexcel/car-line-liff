// js/upload.js (模組化版)

/**
 * upload.html 頁面的主初始化函式。
 */
async function initializeUploadPage() {
    console.log("Initializing Upload Page Logic...");

    let liffProfile = null;
    let targetRecordId = null;
    let imageFiles = [];
    let userSystemProfile = null;

    const recordInfo = document.getElementById('record-info');
    const recordDetails = document.getElementById('record-details');
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const uploadPanel = document.getElementById('upload-panel');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const submitBtn = document.getElementById('submit-btn');
    const messageBox = document.getElementById('message-box');

    function showMessage(text, type) { /* ... */ }

    function handleFileSelection() {
        if (!fileInput) return;
        if (fileInput.files.length > 5) {
            alert('最多只能選擇 5 張照片！');
            fileInput.value = '';
            return;
        }
        imageFiles = Array.from(fileInput.files);
        if (previewArea) {
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
        }
        if (submitBtn) submitBtn.disabled = imageFiles.length === 0;
    }

    async function handleSubmit() {
        if (!targetRecordId || imageFiles.length === 0) {
            alert('請先選擇照片！');
            return;
        }
        if (!userSystemProfile || !userSystemProfile.name) {
            showMessage('無法獲取用戶名稱，無法上傳。', 'error');
            return;
        }
        showLoading();
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '上傳中...';
        }
        try {
            const base64Images = await Promise.all(
                imageFiles.map(file => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                }))
            );
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'uploadImages',
                    recordId: targetRecordId,
                    images: base64Images,
                    userName: userSystemProfile.name
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                showMessage(result.message, 'success');
                setTimeout(() => { if (liff.isInClient()) liff.closeWindow(); }, 3000);
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

    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const profileResult = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (profileResult.status === 'found') {
            userSystemProfile = profileResult.data;
        } else {
            userSystemProfile = { name: liffProfile.displayName };
        }

        const recordResult = await callGasApi('getLastActionRecord', { userId: liffProfile.userId });
        if (recordResult.status === 'success' && recordResult.data) {
            targetRecordId = recordResult.data.recordId;
            const actionText = recordResult.data.action === 'PICKUP' ? '領車' : '還車';
            if (recordDetails) recordDetails.textContent = `[${actionText}] ${recordResult.data.carPlate} - ${recordResult.data.timestamp}`;
            if (recordInfo) recordInfo.style.display = 'block';
            if (uploadPanel) uploadPanel.style.display = 'block';
            if (infoPanel) infoPanel.style.display = 'none';
        } else {
            if (infoText) infoText.textContent = recordResult.message || '您沒有可上傳照片的記錄。';
        }

        if (fileInput) fileInput.addEventListener('change', handleFileSelection);
        if (submitBtn) submitBtn.addEventListener('click', handleSubmit);
    } catch(e) {
        console.error("Upload page initialization failed", e);
        showMessage("頁面初始化失敗", "error");
    }
}