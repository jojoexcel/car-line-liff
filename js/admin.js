async function initializeAdminPage() {
    const authPanel = document.getElementById('auth-panel'), managementPanel = document.getElementById('management-panel');
    try {
        const liffProfile = await initializeLiff(); if (!liffProfile) { if(authPanel) authPanel.textContent = 'LIFF初始化失敗'; return; }
        const result = await callGasApi('getUserProfile', { userId: liffProfile.userId });
        if (result.status === 'found' && (result.data.status === '管理者' || result.data.status === '開發者')) {
            if(authPanel) authPanel.style.display = 'none'; if(managementPanel) managementPanel.style.display = 'block';
            // TODO: 載入管理員專屬的初始資料
        } else { if(authPanel) authPanel.textContent = '權限不足！'; }
    } catch(e) { if(authPanel) authPanel.textContent = '權限驗證失敗'; }
}