import React, { useRef, useState } from 'react'
import styles from './accordion.module.scss'
// interface AccordionProps {
//     customClass: any,
//     index: number,
//     content: any,
//     label: any,
// }
export default function Accordion(props:any) {

const [clicked, setClicked] = useState(false);
const contentEl = useRef<HTMLDivElement>(null);
const componentStyle = {
    backgroundColor: props.customClass,
    // Add more CSS properties as needed
  };
  return (
    <div className={`${styles.accordion}`} style={componentStyle} key={props.index}>
        <div className={styles.accordion_item} onClick={()=>setClicked(!clicked)}>
            <div className={styles.accordion_title} >
                <h3>
                    {props.label} 
                </h3>
                <div className={styles.accordion_pointer}>
                    {clicked?"-":"+"}
                </div>
            </div>{
                clicked && <div
                ref={contentEl} 
                className={styles.accordion_content}>
                {props.content}
                </div>
            }
            
        </div>
    </div>
  )
}
