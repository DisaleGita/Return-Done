import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styles from './formComponents.module.scss';
import { Link } from 'react-router-dom';

import privacy from "../../assets/docs/Return Done_Privacy Policy.pdf";
import toc from "../../assets/docs/Return Done_T&C.pdf";

interface TOCProps{
    updateTOCStatus: any
}

// const AcceptTOC: React.FC<TOCProps> = (props:any) = ()=>
const AcceptTOC: React.FC<TOCProps> = ({updateTOCStatus})=>{
    const [tocStatus, setTocStatus] = useState(false);
  return (
    <div>
        <div className={styles.form_group}>
            <label htmlFor="reFormTOC" className={styles.form_check_label}>
                <input id="reFormTOC"
                    type="checkbox"
                    name="reFormTOC"
                    className={`form-check-input`}
                    checked={tocStatus}
                    onClick={()=>{setTocStatus(!tocStatus);updateTOCStatus()}}
                    required
                ></input>
                <span className={styles.required}>*</span>          
                I am 18 years of age or older and agree to Return Done's <a href={toc} target="_blank" >Terms &amp; Conditions</a> and <a href={privacy} target="_blank" >Privacy Policy</a>.
                <span className={styles.checkmark}></span>
            </label>
        </div>
    </div>
  )
}

export default AcceptTOC;
