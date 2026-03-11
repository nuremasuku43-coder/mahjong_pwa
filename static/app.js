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
//  ウマ・オカ プリセット
// ===============================
document.querySelectorAll(".preset").forEach(btn => {
    btn.addEventListener("click", () => {
        const uma = btn.dataset.uma;
        const oka = btn.dataset.oka;

        document.getElementById("uma-input").value = uma;
        document.getElementById("oka-input").value = oka;

        saveSettings(uma, oka);

        alert(`プリセット「${btn.textContent}」を適用しました`);
    });
});


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

    localStorage.setItem("last_players", JSON.stringify(players));

    renderTotal();
    renderHistory();
    renderDailyTotals();

    document.getElementById("hanchan-form").reset();
});


// ===============================
//  固定4人モード
// ===============================
function applyFixedMode() {
    const fixed = document.getElementById("fixed-mode").checked;
    const playerInputs = document.querySelectorAll("input[name='player']");
    const labels = document.querySelectorAll(".player-label");

    if (fixed) {
        // 名前欄を隠す
        playerInputs.forEach(input => {
            input.style.display = "none";
        });

        // 最後に使った名前を自動セット
        const last = localStorage.getItem("last_players");
        if (last) {
            const names = JSON.parse(last);
            names.forEach((name, idx) => {
                playerInputs[idx].value = name;
                labels[idx].textContent = name + "：";
            });
        }

        // ラベルを表示
        labels.forEach(label => {
            label.style.display = "inline-block";
        });

    } else {
        // 名前欄を表示
        playerInputs.forEach(input => {
            input.style.display = "inline-block";
        });

        // ラベルを非表示
        labels.forEach(label => {
            label.style.display = "none";
        });
    }
}


// ===============================
//  プレイヤー名プリセット
// ===============================
document.querySelectorAll(".player-preset").forEach(btn => {
    btn.addEventListener("click", () => {
        const names = btn.dataset.names.split(",");

        const inputs = document.querySelectorAll("input[name='player']");
        inputs.forEach((input, idx) => {
            input.value = names[idx] || "";
        });

        alert(`プリセット「${btn.textContent}」を適用しました`);
    });
});

// ===============================
//  プレイヤー名プリセット（保存・読み込み）
// ===============================
function loadPlayerPresets() {
    const data = localStorage.getItem("player_presets");
    return data ? JSON.parse(data) : [];
}

function savePlayerPresets(presets) {
    localStorage.setItem("player_presets", JSON.stringify(presets));
}

// ===============================
//  プリセットを画面に表示
// ===============================
function renderPlayerPresets() {
    const area = document.getElementById("player-preset-area");
    const presets = loadPlayerPresets();

    area.innerHTML = "";

    presets.forEach((preset, idx) => {
        const btn = document.createElement("button");
        btn.className = "btn-secondary player-preset";
        btn.textContent = preset.name;
        btn.dataset.names = preset.players.join(",");
        area.appendChild(btn);
    });

    attachPlayerPresetHandlers();
}

// ===============================
//  プリセット適用
// ===============================
function attachPlayerPresetHandlers() {
    document.querySelectorAll(".player-preset").forEach(btn => {
        btn.addEventListener("click", () => {
            const names = btn.dataset.names.split(",");
            const inputs = document.querySelectorAll("input[name='player']");

            inputs.forEach((input, idx) => {
                input.value = names[idx] || "";
            });

            // 最後に使った名前として保存
            localStorage.setItem("last_players", JSON.stringify(names));

            alert(`プリセット「${btn.textContent}」を適用しました`);
        });
    });
}

// ===============================
//  プリセット追加ボタン
// ===============================
document.getElementById("add-player-preset").addEventListener("click", () => {
    const name = document.getElementById("preset-name").value;
    const p1 = document.getElementById("preset-player1").value;
    const p2 = document.getElementById("preset-player2").value;
    const p3 = document.getElementById("preset-player3").value;
    const p4 = document.getElementById("preset-player4").value;

    if (!name || !p1 || !p2 || !p3 || !p4) {
        alert("プリセット名と4人の名前を入力してください");
        return;
    }

    const presets = loadPlayerPresets();
    presets.push({
        name: name,
        players: [p1, p2, p3, p4]
    });

    savePlayerPresets(presets);
    renderPlayerPresets();

    alert("プリセットを追加しました");
});

// ===============================
//  最後に使った名前を自動入力
// ===============================
function loadLastPlayers() {
    const data = localStorage.getItem("last_players");
    if (!data) return;

    const names = JSON.parse(data);
    const inputs = document.querySelectorAll("input[name='player']");

    inputs.forEach((input, idx) => {
        input.value = names[idx] || "";
    });
}



// ===============================
//  ウマ・オカ説明 折りたたみ
// ===============================
document.getElementById("toggle-explain").addEventListener("click", () => {
    const content = document.getElementById("explain-content");
    const title = document.getElementById("toggle-explain");

    if (content.style.display === "none") {
        content.style.display = "block";
        title.textContent = "▲ ウマ・オカの説明（クリックで閉じる）";
    } else {
        content.style.display = "none";
        title.textContent = "▼ ウマ・オカの説明（クリックで開く）";
    }
});

// ===============================
//  役一覧 折りたたみ
// ===============================
document.getElementById("toggle-yaku").addEventListener("click", () => {
    const content = document.getElementById("yaku-content");
    const title = document.getElementById("toggle-yaku");

    if (content.style.display === "none") {
        content.style.display = "block";
        title.textContent = "▲ 役一覧・翻数（クリックで閉じる）";
    } else {
        content.style.display = "none";
        title.textContent = "▼ 役一覧・翻数（クリックで開く）";
    }
});

