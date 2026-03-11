from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = "change-this"

# メモリ上に履歴を保持（本番ならDB推奨）
hanchan_history = []
players_global = ["", "", "", ""]

UMA = [20, 10, -10, -20]
BASE_SCORE = 25000

@app.route("/", methods=["GET", "POST"])
def index():
    global hanchan_history, players_global

    if request.method == "POST":
        players = request.form.getlist("player")
        scores_raw = request.form.getlist("score")

        players_global = players
        scores = [int(s) if s else 0 for s in scores_raw]

        data = list(zip(players, scores))
        sorted_data = sorted(data, key=lambda x: x[1], reverse=True)

        hanchan_no = len(hanchan_history) + 1
        hanchan_result = []
        for rank, (player, score) in enumerate(sorted_data):
            point = (score - BASE_SCORE) / 1000 + UMA[rank]
            hanchan_result.append({
                "rank": rank + 1,
                "player": player,
                "score": score,
                "point": point
            })

        hanchan_history.append({
            "no": hanchan_no,
            "results": hanchan_result
        })

        return redirect(url_for("index"))

    total_points = {}
    for h in hanchan_history:
        for r in h["results"]:
            p = r["player"]
            total_points.setdefault(p, 0)
            total_points[p] += r["point"]

    total_sorted = sorted(
        total_points.items(),
        key=lambda x: x[1],
        reverse=True
    )

    return render_template(
        "index.html",
        players=players_global,
        hanchan_history=hanchan_history,
        total_sorted=total_sorted
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
