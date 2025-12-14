import React from 'react';
import styles from './modal-close-button.module.css';

const ModalCloseButton = ({ onClick, className = '' }) => {
    return (
        <button
            className={`${styles['close-button']} ${className}`}
            onClick={onClick}
            aria-label="Close modal"
        >
            <i className="fa-solid fa-x" />
        </button>
    );
};

export default ModalCloseButton;
