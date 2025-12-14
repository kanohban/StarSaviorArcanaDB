import React from "react";
import styles from "./search-box.module.css";
import { useDispatch } from "react-redux";
import { changeQuery } from "../../store/reducers/list/saviorList";

export default function SearchBox({ value, customOnChange, className = "" }) {
    const dispatch = useDispatch();

    return (
        <div className={`${styles["search-box"]} ${className}`}>
            <input type="text" id={styles["savior-search"]}
                placeholder="이름, 스킬, 효과 검색..."
                value={value}
                onInput={(event) => customOnChange ? customOnChange(event.target.value) : dispatch(changeQuery(event.target.value))} />
        </div>
    );
}