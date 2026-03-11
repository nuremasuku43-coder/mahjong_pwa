// ===============================
//  定数
// ===============================
const UMA = [20, 10, -10, -20];
const BASE_SCORE = 25000;

// ===============================
//  LocalStorage からデータ取得
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
    let history = loadHistory();
    const hanchanNo = history.length + 1;

    // スコアを結合して並び替え
    const data = players.map((p, i) => ({ player: p, score: scores[i] }));
    const sorted = data.sort((a, b) => b.score - a.score);

    // UMA + 素点計算
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
        results: results
    });

    saveHistory(history);
}

// ===============================
//  トータル成績を計算
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

    return Object.entries(total)
        .sort((a, b) => b[1] - a[1]); // 降順
}

// ===============================
//  画面に表示
// ===============================
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
                <h3>${h.no}回目の半荘</h3>
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
}

// ===============================
//  フォーム送信処理
// ===============================
document.getElementById("hanchan-form").addEventListener("submit", function(e) {
    e.preventDefault(); // ページ遷移しない

    const players = Array.from(document.querySelectorAll("input[name='player']")).map(i => i.value);
    const scores = Array.from(document.querySelectorAll("input[name='score']")).map(i => Number(i.value));

    addHanchan(players, scores);

    renderTotal();
    renderHistory();

    // 入力欄をクリア
    document.getElementById("hanchan-form").reset();
});

// ===============================
//  初期表示
// ===============================
renderTotal();
renderHistory();
