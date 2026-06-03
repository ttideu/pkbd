import json
import re
import codecs
from collections import Counter

# Type chart (Defending type: { Attacking type: Effectiveness })
TYPE_CHART = {
    "Normal": {"Fighting": 2, "Ghost": 0},
    "Fire": {"Water": 2, "Ground": 2, "Rock": 2, "Fire": 0.5, "Grass": 0.5, "Ice": 0.5, "Bug": 0.5, "Steel": 0.5, "Fairy": 0.5},
    "Water": {"Electric": 2, "Grass": 2, "Fire": 0.5, "Water": 0.5, "Ice": 0.5, "Steel": 0.5},
    "Electric": {"Ground": 2, "Electric": 0.5, "Flying": 0.5, "Steel": 0.5},
    "Grass": {"Fire": 2, "Ice": 2, "Poison": 2, "Flying": 2, "Bug": 2, "Water": 0.5, "Electric": 0.5, "Grass": 0.5, "Ground": 0.5},
    "Ice": {"Fire": 2, "Fighting": 2, "Rock": 2, "Steel": 2, "Ice": 0.5},
    "Fighting": {"Flying": 2, "Psychic": 2, "Fairy": 2, "Bug": 0.5, "Rock": 0.5, "Dark": 0.5},
    "Poison": {"Ground": 2, "Psychic": 2, "Grass": 0.5, "Fighting": 0.5, "Poison": 0.5, "Bug": 0.5, "Fairy": 0.5},
    "Ground": {"Water": 2, "Grass": 2, "Ice": 2, "Poison": 0.5, "Rock": 0.5, "Electric": 0},
    "Flying": {"Electric": 2, "Ice": 2, "Rock": 2, "Grass": 0.5, "Fighting": 0.5, "Bug": 0.5, "Ground": 0},
    "Psychic": {"Bug": 2, "Ghost": 2, "Dark": 2, "Fighting": 0.5, "Psychic": 0.5},
    "Bug": {"Fire": 2, "Flying": 2, "Rock": 2, "Grass": 0.5, "Fighting": 0.5, "Ground": 0.5},
    "Rock": {"Water": 2, "Grass": 2, "Fighting": 2, "Ground": 2, "Steel": 2, "Normal": 0.5, "Fire": 0.5, "Poison": 0.5, "Flying": 0.5},
    "Ghost": {"Ghost": 2, "Dark": 2, "Poison": 0.5, "Bug": 0.5, "Normal": 0, "Fighting": 0},
    "Dragon": {"Ice": 2, "Dragon": 2, "Fairy": 2, "Fire": 0.5, "Water": 0.5, "Electric": 0.5, "Grass": 0.5},
    "Dark": {"Fighting": 2, "Bug": 2, "Fairy": 2, "Ghost": 0.5, "Dark": 0.5, "Psychic": 0},
    "Steel": {"Fire": 2, "Fighting": 2, "Ground": 2, "Normal": 0.5, "Grass": 0.5, "Ice": 0.5, "Flying": 0.5, "Psychic": 0.5, "Bug": 0.5, "Rock": 0.5, "Dragon": 0.5, "Steel": 0.5, "Fairy": 0.5, "Poison": 0},
    "Fairy": {"Poison": 2, "Steel": 2, "Fighting": 0.5, "Bug": 0.5, "Dark": 0.5, "Dragon": 0}
}

TYPE_TRANSLATION = {
    "Normal": "노말", "Fire": "불꽃", "Water": "물", "Electric": "전기", "Grass": "풀", 
    "Ice": "얼음", "Fighting": "격투", "Poison": "독", "Ground": "땅", "Flying": "비행", 
    "Psychic": "에스퍼", "Bug": "벌레", "Rock": "바위", "Ghost": "고스트", "Dragon": "드래곤", 
    "Dark": "악", "Steel": "강철", "Fairy": "페어리"
}

def get_weaknesses(types):
    effectiveness = {}
    for t in types:
        if t not in TYPE_CHART: continue
        for attacker, multiplier in TYPE_CHART[t].items():
            if attacker not in effectiveness:
                effectiveness[attacker] = 1.0
            effectiveness[attacker] *= multiplier
    
    weaknesses = [t for t, mult in effectiveness.items() if mult > 1]
    return weaknesses

