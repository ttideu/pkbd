let teamData = Array(7).fill(null).map(() => ({ 
    types: [], stats: {}, actualStats: {}, moves: [null, null, null, null],
    ability: "None", nature: "노력", item: "없음", lv: 50
}));

// moveData.js의 데이터를 바탕으로 영문->한글 기술 번역 사전을 자동 생성
const moveNames = {};
if (typeof moveDataDetail !== 'undefined') {
    for (let koName in moveDataDetail) {
        const engId = moveDataDetail[koName].id;
        moveNames[engId] = koName;
    }
} else {
    console.error("🚨 로컬 기술 데이터(moveData.js)를 불러오지 못했습니다!");
}

let currentNpcTeamWithTypes = null;

const container = document.getElementById('team-container');
for (let i = 1; i <= 6; i++) {
    container.innerHTML += `
        <div class="pokemon-slot">
            <span class="slot-title">ENTRY ${i}</span>
            <div class="input-group">
                <input type="text" class="name-input" id="name-${i}" placeholder="포켓몬 이름">
                <div id="list-${i}" class="autocomplete-list"></div>
            </div>
            
            <div class="pokemon-info-row">
                <img src="" id="img-${i}" style="display:none;">
                <div id="types-display-${i}" style="display:flex; gap:5px; justify-content:center;"></div>
            </div>
            
            <div class="extra-settings">
                <select id="ability-${i}" class="small-select" onchange="teamData[${i}].ability=this.value; updateAllPower(${i})"><option>특성</option></select>
                <select id="nature-${i}" class="small-select" onchange="teamData[${i}].nature=this.value; updateActualStats(${i})">
                    ${Object.keys(natureEffects).map(n => `<option value="${n}">${n}</option>`).join('')}
                </select>
                <select id="item-${i}" class="small-select" onchange="teamData[${i}].item=this.value; updateAllPower(${i})">
                    ${Object.keys(itemEffects).map(it => `<option value="${it}">${it}</option>`).join('')}
                </select>
                <input type="number" id="lv-${i}" class="lv-input" value="50" min="1" max="100" oninput="teamData[${i}].lv=this.value; updateActualStats(${i})">
            </div>

            <div class="stats-container">
                <div class="stat-header">
                    <span>스탯</span>
                    <span>종족값</span>
                    <span>노력치</span>
                    <span>실수치</span>
                </div>
                ${[['hp','H'],['attack','A'],['defense','B'],['special-attack','C'],['special-defense','D'],['speed','S']].map(([s, label]) => `
                    <div class="stat-row">
                        <strong>${label}</strong>
                        <span id="base-${s}-${i}" class="base-val">0</span>
                        <input type="number" class="ev-input" id="ev-${s}-${i}" value="0" min="0" max="252" oninput="updateActualStats(${i})">
                        <span id="act-${s}-${i}" class="act-val">0</span>
                    </div>
                `).join('')}
            </div>

            <div class="move-grid">
                ${[1,2,3,4].map(m => `
                    <div class="move-row">
                        <select class="move-input" id="m${m}-${i}" onchange="onMoveChange(${i}, ${m}, this.value)"><option value="None">기술</option></select>
                        <span class="power-val" id="p${m}-${i}">-</span>
                        <span class="dmg-val" id="d${m}-${i}">-</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 자동완성 로직 (이제 다운받은 로컬 도감 pokemonDataDetail 전체를 기반으로 검색!)
document.querySelectorAll('.name-input').forEach(input => {
    const slot = input.id.split('-')[1];
    input.addEventListener('input', () => {
        const value = input.value.trim().toLowerCase();
        const list = document.getElementById(`list-${slot}`);
        if (!value) { list.innerHTML = ''; return; }
        
        if (typeof pokemonDataDetail !== 'undefined') {
            const matches = Object.keys(pokemonDataDetail).filter(ko => ko.includes(value)).slice(0, 8);
            list.innerHTML = matches.map(m => `<div onclick="selectPokemon(${slot}, '${m}')">${m}</div>`).join('');
        }
    });
});

function selectPokemon(slot, nameKo) {
    document.getElementById(`name-${slot}`).value = nameKo;
    document.getElementById(`list-${slot}`).innerHTML = '';
    fetchPokemon(slot);
}

// 하이브리드 방식: 1. 정보는 로컬에서 즉시 렌더링 -> 2. 기술 목록만 API 호출
async function fetchPokemon(slot) {
    const nameKo = document.getElementById(`name-${slot}`).value;
    
    // 1. 로컬 데이터에서 포켓몬 찾기
    if (typeof pokemonDataDetail === 'undefined' || !pokemonDataDetail[nameKo]) {
        console.warn("로컬 도감에 해당 포켓몬이 없습니다:", nameKo);
        return;
    }
    
    const pkmnInfo = pokemonDataDetail[nameKo];

    // 즉시 UI 업데이트 (스탯, 타입, 특성, 이미지)
    teamData[slot].types = pkmnInfo.types;
    
    for (let statName in pkmnInfo.stats) {
        teamData[slot].stats[statName] = pkmnInfo.stats[statName];
        const baseEl = document.getElementById(`base-${statName}-${slot}`);
        if (baseEl) {
            baseEl.innerText = pkmnInfo.stats[statName];
            let color = pkmnInfo.stats[statName] >= 130 ? '#ff4757' : (pkmnInfo.stats[statName] >= 100 ? '#ffa502' : '#777');
            baseEl.style.color = color;
        }
    }

    document.getElementById(`img-${slot}`).src = pkmnInfo.sprite;
    document.getElementById(`img-${slot}`).style.display = "block";
    document.getElementById(`types-display-${slot}`).innerHTML = teamData[slot].types.map(t => 
        `<span class="weakness-tag ${t}"><span class="type-name">${typeNameKo[t] || t}</span></span>`
    ).join('');

    const abilitySelect = document.getElementById(`ability-${slot}`);
    abilitySelect.innerHTML = pkmnInfo.abilities.map(a => 
        `<option value="${a}">${a}</option>`
    ).join('');
    teamData[slot].ability = pkmnInfo.abilities[0];

    updateActualStats(slot);
    if (currentNpcTeamWithTypes) updateNpcMatchup();

    // 2. 배울 수 있는 기술 목록만 API 서버에 물어보기 (1회 호출)
    try {
        for(let m=1; m<=4; m++) {
            document.getElementById(`m${m}-${slot}`).innerHTML = `<option value="None">기술 로딩중...</option>`;
        }

        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pkmnInfo.id}`);
        const data = await res.json();
        
        const moveOptions = data.moves.map(m => {
            const koMoveName = moveNames[m.move.name] || m.move.name;
            return `<option value="${koMoveName}">${koMoveName}</option>`;
        }).sort().join('');
        
        for(let m=1; m<=4; m++) {
            document.getElementById(`m${m}-${slot}`).innerHTML = `<option value="None">기술 선택</option>${moveOptions}`;
            document.getElementById(`p${m}-${slot}`).innerText = "-";
            document.getElementById(`d${m}-${slot}`).innerText = "-";
            teamData[slot].moves[m-1] = null;
        }
    } catch(e) { 
        console.error("기술 목록을 가져오는데 실패했습니다.", e); 
        for(let m=1; m<=4; m++) {
            document.getElementById(`m${m}-${slot}`).innerHTML = `<option value="None">기술 로드 실패</option>`;
        }
    }
}

// 기술 선택 시 로컬 데이터 연동
function onMoveChange(slot, mIdx, moveNameKo) {
    if (moveNameKo === "None") { 
        teamData[slot].moves[mIdx-1] = null; 
        updateAllPower(slot); 
        if (currentNpcTeamWithTypes) updateNpcMatchup();
        return; 
    }
    
    let moveInfo = null;
    if (typeof moveDataDetail !== 'undefined') {
        moveInfo = moveDataDetail[moveNameKo];
    }
    
    if (moveInfo) {
        teamData[slot].moves[mIdx-1] = { 
            type: moveInfo.type, 
            cat: moveInfo.category, 
            power: moveInfo.power 
        };
    } else {
        console.warn(`기술 데이터를 찾을 수 없습니다: ${moveNameKo}`);
    }
    
    updateAllPower(slot);
    if (currentNpcTeamWithTypes) updateNpcMatchup();
}

const allNpcData = {};
if (typeof npcData !== 'undefined') Object.assign(allNpcData, npcData);
if (typeof swshNpcData !== 'undefined') Object.assign(allNpcData, swshNpcData);
if (typeof hgssNpcData !== 'undefined') Object.assign(allNpcData, hgssNpcData);

// 세대에 맞는 NPC 리스트 불러오기
function loadNpcList() {
    const gen = document.getElementById('gen-select').value;
    const npcSelect = document.getElementById('npc-select');
    npcSelect.innerHTML = '<option value="">NPC를 선택하세요</option>';
    
    if (allNpcData[gen]) {
        allNpcData[gen].forEach((npc, index) => {
            npcSelect.innerHTML += `<option value="${index}">${npc.name}</option>`;
        });
    }
    document.getElementById('npc-details').style.display = 'none';
    currentNpcTeamWithTypes = null;
}

// NPC 데이터 렌더링 (🔥 이미지 출력 기능 추가!)
async function renderNpcData() {
    const gen = document.getElementById('gen-select').value;
    const npcIdx = document.getElementById('npc-select').value;
    const detailsDiv = document.getElementById('npc-details');

    if (npcIdx === "") {
        detailsDiv.style.display = 'none';
        currentNpcTeamWithTypes = null;
        return;
    }

    const npc = allNpcData[gen][npcIdx];
    document.getElementById('npc-name-display').innerText = npc.name;

    if (npc.items && npc.items.length > 0) {
        document.getElementById('npc-items-display').innerText = `💊 ${npc.items[0].name} x${npc.items[0].count}`;
        document.getElementById('npc-items-display').style.display = 'inline-block';
    } else {
        document.getElementById('npc-items-display').style.display = 'none';
    }

    document.getElementById('npc-behavior-text').innerText = npc.behavior || "특별한 패턴 정보가 없습니다.";

    const rosterContainer = document.getElementById('npc-roster-display');
    detailsDiv.style.display = 'block';

    let npcTeamWithTypes = [];
    let rosterHTML = '';

    for (let p of npc.team) {
        let types = ["Normal"]; // 기본값
        let spriteUrl = ""; // ✨ 이미지 주소 담을 변수
        let movesWithTypes = [];
        
        // 로컬 도감에서 포켓몬 타입과 ✨이미지✨ 즉시 가져오기
        if (typeof pokemonDataDetail !== 'undefined' && pokemonDataDetail[p.name]) {
            types = pokemonDataDetail[p.name].types;
            spriteUrl = pokemonDataDetail[p.name].sprite; 
        } else {
            console.warn(`NPC 포켓몬 ${p.name}을(를) 로컬 데이터에서 찾을 수 없습니다.`);
        }
        
        for (let mName of p.moves) {
            let mType = "Normal"; 
            if (typeof moveDataDetail !== 'undefined' && moveDataDetail[mName]) {
                mType = moveDataDetail[mName].type;
            }
            movesWithTypes.push({ name: mName, type: mType });
        }
        
        npcTeamWithTypes.push({ ...p, types });

        const aceClass = p.note ? 'ace' : '';
        const typesHTML = types.map(t => `<span class="weakness-tag ${t}" style="transform: scale(0.8); margin: 2px;"><span class="type-name" style="min-width: 35px; padding: 2px 4px;">${typeNameKo[t] || t}</span></span>`).join('');
        
        const movesHTML = movesWithTypes.map(m => `
            <li style="display:flex; justify-content:space-between; align-items:center; padding: 4px 8px;">
                <span>${m.name}</span>
                <span class="weakness-tag ${m.type}" style="transform: scale(0.7); margin: 0;"><span class="type-name" style="min-width: 35px; padding: 2px 4px;">${typeNameKo[m.type] || m.type}</span></span>
            </li>
        `).join('');

        rosterHTML += `
            <div class="npc-pokemon-card ${aceClass}">
                <div class="npc-pkmn-name">${p.name}</div>
                ${spriteUrl ? `<img src="${spriteUrl}" alt="${p.name}" style="display:block; margin: 5px auto; width: 80px; height: 80px; image-rendering: pixelated;">` : ''}
                <div style="display:flex; justify-content:center; margin-bottom: 5px;">${typesHTML}</div>
                <div class="npc-pkmn-level">Lv.${p.level}</div>
                <div class="npc-pkmn-ability">${p.ability}</div>
                <ul class="npc-pkmn-moves">
                    ${movesHTML}
                </ul>
            </div>
        `;
    }
    
    rosterContainer.innerHTML = rosterHTML;
    currentNpcTeamWithTypes = npcTeamWithTypes;
    
    updateNpcMatchup();
}

// 내 엔트리와 NPC 상성 분석 코칭 및 결정력 기반 타수 계산
function updateNpcMatchup() {
    const matchupList = document.getElementById('npc-matchup-list');
    if (!currentNpcTeamWithTypes) return;

    let hasValidPokemon = teamData.some(p => p && p.types && p.types.length > 0);
    if (!hasValidPokemon) {
        matchupList.innerHTML = '<li>내 엔트리에 포켓몬을 추가해야 코칭이 제공됩니다.</li>';
        return;
    }

    let matchupHTML = '';
    currentNpcTeamWithTypes.forEach(npcP => {
        if (!npcP.types || npcP.types.length === 0) return;

        // NPC 실수치 계산 (IV: 31, EV: 0 가정)
        let npcBaseStats = { hp: 80, defense: 80, 'special-defense': 80 };
        let searchName = npcP.name;
        if (typeof pokemonDataDetail !== 'undefined') {
            if (pokemonDataDetail[searchName]) {
                npcBaseStats = pokemonDataDetail[searchName].stats;
            } else if (pokemonDataDetail[searchName.split(' ')[0]]) {
                npcBaseStats = pokemonDataDetail[searchName.split(' ')[0]].stats;
            }
        }
        
        let npcHp = Math.floor((npcBaseStats.hp * 2 + 31) * npcP.level / 100 + npcP.level + 10);
        let npcDef = Math.floor((npcBaseStats.defense * 2 + 31) * npcP.level / 100 + 5);
        let npcSpD = Math.floor((npcBaseStats['special-defense'] * 2 + 31) * npcP.level / 100 + 5);

        if (npcP.note && (npcP.note.includes("다이맥스") || npcP.note.includes("거다이맥스")) && !npcP.note.includes("불가")) {
            npcHp *= 2;
        }

        let strongAttackersHTML = [];
        
        for (let slot = 1; slot <= 6; slot++) {
            const myP = teamData[slot];
            if (!myP || !myP.types || myP.types.length === 0) continue;
            
            const myName = document.getElementById(`name-${slot}`).value || `엔트리 ${slot}`;
            let bestMove = null;
            let bestKoValue = 999;
            let bestKoText = "";
            let bestMinPct = 0;
            let bestMaxPct = 0;
            
            myP.moves.forEach((m, mIdx) => {
                if (m && m.power > 0) {
                    let typeMult = 1.0;
                    if (typeChart[npcP.types[0]]) typeMult *= (typeChart[npcP.types[0]][m.type] || 1);
                    if (npcP.types[1] && typeChart[npcP.types[1]]) typeMult *= (typeChart[npcP.types[1]][m.type] || 1);
                    
                    if (typeMult === 0) return;

                    let statKey = m.cat === 'physical' ? 'attack' : 'special-attack';
                    let myStat = myP.actualStats[statKey];
                    let myLv = myP.lv || 50;
                    let itemMod = itemEffects[myP.item] || 1;
                    let myAtk = Math.floor(myStat * itemMod);
                    let targetDef = m.cat === 'physical' ? npcDef : npcSpD;

                    let baseDmg = Math.floor(Math.floor(Math.floor(2 * myLv / 5 + 2) * m.power * myAtk / targetDef) / 50) + 2;
                    let stab = myP.types.includes(m.type) ? 1.5 : 1;
                    
                    let d2 = Math.floor(baseDmg * stab);
                    let d3 = Math.floor(d2 * typeMult);
                    let minDmg = Math.floor(d3 * 0.85);
                    let maxDmg = d3;

                    let minPct = ((minDmg / npcHp) * 100).toFixed(1);
                    let maxPct = ((maxDmg / npcHp) * 100).toFixed(1);

                    let koValue = 999;
                    let koText = "3타 이상";
                    if (minDmg >= npcHp) { koText = "확정 1타"; koValue = 1; }
                    else if (maxDmg >= npcHp) { koText = "난수 1타"; koValue = 1.5; }
                    else if (minDmg * 2 >= npcHp) { koText = "확정 2타"; koValue = 2; }
                    else if (maxDmg * 2 >= npcHp) { koText = "난수 2타"; koValue = 2.5; }
                    else if (minDmg * 3 >= npcHp) { koText = "확정 3타"; koValue = 3; }

                    if (koValue < bestKoValue) {
                        bestKoValue = koValue;
                        bestKoText = koText;
                        let moveSelect = document.getElementById(`m${mIdx+1}-${slot}`);
                        let moveName = moveSelect.options[moveSelect.selectedIndex].text;
                        bestMove = moveName;
                        bestMinPct = minPct;
                        bestMaxPct = maxPct;
                    }
                }
            });
            
            // UI 디자인 변경 부분 (한 줄 정렬, 너비 최적화)
            if (bestKoValue <= 2.5) {
                let badgeColor = bestKoValue === 1 ? '#e74c3c' : (bestKoValue === 1.5 ? '#e67e22' : '#f1c40f');
                strongAttackersHTML.push(`
                    <div style="display: flex; align-items: center; background: #f8f9fa; border-radius: 6px; padding: 6px 12px; margin-top: 5px; border-left: 3px solid #3498db; width: fit-content; gap: 12px;">
                        <div style="width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            <strong style="color:#2980b9; font-size: 14px;">${myName}</strong> 
                            <span style="font-size: 12px; color: #555;">(${bestMove})</span>
                        </div>
                        <div style="width: 60px; text-align: center;">
                            <span style="font-size: 12px; padding: 2px 0; border-radius: 4px; font-weight: bold; color: #fff; background: ${badgeColor}; display: inline-block; width: 100%;">${bestKoText}</span>
                        </div>
                        <div style="width: 110px; text-align: right; font-size: 12px; color: #7f8c8d;">
                            ${bestMinPct}% ~ ${bestMaxPct}%
                        </div>
                    </div>
                `);
            }
        }

        if (strongAttackersHTML.length > 0) {
            matchupHTML += `<li style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                <span style="color:#e74c3c; font-weight:bold; font-size: 15px;">${npcP.name}</span> 상대 추천: 
                <div style="display:flex; flex-direction:column; gap:5px; margin-top:6px;">
                    ${strongAttackersHTML.join('')}
                </div>
            </li>`;
        } else {
            matchupHTML += `<li style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                <span style="color:#e74c3c; font-weight:bold; font-size: 15px;">${npcP.name}</span>의 약점을 찌르거나 유의미한 데미지를 줄 수 있는 포켓몬이 없습니다. 대비가 필요합니다.
            </li>`;
        }
    });

    matchupList.innerHTML = matchupHTML || '<li>상성 데이터를 분석할 수 없습니다.</li>';
}

document.addEventListener('DOMContentLoaded', loadNpcList);