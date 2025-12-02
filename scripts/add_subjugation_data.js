const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/journey_data.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

// Define the new Subjugation data
const subjugationData = [
    {
        "category": "토벌 의뢰",
        "name": "약탈자 토벌 의뢰",
        "timing": "4월 하순",
        "condition": "",
        "choices": [
            {
                "text": "하급 의뢰 성공",
                "result": "컨디션+1, 카페 스트레가 쿠폰(궁극기 사용 후 노바 2 회복), 랜덤스탯+5, 잠재+7, 방어의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "중급 의뢰 성공",
                "result": "컨디션+1, 카페 스트레가 쿠폰(궁극기 사용 후 노바 2 회복), 랜덤스탯+5, 잠재+7, 방어의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "상급 의뢰 성공",
                "result": "컨디션+1, 카페 스트레가 쿠폰(궁극기 사용 후 노바 2 회복), 랜덤스탯+5, 잠재+7, 방어의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            }
        ]
    },
    {
        "category": "토벌 의뢰",
        "name": "슬라임 토벌 의뢰",
        "timing": "6월 하순",
        "condition": "",
        "choices": [
            {
                "text": "하급 의뢰 성공",
                "result": "스트릿 베이커스 굿즈I(턴 시작 치확 5% 증가, 3중첩), 랜덤스탯+10, 잠재+15, 보호의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "중급 의뢰 성공",
                "result": "스트릿 베이커스 굿즈I(턴 시작 치확 5% 증가, 3중첩), 랜덤스탯+10, 잠재+15, 보호의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "상급 의뢰 성공",
                "result": "스트릿 베이커스 굿즈I(턴 시작 치확 5% 증가, 3중첩), 랜덤스탯+10, 잠재+15, 보호의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            }
        ]
    },
    {
        "category": "토벌 의뢰",
        "name": "탈영병 토벌 의뢰",
        "timing": "10월 하순",
        "condition": "",
        "choices": [
            {
                "text": "하급 의뢰 성공",
                "result": "",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "중급 의뢰 성공",
                "result": "금빛 공훈 휘장(턴 시작 치확 증가 5중첩), 랜덤스탯+15, 잠재+30 통찰의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            },
            {
                "text": "상급 의뢰 성공",
                "result": "별빛 공훈 휘장(궁극기 사용시 효과 적중,저항 증가 5중첩), 랜덤스탯+15, 잠재+30 통찰의 감각 10% 할인",
                "result_positive": "",
                "result_negative": ""
            }
        ]
    }
];

// Add or Update subjugation key
data.subjugation = subjugationData;

// Optional: Clean up the messy "resette" data if it exists
// The user didn't explicitly ask to delete, but the messy data might confuse the renderer if it's in "resette" tab.
// I will check if "리세트의 유혹" in "resette" has the messy choices and remove them or the event if it's garbage.
// For now, I'll just add the new key as requested.

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Subjugation data added successfully.');
