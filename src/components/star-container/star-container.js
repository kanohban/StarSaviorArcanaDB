import React from "react";
import styles from "./star-container.module.css";

export default function StarContainer() {
    return (
        <div className={styles["star-container"]}>
            <div className={styles["stars"]} />
            <div className={styles["stars"]} />
        </div>
    );
}