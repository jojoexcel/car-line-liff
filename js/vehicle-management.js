// js/vehicle-management.js
async function initializeVehicleManagementPage() {
    // --- 權限驗證 ---
    const liffProfile = await initializeLiff();
    if (!liffProfile) return;
    const adminProfile = await callGasApi('getUserProfile', { userId: liffProfile.userId });
    if (adminProfile.status !== 'found' || (adminProfile.data.status !== '管理者' && adminProfile.data.status !== '開發者')) {
        document.getElementById('auth-panel').textContent = '權限不足！';
        return;
    }
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('management-panel').style.display = 'block';

    // --- DOM 元素 ---
    const vehicleListBody = document.getElementById('vehicle-list');
    const modal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('vehicle-form');
    // ... (所有 modal 內的 input 元素)

    // --- 函式 ---
    function renderVehicleList(vehicles) {
        vehicleListBody.innerHTML = '';
        vehicles.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.plate}</td>
                <td>${v.spec}</td>
                <td>${v.status}</td>
                <td><button class="edit-btn" data-row-num="${v.rowNum}">編輯</button></td>
            `;
            vehicleListBody.appendChild(tr);
        });
    }

    async function loadVehicles() {
        const result = await callGasApi('getVehicles');
        if (result.status === 'success') {
            renderVehicleList(result.data);
        } else {
            alert('載入車輛列表失敗: ' + result.message);
        }
    }

    function openModal(mode, vehicle = {}) {
        document.getElementById('modal-mode').value = mode;
        document.getElementById('modal-title').textContent = mode === 'add' ? '新增車輛' : '修改車輛狀態';
        document.getElementById('modal-plate').value = vehicle.plate || '';
        document.getElementById('modal-spec').value = vehicle.spec || '';
        document.getElementById('modal-qrcode').value = vehicle.qrcode || '';
        document.getElementById('modal-status').value = vehicle.status || '可借';
        document.getElementById('modal-description').value = vehicle.description || '';
        document.getElementById('modal-rowNum').value = vehicle.rowNum || '';
        // 新增時，車牌和規格可編輯；修改時則鎖定
        document.getElementById('modal-plate').disabled = (mode === 'update');
        document.getElementById('modal-spec').disabled = (mode === 'update');
        document.getElementById('modal-qrcode').disabled = (mode === 'update');
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const params = {
            mode: document.getElementById('modal-mode').value,
            rowNum: document.getElementById('modal-rowNum').value,
            plate: document.getElementById('modal-plate').value,
            spec: document.getElementById('modal-spec').value,
            qrcode: document.getElementById('modal-qrcode').value,
            status: document.getElementById('modal-status').value,
            description: document.getElementById('modal-description').value,
        };
        const result = await callGasApi('upsertVehicle', params);
        if (result.status === 'success') {
            alert(result.message);
            closeModal();
            loadVehicles(); // 重新載入列表
        } else {
            alert('操作失敗: ' + result.message);
        }
    }

    // --- 事件綁定 ---
    document.getElementById('add-vehicle-btn').addEventListener('click', () => openModal('add'));
    vehicleListBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const rowNum = e.target.dataset.rowNum;
            // 為了獲取最新的資料，可以重新請求一次
            const result = await callGasApi('getVehicles');
            if (result.status === 'success') {
                const vehicleToEdit = result.data.find(v => v.rowNum == rowNum);
                if (vehicleToEdit) openModal('update', vehicleToEdit);
            }
        }
    });
    vehicleForm.addEventListener('submit', handleFormSubmit);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    // --- 頁面初始化 ---
    loadVehicles();
}