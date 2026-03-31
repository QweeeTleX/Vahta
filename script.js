const cycles = {
    1: ["Отсыпной","В","Д1","Д2","В","В","Н1","Н2"],
    2: ["Д1","Д2","В","В","Н1","Н2","Отсыпной","В"],
    3: ["Н1","Н2","Отсыпной","В","Д1","Д2","В","В"],
    4: ["В","В","Н1","Н2","Отсыпной","В","Д1","Д2"]
};

const label = {
    "Н1": "Ночная 1 (19:00-07:00)",
    "Н2": "Ночная 2 (19:00-07:00)",
    "Д1": "Дневная 1 (07:00-19:00)",
    "Д2": "Дневная 2 (07:00-19:00)",
    "Отсыпной": "Отсыпной",
    "В": "Выходной"
};

const cycleStart = new Date(2025, 10, 26);

let extraShifts = [];
let removedShifts = [];


function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function daysBetween(a, b) {
    return Math.floor(
        (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
         Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000
    );
}

function getExtra(date) {
    return extraShifts.find(s => s.date === dateKey(date));
}


function getShift(date, team) {
    const key = dateKey(date);

    if (removedShifts.includes(key)) {
        return null;
    }

    const extra = getExtra(date);
    if (extra) return extra.code;

    const cycle = cycles[team];
    const daysPassed = daysBetween(date, cycleStart);
    const index = ((daysPassed % 8) + 8) % 8;

    return cycle[index];
}


function generateCalendar(team) {
    const now = new Date();
    renderMonth(now.getFullYear(), now.getMonth(), team, "calendar");
}

function generateNextMonthCalendar(team) {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    renderMonth(next.getFullYear(), next.getMonth(), team, "nextCalendar");
}

function renderMonth(year, month, team, targetId) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const todayKey = dateKey(new Date());

    let html = `
        <h2>${first.toLocaleString("ru", { month: "long", year: "numeric" })}</h2>
        <table>
        <tr>
            <th>Пн</th><th>Вт</th><th>Ср</th>
            <th>Чт</th><th>Пт</th><th>Сб</th><th>Вс</th>
        </tr>
        <tr>
    `;

    const startWeekday = (first.getDay() || 7);
    for (let i = 1; i < startWeekday; i++) html += "<td></td>";

    for (let day = 1; day <= last.getDate(); day++) {
        const date = new Date(year, month, day);
        const shift = getShift(date, team);
        const extra = getExtra(date);
        const isToday = dateKey(date) === todayKey;

        if (shift === null) {
            html += `
                <td class="removed">
                    <b>${day}</b><br>—
                </td>
            `;
            if ((date.getDay() || 7) === 7) html += "</tr><tr>";
            continue;
        }

        const cls =
            (shift.startsWith("Д") ? "day-shift" :
             shift.startsWith("Н") ? "night-shift" : "") +
            (extra ? " extra-shift extra" : "") +
            (isToday ? " today" : "");

        html += `
            <td class="${cls}">
                <b>${day}</b><br>
                ${extra ? `Подработка: ${label[extra.code]}` : label[shift]}
            </td>
        `;

        if ((date.getDay() || 7) === 7) html += "</tr><tr>";
    }

    html += "</tr></table>";
    document.getElementById(targetId).innerHTML = html;
}


document.getElementById("addExtraBtn").addEventListener("click", () => {
    const dateStr = document.getElementById("extraDate").value;
    const type = document.getElementById("extraType").value;

    if (!dateStr) {
        alert("Выбери дату");
        return;
    }

    const idx = extraShifts.findIndex(s => s.date === dateStr);

    if (idx >= 0) {
        extraShifts[idx].code = type;
    } else {
        extraShifts.push({ date: dateStr, code: type });
    }

    removedShifts = removedShifts.filter(d => d !== dateStr);

    const team = Number(document.querySelector(".tab.active").dataset.team);
    generateCalendar(team);
    generateNextMonthCalendar(team);
});

document.getElementById("clearExtrasBtn").addEventListener("click", () => {
    if (!confirm("Удалить все подработки?")) return;

    extraShifts = [];

    const team = Number(document.querySelector(".tab.active").dataset.team);
    generateCalendar(team);
    generateNextMonthCalendar(team);
});


document.getElementById("removeShiftBtn").addEventListener("click", () => {
    const dateStr = document.getElementById("extraDate").value;

    if (!dateStr) {
        alert("Выбери дату");
        return;
    }

    if (!removedShifts.includes(dateStr)) {
        removedShifts.push(dateStr);
    }

    extraShifts = extraShifts.filter(s => s.date !== dateStr);

    const team = Number(document.querySelector(".tab.active").dataset.team);
    generateCalendar(team);
    generateNextMonthCalendar(team);
});


document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const team = Number(btn.dataset.team);
        generateCalendar(team);
        generateNextMonthCalendar(team);
    });
});


generateCalendar(2);
generateNextMonthCalendar(2);
