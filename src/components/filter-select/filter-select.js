import React, { useState } from "react";
import styles from "./filter-select.module.css";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";
import { changeFilter } from "../../store/reducers/list/saviorList";

export default function FilterSelect({ id, list, selected, showName = true, customOnChange }) {
    const [isActive, setIsActive] = useState(false);

    const dispatch = useDispatch();

    let name = "";
    if (id === "rarity") name = "등급";
    if (id === "attr") name = "속성";
    if (id === "class") name = "클래스";
    if (id === "type") name = "타입"; // Added for Arcana

    const dispatchFilter = (obj) => {
        if (customOnChange) {
            customOnChange(id, obj);
        } else {
            dispatch(changeFilter({ id, obj }));
        }
    }

    return (
        <div className={styles["select-wrapper"]} onClick={() => setIsActive(!isActive)}>
            <div className={`${styles["title"]} ${!showName || selected.value !== "all" ? `${styles["disabled"]}` : ""}`}>{name}</div>
            <div className={`${styles["title"]} ${!showName || selected.value !== "all" ? `${styles["disabled"]}` : ""}`}>:</div>
            <div className={styles["represent"]}>{selected.name}</div>
            <div className={`${styles["list"]} ${isActive ? `${styles["active"]}` : ""}`}>
                {list.map(element => {
                    return <div className={styles["element"]} onClick={() => dispatchFilter(element)} key={`${v4()}`}>
                        {element.name}
                    </div>
                })}
            </div>
        </div>
    );
}