import React from "react";
import styles from "./full-screen-modal.module.css";
import { useDispatch, useSelector } from "react-redux";
import { inactive } from "../../../../store/reducers/toggle/fullScreenArcpintToggle";

export default function FullScreenModal({ savior }) {
    const fullscreenToggle = useSelector(state => state.fullscreen.value);
    
    const dispatch = useDispatch();

    if(savior)
        return (
            <div className={`${styles["modal"]} ${fullscreenToggle ? `${styles["active"]}` : ""}`} onClick={() => dispatch(inactive())}>
                <img id="popup-img" src={`/images/arcpoint/${savior.name}.webp`} />
                <div className={styles["hint"]}>터치하여 닫기</div>
            </div>
        );
}