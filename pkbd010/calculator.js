// 상성표 및 배율 데이터
const typeChart = { "Normal": { "Fighting": 2, "Ghost": 0 }, "Fire": { "Fire": 0.5, "Water": 2, "Grass": 0.5, "Ice": 0.5, "Ground": 2, "Rock": 2, "Bug": 0.5, "Steel": 0.5, "Fairy": 0.5 }, "Water": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Electric": 2, "Ice": 0.5, "Steel": 0.5 }, "Grass": { "Fire": 2, "Water": 0.5, "Grass": 0.5, "Electric": 0.5, "Ice": 2, "Poison": 2, "Ground": 0.5, "Flying": 2, "Bug": 2 }, "Electric": { "Electric": 0.5, "Ground": 2, "Flying": 0.5, "Steel": 0.5 }, "Ice": { "Fire": 2, "Ice": 0.5, "Fighting": 2, "Rock": 2, "Steel": 2 }, "Fighting": { "Flying": 2, "Psychic": 2, "Bug": 0.5, "Rock": 0.5, "Dark": 0.5, "Fairy": 2 }, "Poison": { "Grass": 0.5, "Fighting": 0.5, "Poison": 0.5, "Ground": 2, "Psychic": 2, "Bug": 0.5, "Fairy": 0.5 }, "Ground": { "Water": 2, "Grass": 2, "Electric": 0, "Ice": 2, "Poison": 0.5, "Rock": 0.5 }, "Flying": { "Grass": 0.5, "Electric": 2, "Ice": 2, "Fighting": 0.5, "Ground": 0, "Bug": 0.5, "Rock": 2 }, "Psychic": { "Fighting": 0.5, "Psychic": 0.5, "Bug": 2, "Ghost": 2, "Dark": 2 }, "Bug": { "Fire": 2, "Grass": 0.5, "Fighting": 0.5, "Ground": 0.5, "Flying": 2, "Rock": 2 }, "Rock": { "Normal": 0.5, "Fire": 0.5, "Water": 2, "Grass": 2, "Fighting": 2, "Poison": 0.5, "Ground": 2, "Flying": 0.5, "Steel": 2 }, "Ghost": { "Normal": 0, "Fighting": 0, "Poison": 0.5, "Bug": 0.5, "Ghost": 2, "Dark": 2 }, "Dragon": { "Fire": 0.5, "Water": 0.5, "Grass": 0.5, "Electric": 0.5, "Ice": 2, "Dragon": 2, "Fairy": 2 }, "Dark": { "Fighting": 2, "Psychic": 0, "Bug": 2, "Ghost": 0.5, "Dark": 0.5, "Fairy": 2 }, "Steel": { "Normal": 0.5, "Fire": 2, "Grass": 0.5, "Ice": 0.5, "Fighting": 2, "Poison": 0, "Ground": 2, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 0.5, "Dragon": 0.5, "Steel": 0.5, "Fairy": 0.5 }, "Fairy": { "Fighting": 0.5, "Poison": 2, "Bug": 0.5, "Dragon": 0, "Dark": 0.5, "Steel": 2 } };
const typeNameKo = { "Normal": "노말", "Fire": "불꽃", "Water": "물", "Grass": "풀", "Electric": "전기", "Ice": "얼음", "Fighting": "격투", "Poison": "독", "Ground": "땅", "Flying": "비행", "Psychic": "에스퍼", "Bug": "벌레", "Rock": "바위", "Ghost": "고스트", "Dragon": "드래곤", "Dark": "악", "Steel": "강철", "Fairy": "페어리" };

const natureEffects = {
    "노력": [1, 1, 1, 1, 1], "고집": [1.1, 1, 0.9, 1, 1], "겁쟁이": [0.9, 1, 1, 1, 1.1],
    "조심": [0.9, 1, 1.1, 1, 1], "명랑": [1, 1, 0.9, 1, 1.1], "대담": [0.9, 1.1, 1, 1, 1],
    "차분": [0.9, 1, 1, 1.1, 1], "신중": [1, 1, 0.9, 1.1, 1], "장난": [1, 1.1, 0.9, 1, 1]
};

const itemEffects = { "없음": 1, "생명의구슬": 1.3, "구애머리띠": 1.5, "구애안경": 1.5, "구애스카프": 1.5 };

// 실수치 계산 로직
function updateActualStats(slot) {
    const lv = parseInt(document.getElementById(`lv-${slot}`).value) || 50;
    const nature = document.getElementById(`nature-${slot}`).value;
    const mods = natureEffects[nature] || [1, 1, 1, 1, 1];
    const statsList = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

    statsList.forEach((s, idx) => {
        const base = teamData[slot].stats[s] || 0;
        const ev = parseInt(document.getElementById(`ev-${s}-${slot}`).value) || 0;
        let act = 0;
        const actEl = document.getElementById(`act-${s}-${slot}`);

        if (s === 'hp') {
            act = Math.floor((base * 2 + 31 + ev / 4) * lv / 100 + lv + 10);
            actEl.style.color = '#2c3e50';
        } else {
            const mod = mods[idx - 1];
            act = Math.floor((Math.floor((base * 2 + 31 + ev / 4) * lv / 100) + 5) * mod);
            if (mod > 1) actEl.style.color = '#ff4757';
            else if (mod < 1) actEl.style.color = '#3498db';
            else actEl.style.color = '#2c3e50';
        }
        teamData[slot].actualStats[s] = act;
        actEl.innerText = act;
    });
    updateAllPower(slot);
}

// 결정력 계산 로직
function updateAllPower(slot) {
    const item = document.getElementById(`item-${slot}`).value;
    const itemMod = itemEffects[item] || 1;

    teamData[slot].moves.forEach((m, idx) => {
        const pEl = document.getElementById(`p${idx+1}-${slot}`);
        const dEl = document.getElementById(`d${idx+1}-${slot}`);
        
        if (!m || m.power === 0) { 
            pEl.innerText = m && m.power === 0 ? "변화기" : "-"; 
            dEl.innerText = "-"; 
            return; 
        }
        
        const statKey = m.cat === 'physical' ? 'attack' : 'special-attack';
        const stat = teamData[slot].actualStats[statKey];
        const stab = teamData[slot].types.includes(m.type) ? 1.5 : 1;
        
        const determination = Math.floor(stat * m.power * stab * itemMod);
        pEl.innerText = m.power;
        dEl.innerText = determination.toLocaleString();
    });
    updateAnalysis();
}

// 팀 분석 및 약점 계산 로직
function updateAnalysis() {
    let teamWeaknesses = {}, teamCoverage = new Set(), individualHTML = "";
    const allTypesList = Object.keys(typeChart);

    for (let i = 1; i <= 6; i++) {
        const types = teamData[i].types;
        if (types.length === 0) continue;
        
        allTypesList.forEach(atk => {
            let mult = 1.0;
            if (typeChart[types[0]]) mult *= (typeChart[types[0]][atk] || 1);
            if (types[1] && types[1] !== "None" && typeChart[types[1]]) mult *= (typeChart[types[1]][atk] || 1);
            if (mult > 1) teamWeaknesses[atk] = (teamWeaknesses[atk] || 0) + 1;
        });
    }

    for (let i = 1; i <= 6; i++) {
        const types = teamData[i].types;
        if (types.length === 0) continue;
        let pWeak = [];
        allTypesList.forEach(atk => {
            let mult = 1.0;
            if (typeChart[types[0]]) mult *= (typeChart[types[0]][atk] || 1);
            if (types[1] && types[1] !== "None" && typeChart[types[1]]) mult *= (typeChart[types[1]][atk] || 1);
            if (mult > 1) pWeak.push({type: atk, mult: mult});
        });

        individualHTML += `<div>
            <strong>ENTRY #${i}</strong>: ${pWeak.map(w => {
                const isShared = teamWeaknesses[w.type] >= 2 ? 'team-shared-pulse' : '';
                const isFatal = w.mult >= 4 ? 'x4-red-text' : '';
                return `<span class="weakness-tag ${w.type} ${isShared} ${isFatal}"><span class="type-name">${typeNameKo[w.type]}</span><span class="multiplier">x${w.mult}</span></span>`;
            }).join('')}
        </div>`;

        teamData[i].moves.forEach(move => {
            if (move && move.cat !== 'status') {
                allTypesList.forEach(def => {
                    if (typeChart[def] && typeChart[def][move.type] > 1) teamCoverage.add(def);
                });
            }
        });
    }

    document.getElementById('individual-results').innerHTML = individualHTML || "포켓몬을 추가하면 분석이 시작됩니다.";
    const critical = Object.keys(teamWeaknesses).filter(t => teamWeaknesses[t] >= 2);
    document.getElementById('team-weak-summary').innerHTML = critical.map(t => `<span class="weakness-tag ${t}"><span class="type-name">${typeNameKo[t]}</span><span class="multiplier">${teamWeaknesses[t]}마리</span></span>`).join('') || "없음";
    document.getElementById('team-coverage-summary').innerHTML = Array.from(teamCoverage).map(t => `<span class="weakness-tag ${t}"><span class="type-name">${typeNameKo[t]}</span></span>`).join('') || "없음";
    document.getElementById('team-missing-summary').innerHTML = allTypesList.filter(t => !teamCoverage.has(t)).map(t => `<span class="weakness-tag ${t}"><span class="type-name">${typeNameKo[t]}</span></span>`).join('') || "완벽함!";
}