def parse_js_object(filename, var_name):
    with codecs.open(filename, 'r', 'utf-8') as f:
        content = f.read()
    
    first_brace = content.find('{')
    last_brace = content.rfind('}')
    
    if first_brace == -1 or last_brace == -1:
        raise Exception(f"Could not find JSON object in {filename}")
    
    json_str = content[first_brace:last_brace+1]
    
    # Remove trailing commas which are invalid in JSON
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    
    try:
        data = json.loads(json_str)
        return data, (first_brace, last_brace+1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {filename}: {e}")
        raise e

def normalize_name(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())

def main():
    # Load Pokemon Data
    print("Loading pokemonData.js...")
    pokemon_data, _ = parse_js_object('pokemonData.js', 'pokemonDataDetail')
    
    # Build dictionaries for pokemon
    eng_to_kor = {}
    kor_to_types = {}
    for kor_name, details in pokemon_data.items():
        eng_id = details['id'].lower()
        eng_to_kor[eng_id] = kor_name
        kor_to_types[kor_name] = details['types']
        
        eng_display = eng_id.replace('-', ' ').title()
        eng_to_kor[eng_display.lower()] = kor_name

    eng_to_kor['weezing-galar'] = '또도가스'
    eng_to_kor['aegislash-shield'] = '킬가르도'
    eng_to_kor['aegislash-blade'] = '킬가르도'
    eng_to_kor['mr. rime'] = '마임꽁꽁'
    eng_to_kor['mime jr.'] = '흉내내'
    eng_to_kor['mr. mime'] = '마임맨'
    eng_to_kor['sirfetch\'d'] = '창파나이트'
    eng_to_kor['farfetch\'d'] = '파오리'

    # Load Move Data
    print("Loading moveData.js...")
    move_data, _ = parse_js_object('moveData.js', 'moveDataDetail')
    
    eng_to_kor_move = {}
    for kor_name, details in move_data.items():
        if 'id' in details:
            eng_id = details['id']
            normalized_id = normalize_name(eng_id)
            eng_to_kor_move[normalized_id] = kor_name
    
    # Load NPC Data
    print("Loading swshNpcData.js...")
    npc_data, span = parse_js_object('swshNpcData.js', 'npcData')
    
    # Process NPC Data
    for route, npcs in npc_data.items():
        for npc in npcs:
            team_types = []
            ace_pokemon = None
            highest_level = -1
            
            for pkmn in npc['team']:
                # Translate Pokemon Name
                original_name = pkmn['name']
                lookup_name = original_name.lower().replace(" ", "-")
                
                if lookup_name in eng_to_kor:
                    pkmn['name'] = eng_to_kor[lookup_name]
                elif original_name.lower() in eng_to_kor:
                    pkmn['name'] = eng_to_kor[original_name.lower()]
                else:
                    split_name = original_name.lower().split('-')[0]
                    if split_name in eng_to_kor:
                        pkmn['name'] = eng_to_kor[split_name]
                        
                kor_name = pkmn['name']
                
                # Translate Moves
                if 'moves' in pkmn:
                    new_moves = []
                    for move in pkmn['moves']:
                        normalized_move = normalize_name(move)
                        if normalized_move in eng_to_kor_move:
                            new_moves.append(eng_to_kor_move[normalized_move])
                        else:
                            new_moves.append(move) # keep original if not found
                    pkmn['moves'] = new_moves
                
                # Check for Types
                if kor_name in kor_to_types:
                    team_types.extend(kor_to_types[kor_name])
                
                # Identify Ace
                if 'note' in pkmn and pkmn['note'] == '에이스':
                    ace_pokemon = pkmn
                elif pkmn['level'] > highest_level:
                    highest_level = pkmn['level']
                    if not ace_pokemon or ('note' not in ace_pokemon):
                        ace_pokemon = pkmn
            
            # Generate AI Behavior
            if team_types:
                type_counts = Counter(team_types)
                most_common_type, count = type_counts.most_common(1)[0]
                primary_type_str = ""
                if count > 1:
                    primary_type_str = f"주로 [{TYPE_TRANSLATION.get(most_common_type, most_common_type)}] 타입 포켓몬을 사용하며, "
            else:
                primary_type_str = "다양한 타입의 포켓몬을 사용하며, "
                
            advice = f"💡 **AI 분석**: 이 NPC는 {primary_type_str}"
            
            if ace_pokemon:
                ace_name = ace_pokemon['name']
                advice += f"에이스 포켓몬은 [{ace_name}]입니다. "
                if ace_name in kor_to_types:
                    weaknesses = get_weaknesses(kor_to_types[ace_name])
                    if weaknesses:
                        kor_weaknesses = [TYPE_TRANSLATION.get(w, w) for w in weaknesses]
                        advice += f"에이스를 상대하기 위해 [{', '.join(kor_weaknesses)}] 타입 공격을 준비하는 것이 유리합니다."
                    else:
                        advice += "에이스의 약점을 찌르기 까다로우니 주의하세요."
            else:
                advice += "엔트리가 다양하여 전략적인 대비가 필요합니다."
                
            npc['behavior'] = advice
            
    # Save back to swshNpcData.js
    print("Writing updated swshNpcData.js...")
    with codecs.open('swshNpcData.js', 'r', 'utf-8') as f:
        content = f.read()
        
    updated_json_str = json.dumps(npc_data, ensure_ascii=False, indent=4)
    new_content = content[:span[0]] + updated_json_str + content[span[1]:]
    
    with codecs.open('swshNpcData.js', 'w', 'utf-8') as f:
        f.write(new_content)
        
    print("Done!")

if __name__ == "__main__":
    main()
