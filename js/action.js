<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>領車 / 還車</title>
    <link rel="stylesheet" href="./css/style.css">
    <style>
        /* 新增的樣式 */
        .action-list button {
            background-color: #f0f0f0;
            color: #333;
            border: 1px solid #ccc;
            margin-bottom: 10px;
            text-align: left;
            padding-left: 20px;
        }
        .action-list button.pickup {
            border-left: 5px solid #5cb85c; /* 綠色代表領車 */
        }
        .action-list button.return {
            border-left: 5px solid #f0ad4e; /* 橘色代表還車 */
        }
    </style>
</head>
<body>
    <div id="loading-overlay">檢查中...</div>
    <div class="container">
        <h1>領車 / 還車</h1>
        
        <!-- 步驟一：動作選擇 (新增) -->
        <div id="selection-panel" style="display: none;">
            <h2>請選擇您要執行的操作</h2>
            <div id="action-list" class="action-list">
                <!-- JS 會在這裡動態產生按鈕 -->
            </div>
        </div>

        <!-- 預設顯示的訊息 -->
        <div id="info-panel">
            <p id="info-text">正在檢查您的預約狀態...</p>
        </div>

        <!-- 領車表單 (維持不變，預設隱藏) -->
        <form id="pickup-form" style="display: none;">
            <!-- ... 表單內容維持不變 ... -->
        </form>

        <!-- 還車表單 (維持不變，預設隱藏) -->
        <form id="return-form" style="display: none;">
            <!-- ... 表單內容維持不變 ... -->
        </form>
        
        <div id="message-box" class="message" style="display: none;"></div>
    </div>

    <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
    <script src="./js/main.js"></script>
    <script src="./js/action.js"></script>
</body>
</html>
