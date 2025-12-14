import React, { useState } from "react";
import styles from "./potential.module.css";
import { POTENTIAL } from "../../../../constants";

export default function Potential({ potential }) {
    const [isActive, setIsActive] = useState(false);

    return (
        <div className={`${styles["potential"]} ${isActive ? `${styles["active"]}` : ""}`}>
            <div className={styles["potential-header"]}>
                <span className={styles["level"]}>Lv.{potential.level}</span>
                <span className={`${styles["desc"]} ${POTENTIAL[potential.value] ? `${styles["keyword"]}` : ""}`}
                        onClick={() => setIsActive(!isActive)} >
                    {potential.value}
                </span>
            </div>
            <div className={`${styles["flavor-text"]} ${isActive ? `${styles["active"]}` : ""}`}>{POTENTIAL[potential.value]}</div>
        </div>
    );
}