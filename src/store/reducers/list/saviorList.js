import { createSlice } from '@reduxjs/toolkit';
import originData from "../../../data/savior.json";
import FILTERS from "../../../data/filter_config.json";
import SORT_LIST from "../../../data/sort_config.json";
import * as hangul from 'hangul-js';

const FOUND = -1;

const originFilter = {
    rarity: FILTERS.RARITY[0],
    attr: FILTERS.ATTRIBUTE[0],
    class: FILTERS.CLASS[0],
    order: SORT_LIST[0]
}

const ATTR_BASIC_SCORE = {
  "태양": 1,
  "달": 2,
  "별": 3,
  "질서": 4,
  "혼돈": 5
}

const basicOrder = JSON.parse(JSON.stringify(originData)).sort((a, b) => {
  if(ATTR_BASIC_SCORE[a.attr] === ATTR_BASIC_SCORE[b.attr]) {
    return a.name.localeCompare(b.name, "ko-KR");
  }
  return ATTR_BASIC_SCORE[a.attr] - ATTR_BASIC_SCORE[b.attr];
});

const origin = {
    list: basicOrder,
    filter: originFilter,
    query: ""
}

const getFilteredList = ({ filter, list, query }) => {
    const filtered = origin.list
    .filter(element => {
        if(filter.rarity.value !== "all") 
            return element.rank === filter.rarity.value;
        return true;
    })
    .filter(element => {
        if(filter.attr.value !== "all")
            return element.attr === filter.attr.value;
        return true;
    })
    .filter(element => {
        if(filter.class.value !== "all")
            return element.class === filter.class.value;
        return true;
    })
    .filter(element => {
        if(query === "") return true;

        const searcher = new hangul.Searcher(query);
        
        if(searcher.search(element.name) > FOUND) return true;

        let isFound = false;
        for(const potential of element.potentials) {
            if(searcher.search(potential.value) > FOUND) isFound = true;
        }
        if(isFound) return true;

        isFound = false;
        for(const skill of element.skills) {
            if(searcher.search(skill.name) > FOUND) isFound = true;
            if(searcher.search(skill.desc) > FOUND) isFound = true;
        }
        if(isFound) return true;

        return false;
    })
    .sort((a, b) => {
        if(filter.order.value === "asc") {
            return a.name.localeCompare(b.name, "ko-KR");
        } else if(filter.order.value === "desc") {
            return b.name.localeCompare(a.name, "ko-KR");
        } else if(ATTR_BASIC_SCORE[a.attr] === ATTR_BASIC_SCORE[b.attr]) {
            return a.name.localeCompare(b.name, "ko-KR");
        }
        return ATTR_BASIC_SCORE[a.attr] - ATTR_BASIC_SCORE[b.attr];
    });

    return filtered;
}

const saviorSlice = createSlice({
  name: "saviors",
  initialState: {
    value: origin
  },
  reducers: {
    changeQuery: (state, action) => {
        state.value.query = action.payload;

        state.value.list = getFilteredList(state.value);
    },
    changeFilter: (state, action) => {
        state.value.filter[action.payload.id] = action.payload.obj;

        state.value.list = getFilteredList(state.value);
    },
    reset: state => {
      state.value = origin;
    }
  }
});

export const { changeQuery, changeFilter, reset } = saviorSlice.actions;

export default saviorSlice.reducer;