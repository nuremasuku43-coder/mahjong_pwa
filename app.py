// ===============================
//  設定（ウマ・オカ）
// ===============================
function loadSettings() {
    const uma = localStorage.getItem("uma");
    const oka = localStorage.getItem("oka");

    return {
        UMA: uma ? uma.split(",").map(Number) : [20, 10, -10, -20],
        BASE_SCORE: oka ? Number(oka) : 25000
    };
}

function saveSettings(uma, oka) {
    localStorage.setItem("uma", uma);
    localStorage.setItem("oka", oka);
}

// ===============================
//  履歴の保存・読み込み
// ===============================
function loadHistory() {
    const data = localStorage.getItem("hanchan_history");
    return data ? JSON.parse(data) : [];
}

function saveHistory(history) {
    localStorage.setItem("hanchan_history", JSON.stringify(history));
}

// ===============================
//  半荘を追加
// ===============================
function addHanchan(players, scores) {
    const settings = loadSettings();
    const UMA = settings.UMA;
    const BASE_SCORE = settings.BASE_SCORE;

    let history = loadHistory();
    const hanchanNo = history.length + 1;

    const data = players.map((p, i) => ({ player: p, score: scores[i] }));
    const sorted = data.sort((a, b) => b.score - a.score);

    const results = sorted.map((item, idx) => {
        const point = (item.score - BASE_SCORE) / 1000 + UMA[idx];
        return {
            rank: idx + 1,
            player: item.player,
            score: item.score,
            point: point
        };
    });

    history.push({
        no: hanchanNo,
        date: new Date().toISOString().slice(0, 10),
        results: results
    });

    saveHistory(history);
}

// ===============================
//  トータル成績
// ===============================
function calcTotalPoints() {
    const history = loadHistory();
    const total = {};

    history.forEach(h => {
        h.results.forEach(r => {
            if (!total[r.player]) total[r.player] = 0;
            total[r.player] += r.point;
        });
    });

    return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

function renderTotal() {
    const area = document.getElementById("total-table-area");
    const total = calcTotalPoints();

    if (total.length === 0) {
        area.innerHTML = "<p>まだ対局が登録されていません。</p>";
        return;
    }

    let html = `
        <table>
            <thead>
                <tr><th>順位</th><th>プレイヤー</th><th>トータルpt</th></tr>
            </thead>
            <tbody>
    `;

    total.forEach((item, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${item[0]}</td>
                <td>${item[1].toFixed(1)}</td>
            </tr>
        `;
    });

    html += "</tbody></table>";
    area.innerHTML = html;
}

// ===============================
//  日付ごとの成績
// ===============================
function calcDailyTotals() {
    const history = loadHistory();
    const daily = {};

    history.forEach(h => {
        const date = h.date;
        if (!daily[date]) daily[date] = {};

        h.results.forEach(r => {
            if (!daily[date][r.player]) daily[date][r.player] = 0;
            daily[date][r.player] += r.point;
        });
    });

    return daily;
}

function renderDailyTotals() {
    const area = document.getElementById("daily-total-area");
    const daily = calcDailyTotals();

    const dates = Object.keys(daily).sort();
    if (dates.length === 0) {
        area.innerHTML = "<p>まだデータがありません。</p>";
        return;
    }

    let html = "";

    dates.forEach(date => {
        html += `<h3>${date}</h3>`;
        html += `
            <table>
                <thead>
                    <tr><th>プレイヤー</th><th>合計pt</th></tr>
                </thead>
                <tbody>
        `;

        const players = Object.entries(daily[date]).sort((a, b) => b[1] - a[1]);

        players.forEach(([player, pt]) => {
            html += `
                <tr>
                    <td>${player}</td>
                    <td>${pt.toFixed(1)}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
    });

    area.innerHTML = html;
}

// ===============================
//  履歴表示（削除ボタン付き）
// ===============================
function renderHistory() {
    const area = document.getElementById("history-area");
    const history = loadHistory();

    if (history.length === 0) {
        area.innerHTML = "<p>履歴はまだありません。</p>";
        return;
    }

    let html = "";

    history.slice().reverse().forEach(h => {
        html += `
            <div class="hanchan-block">
                <h3>${h.no}回目の半荘 
                    <button class="delete-hanchan" data-no="${h.no}">削除</button>
                </h3>
                <table>
                    <thead>
                        <tr><th>順位</th><th>プレイヤー</th><th>点数</th><th>pt</th></tr>
                    </thead>
                    <tbody>
        `;

        h.results.forEach(r => {
            html += `
                <tr>
                    <td>${r.rank}</td>
                    <td>${r.player}</td>
                    <td>${r.score}</td>
                    <td>${r.point.toFixed(1)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    area.innerHTML = html;
    attachDeleteHandlers();
}

// ===============================
//  個別削除
// ===============================
function attachDeleteHandlers() {
    document.querySelectorAll(".delete-hanchan").forEach(btn => {
        btn.addEventListener("click", () => {
            const no = Number(btn.dataset.no);
            let history = loadHistory();

            history = history.filter(h => h.no !== no);
            history.forEach((h, idx) => h.no = idx + 1);

            saveHistory(history);

            renderTotal();
            renderHistory();
            renderDailyTotals();
        });
    });
}

// ===============================
//  全削除
// ===============================
document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("本当に全データを削除しますか？")) return;

    localStorage.removeItem("hanchan_history");

    renderTotal();
    renderHistory();
    renderDailyTotals();

    alert("データをリセットしました");
});

// ===============================
//  ウマ・オカ設定保存
// ===============================
document.getElementById("save-settings").addEventListener("click", () => {
    const uma = document.getElementById("uma-input").value;
    const oka = document.getElementById("oka-input").value;

    saveSettings(uma, oka);
    alert("設定を保存しました");
});

// ===============================
//  半荘入力フォーム
// ===============================
document.getElementById("hanchan-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const players = Array.from(document.querySelectorAll("input[name='player']")).map(i => i.value);
    const scores = Array.from(document.querySelectorAll("input[name='score']")).map(i => Number(i.value));

    addHanchan(players, scores);

    renderTotal();
    renderHistory();
    renderDailyTotals();

    document.getElementById("hanchan-form").reset();
});

// ===============================
//  初期表示
// ===============================
renderTotal();
renderHistory();
renderDailyTotals();
