import React, { useEffect, useState } from "react";
import styles from "./modal-left.module.css";
import { useDispatch } from "react-redux";
import { active, inactive } from "../../../../store/reducers/toggle/fullScreenArcpintToggle";

export default function ModalLeft({ savior }) {
    const [disabled, setDisabled] = useState(false);
    const [isActive, setIsActive] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        setDisabled(false);
        dispatch(inactive());
    }, [savior]);

    const openFullScreen = () => {
        if(!disabled) {
            setDisabled(true);
            return;
        }
        dispatch(active());
    }

    return (
        <div className={styles["modal-desc-left"]}>
            <div className={styles["illust-container"]}>
                <img src={`/images/illust/${savior.name}.webp`} alt="Savior Illustration" />
            </div>
            <div className={styles["arcpoint-container"]} onClick={() => openFullScreen()}>
                <h3>아크 포인트 <span className={styles["warning"]}>(스포일러 주의)</span></h3>
                <div className={`${styles["arcpoint-wrapper"]} ${disabled ? `${styles["disabled"]}` : ""}`}>
                    <img src={`/images/arcpoint/${savior.name}.webp`} alt="Arc Point" />
                    <div className={styles["overlay"]}>
                        <span>터치하여 확인</span>
                    </div>
                </div>
            </div>
        </div>
    )
}