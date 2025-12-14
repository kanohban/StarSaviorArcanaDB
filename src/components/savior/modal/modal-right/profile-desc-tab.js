import React from "react";
import styles from "./profile-desc-tab.module.css";

export default function ProfileDescTab({ savior, isTabActive }) {
    const getDateText = (number) => {
        const date = new Date((number - 25569) * 86400 * 1000);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return `${month}월 ${day}일`;
    }

    return (
        <div className={`${styles["profile"]} ${styles[isTabActive]}`}>
            <div>
                <strong>생일</strong>
                <span>{getDateText(savior.inst.birth)}</span>
            </div>
            <div>
                <strong>신장</strong>
                <span>{savior.inst.height}cm</span>
            </div>
            <div>
                <strong>출신</strong>
                <span>{savior.inst.origin}</span>
            </div>
            <div>
                <strong>소속</strong>
                <span>{savior.inst.team}</span>
            </div>
            <div>
                <strong>CV (KR)</strong>
                <span>{savior.inst.cv_ko}</span>
            </div>
            <div>
                <strong>CV (JP)</strong>
                <span>{savior.inst.cv_jp}</span>
            </div>
        </div>
    );
}