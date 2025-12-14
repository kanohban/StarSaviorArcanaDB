import React from "react";
import styles from "./portrait-with-name.module.css";

export default function PortraitWithName({ savior, setIsActive, setSelected }) {
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

    const selectSavior = (savior) => {
        setSelected(savior);
        setIsActive(true);
    }

    return (
        <div className={styles["savior"]} onClick={() => selectSavior(savior)}>
            <img className={`${styles["portrait"]} ${styles[`${eng}`]}`} alt={savior.name}
                src={`/images/icon/${savior.name}.webp`}
                onError={({ currentTarget }) => {
                    currentTarget.onError = null;
                    currentTarget.src = '/images/icon/default.webp';
                }} />
            <div className={styles["name"]}>{savior.name}</div>
        </div>
    );
}