import React, { useState } from "react";
import styles from "./savior.module.css";
import Header from "../../components/header/header";
import Footer from "../../components/footer/footer";
import StarContainer from "../../components/star-container/star-container";
import { useSelector } from "react-redux";
import SearchBox from "../../components/search-box/search-box";
import FilterSelect from "../../components/filter-select/filter-select";
import FILTERS from "../../data/filter_config.json";
import SORT_LIST from "../../data/sort_config.json";
import PortraitWithName from "../../components/savior/portrait/portrait-with-name";
import ScrollUpButton from "../../components/buttons/scroll-up-button/scroll-up-button";
import { v4 } from "uuid";
import SaviorDescModal from "../../components/savior/modal/savior-desc-modal";
import FullScreenModal from "../../components/savior/modal/modal-left/full-screen-modal";

export default function Savior() {
    const theme = useSelector(state => state.theme.value);
    const mode = useSelector(state => state.mode.value);
    const saviors = useSelector(state => state.saviors.value);

    const [selected, setSelected] = useState(null);
    const [isActive, setIsActive] = useState(false);

    return (
        <div id="container" data-theme={theme}>
            <StarContainer />
            <Header title={"구원자"} />
            <div className={styles["savior-container"]}>
                <div className={styles["filter-wrapper"]}>
                    <FilterSelect id={"rarity"} list={FILTERS.RARITY} selected={saviors.filter.rarity} />
                    <FilterSelect id={"attr"} list={FILTERS.ATTRIBUTE} selected={saviors.filter.attr} />
                    <FilterSelect id={"class"} list={FILTERS.CLASS} selected={saviors.filter.class} />
                    <FilterSelect id={"order"} list={SORT_LIST} showName={false} selected={saviors.filter.order} />
                    <SearchBox />
                </div>
                {/* TODO : savior icons */}
                <div className={styles["saviors"]}>
                    {saviors.list.map(savior => <PortraitWithName savior={savior} key={`${v4()}`}
                        setIsActive={setIsActive}
                        setSelected={setSelected} />)}
                </div>
            </div>
            <ScrollUpButton />
            <Footer />

            <SaviorDescModal isActive={isActive} setIsActive={setIsActive}

                selected={selected} />
            <FullScreenModal savior={selected} />
        </div>
    );
}