import React from "react";
import styles from "./skill-tab.module.css";
import Skill from "./skill";
import { v4 } from "uuid";

export default function SkillTab({ savior, isTabActive }) {
    return (
        <div className={`${styles["skill-tab"]} ${styles[isTabActive]}`}>
            {savior.skills.map(skill => <Skill char_name={savior.name} skill={skill} key={v4()} />)}
        </div>
    );
}