// ===============================
//  符計算ツール 折りたたみ
// ===============================
document.getElementById("toggle-fu").addEventListener("click", () => {
    const box = document.getElementById("fu-tool");
    const title = document.getElementById("toggle-fu");

    if (box.style.display === "none") {
        box.style.display = "block";
        title.textContent = "▲ 符計算ツール（クリックで閉じる）";
    } else {
        box.style.display = "none";
        title.textContent = "▼ 符計算ツール（クリックで開く）";
    }
});

// ===============================
//  面子追加 UI
// ===============================
document.getElementById("add-mentsu").addEventListener("click", () => {
    const area = document.getElementById("mentsu-list");

    const div = document.createElement("div");
    div.className = "mentsu-row";
    div.style.marginBottom = "8px";

    div.innerHTML = `
        <select class="mentsu-type">
            <option value="0">順子（0符）</option>

            <option value="2">中張牌の明刻（+2符）</option>
            <option value="4">ヤオ九牌の明刻（+4符）</option>

            <option value="4a">中張牌の暗刻（+4符）</option>
            <option value="8a">ヤオ九牌の暗刻（+8符）</option>

            <option value="8k">中張牌の明槓（+8符）</option>
            <option value="16k">ヤオ九牌の明槓（+16符）</option>

            <option value="16ka">中張牌の暗槓（+16符）</option>
            <option value="32ka">ヤオ九牌の暗槓（+32符）</option>
        </select>

        <button class="remove-mentsu btn-danger">削除</button>
    `;

    area.appendChild(div);

    // 削除ボタン
    div.querySelector(".remove-mentsu").addEventListener("click", () => {
        div.remove();
    });
});



// ===============================
//  符計算ロジック（鳴き対応）
// ===============================
document.getElementById("calc-fu").addEventListener("click", () => {
    let fu = 20; // 基本符

    const menzen = document.getElementById("menzen").checked;
    const tsumo = document.getElementById("tsumo").checked;
    const naki = document.getElementById("naki").checked;

// 面子（複数対応）
let mentsuTotal = 0;

document.querySelectorAll(".mentsu-type").forEach(sel => {
    const v = sel.value;

    if (v === "0") return;

    if (v.endsWith("ka")) {
        // 暗槓
        mentsuTotal += Number(v.replace("ka", ""));
    } else if (v.endsWith("k")) {
        // 明槓
        mentsuTotal += Number(v.replace("k", ""));
    } else if (v.endsWith("a")) {
        // 暗刻
        mentsuTotal += Number(v.replace("a", ""));
    } else {
        // 明刻
        mentsuTotal += Number(v);
    }
});

fu += mentsuTotal;

    // 待ち
    const machi = document.getElementById("machi").value;
    if (machi !== "0") fu += 2;

    // 雀頭
    const atama = document.getElementById("atama").value;
    if (atama !== "0") fu += 2;

    // ツモ
    if (tsumo) fu += 2;

    // 門前ロン +10符（鳴きなら付かない）
    if (menzen && !tsumo && !naki) fu += 10;

    // 10符単位に切り上げ
    fu = Math.ceil(fu / 10) * 10;

    document.getElementById("fu-result").textContent = `符：${fu}符`;

    // 点数計算ツールに自動入力
    const fuInput = document.getElementById("fu-input");
    if (fuInput) fuInput.value = fu;
});


// ===============================
//  点数計算（符 × 翻）
// ===============================
document.getElementById("calc-score").addEventListener("click", () => {
    const fu = Number(document.getElementById("fu-input").value);
    const han = Number(document.getElementById("han-input").value);
    const resultArea = document.getElementById("score-result");

    if (!fu || !han) {
        resultArea.textContent = "符と翻を入力してください。";
        return;
    }

    // 役満系
    if (han >= 13) {
        resultArea.textContent = "役満：32000点（親） / 16000点（子）";
        return;
    }
    if (han >= 11) {
        resultArea.textContent = "三倍満：24000点（親） / 12000点（子）";
        return;
    }
    if (han >= 8) {
        resultArea.textContent = "倍満：16000点（親） / 8000点（子）";
        return;
    }
    if (han >= 6) {
        resultArea.textContent = "跳満：12000点（親） / 6000点（子）";
        return;
    }

    // 満貫判定（翻＋符で決まるパターンを考慮）
    const isMangan =
        han >= 5 ||
        (han === 4 && fu >= 40) ||
        (han === 3 && fu >= 70);

    if (isMangan) {
        resultArea.textContent = "満貫：12000点（親） / 8000点（子）";
        return;
    }

    // ここから下は通常計算
    let base = fu * Math.pow(2, han + 2);

    let koRon = Math.ceil(base * 4 / 100) * 100;
    let oyaRon = Math.ceil(base * 6 / 100) * 100;

    let koTsumoOya = Math.ceil(base * 2 / 100) * 100;
    let koTsumoKo = Math.ceil(base / 100) * 100;
    let oyaTsumo = Math.ceil(base * 2 / 100) * 100;

    resultArea.innerHTML = `
        親ロン：${oyaRon} 点<br>
        子ロン：${koRon} 点<br>
        親ツモ：${oyaTsumo} オール<br>
        子ツモ：${koTsumoOya}（親） / ${koTsumoKo}（子）
    `;
});



// ===============================
//  初期表示
// ===============================
renderTotal();
renderHistory();
renderDailyTotals();
renderPlayerPresets();
loadLastPlayers();
applyFixedMode();
