/**
 * 檔案說明：修改歷史記錄頁面 (history.html) 的主要邏輯。
 * 核心功能：分頁顯示過去的記錄，點選後收合列表，並允許修改或標記事後取消。
 * 版本：3.0 (分頁與收合版)
 */
async function initializeHistoryPage() {
    // === 全域變數 ===
    let liffProfile = null;
    let recentRecords = [];      
    let selectedRecord = null;   

    // 分頁相關變數
    let currentPage = 0;
    const pageSize = 10; // 每頁顯示10筆

    // === DOM 元素快取 ===
    const listWrapper = document.getElementById('list-wrapper');
    const recordListElem = document.getElementById('record-list');
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInfo = document.getElementById('page-info');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    
    const infoPanel = document.getElementById('info-panel');
    const infoText = document.getElementById('info-text');
    const editForm = document.getElementById('edit-form');
    
    const mileageInput = document.getElementById('edit-mileage');
    const gasInput = document.getElementById('edit-gas');
    const notesInput = document.getElementById('edit-notes');
    const voidBtn = document.getElementById('void-btn');

    // === 輔助函式 ===

    // 格式化日期為 YY/MM/DD
    function formatYYMMDD(isoString) {
        if (!isoString) return '待處理';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '待處理';
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yy}/${mm}/${dd}`;
    }

    /**
     * 更新分頁與列表顯示
     */
    function updatePaginationAndRender() {
        if (!recordListElem) return;
        recordListElem.innerHTML = '';

        if (recentRecords.length === 0) {
            paginationControls.style.display = 'none';
            if (infoText) infoText.textContent = '在此限制區間內，您沒有任何可修改的領還車記錄。';
            if (infoPanel) infoPanel.style.display = 'block';
            return;
        }

        // 計算分頁區間
        const totalRecords = recentRecords.length;
        const startIdx = currentPage * pageSize;
        const endIdx = Math.min(startIdx + pageSize, totalRecords);
        const pageRecords = recentRecords.slice(startIdx, endIdx);

        // 取得該頁第一筆的日期 (YY/MM/DD)
        const firstItemDate = (pageRecords.length > 0) ? formatYYMMDD(pageRecords[0].rawTime) : '無日期';

        // 更新中間文字，例如： "1-10 筆 (24/07/28)"
        pageInfo.textContent = `${startIdx + 1} - ${endIdx} 筆 (${firstItemDate})`;

        // 設定按鈕狀態
        prevPageBtn.disabled = (currentPage === 0);
        nextPageBtn.disabled = (endIdx >= totalRecords);
        paginationControls.style.display = 'flex';

        // 渲染該頁列表
        pageRecords.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'record-list-item';
            item.textContent = record.displayText; 
            // 存入實際在 recentRecords 中的原始 Index
            item.dataset.recordIndex = startIdx + index; 
            recordListElem.appendChild(item);
        });
    }

    /**
     * 處理點擊列表項目 (選取後收合列表)
     */
    function handleRecordClick(e) {
        const item = e.target.closest('.record-list-item');
        if (!item) return;

        // 隱藏列表容器，顯示「展開」按鈕
        listWrapper.style.display = 'none';
        toggleListBtn.style.display = 'block';
        
        const index = item.dataset.recordIndex;
        selectedRecord = recentRecords[index];
        
        if (mileageInput) mileageInput.value = selectedRecord.mileage;
        if (gasInput) gasInput.value = selectedRecord.gas;
        if (notesInput) notesInput.value = selectedRecord.notes;
        
        if (editForm) editForm.style.display = 'block';
    }

    /**
     * 點擊展開按鈕
     */
    function handleToggleList() {
        listWrapper.style.display = 'block';
        toggleListBtn.style.display = 'none';
    }

    /**
     * 分頁按鈕點擊
     */
    function goPrevPage() {
        if (currentPage > 0) {
            currentPage--;
            updatePaginationAndRender();
        }
    }
    function goNextPage() {
        if ((currentPage + 1) * pageSize < recentRecords.length) {
            currentPage++;
            updatePaginationAndRender();
        }
    }

    /**
     * 處理「儲存修改」
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!selectedRecord) {
            showModalAlert('請先選擇一筆要修改的記錄。');
            return;
        }

        const params = {
            recordId: selectedRecord.recordId,
            userId: liffProfile.userId,
            mileage: mileageInput.value,
            gas: gasInput.value,
            notes: notesInput.value,
            mode: 'update'
        };

        showLoading(); 
        try {
            const result = await callGasApi('updateRecordDetails', params);
            if (result.status === 'success') {
                showModalAlert(result.message, '系統訊息');
                if (editForm) editForm.style.display = 'none';
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showModalAlert(`更新失敗: ${result.message}`, '錯誤');
            }
        } catch (error) {
            showModalAlert(`前端錯誤: ${error.message}`, '錯誤');
        } finally {
            hideLoading();
        }
    }

    /**
     * 處理「標記事後取消」
     */
    async function handlePostCancelRecord() {
        if (!selectedRecord) return;
        
        const isConfirmed = await showModalConfirm('確定要將這筆紀錄「標記事後取消」嗎？\n此操作無法恢復，且會從列表中隱藏。', '標記事後取消');
        if (!isConfirmed) return;

        showLoading(); 
        const params = {
            recordId: selectedRecord.recordId,
            userId: liffProfile.userId,
            mode: 'post_cancel' // 標記為事後取消
        };

        try {
            const result = await callGasApi('updateRecordDetails', params);
            if (result.status === 'success') {
                showModalAlert('紀錄已成功標記事後取消！', '系統訊息');
                if (editForm) editForm.style.display = 'none';
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showModalAlert(`標記失敗: ${result.message}`, '錯誤');
            }
        } catch (error) {
            showModalAlert(`前端錯誤: ${error.message}`, '錯誤');
        } finally {
            hideLoading();
        }
    }

    // === 初始化與事件綁定 ===
    try {
        liffProfile = await initializeLiff();
        if (!liffProfile) return;

        const result = await callGasApi('getRecentRecords', { userId: liffProfile.userId });
        if (result.status === 'success') {
            recentRecords = result.data;
            updatePaginationAndRender();
        } else {
            showModalAlert(result.message || '無法載入歷史記錄。', '錯誤');
        }

        // 綁定事件
        if (recordListElem) recordListElem.addEventListener('click', handleRecordClick);
        if (toggleListBtn) toggleListBtn.addEventListener('click', handleToggleList);
        if (prevPageBtn) prevPageBtn.addEventListener('click', goPrevPage);
        if (nextPageBtn) nextPageBtn.addEventListener('click', goNextPage);
        
        if (editForm) editForm.addEventListener('submit', handleFormSubmit);
        if (voidBtn) voidBtn.addEventListener('click', handlePostCancelRecord);

    } catch (e) {
        console.error("History page initialization failed", e);
        showModalAlert("頁面初始化失敗，請重新整理。", "錯誤");
    }
}
