import React from "react";
import styles from "./portrait.module.css";

export default function Portrait({ savior }) {
    let eng = "";
    switch(savior.attr) {
        case "태양":
            eng = "sun";
            break;
        case "달":
            eng = "moon";
            break;
        case "별":
            eng = "star";
            break;
        case "질서":
            eng = "order";
            break;
        case "혼돈":
            eng = "chaos";
            break;
    }

    return (
        <img className={`${styles["portrait"]} ${styles[`${eng}`]}`} alt={savior.name}
            src={`/images/icon/${savior.name}.webp`}
            onError={({ currentTarget }) => {
                currentTarget.onError = null;
                currentTarget.src = '/images/icon/default.webp';
            }} />
    );
}