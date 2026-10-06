import React from 'react';
import styles from './reFooter.module.scss'
import reHeader from "../../assets/relogo_transparent.png";
// import fb from "../../assets/facebook.svg";
import { faFacebook, faWhatsapp, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import privacy from "../../assets/docs/Return Done_Privacy Policy.pdf";
import toc from "../../assets/docs/Return Done_T&C.pdf";
import logo from "../../assets/icons/tipIcon.png";

function Footer() {
    // let fbStyle = {
    //     backgroundImage:`url(${fb})`
    // }
  return (
    <>
        <footer className={styles.reFooter}>
            <div className={styles.reFooter_section}>
                <div>
                    <a href="/">
                        <img src={reHeader}></img>
                    </a>
                </div>
                <div className={styles.reFooter_section_contact}>
                    <div>
                        <h4>Get in Touch</h4>
                        <div>
                            <p>
                                <span><b>Email: </b></span> <span><a href="mailto:support@example.com">support@example.com</a></span>
                            </p>
                            <p>
                                <span><b>Phone: </b></span> <span><a href="tel:REDACTED">(redacted)</a></span>
                            </p>
                            
                        </div>
                    </div>
                    <div>
                        <ul className={styles.reFooter_icon}>
                            <li>
                                <a href='https://instagram.com/returndone_' target={"_blank"} className={styles.reFooter_icon_link}>
                                    <FontAwesomeIcon icon={faInstagram} />
                                </a>
                            </li>
                            <li>
                                <a href='https://www.facebook.com/profile.php?id=100091309996836&mibextid=LQQJ4d' target={"_blank"} className={styles.reFooter_icon_link}>
                                    <FontAwesomeIcon icon={faFacebook} />
                                </a>
                            </li>
                            <li>
                                <a href='https://www.linkedin.com/company/returndone' target={"_blank"} className={styles.reFooter_icon_link}>
                                    <FontAwesomeIcon icon={faLinkedin} />
                                </a>
                            </li>
                            <li>
                                <a href='#redacted' target="_blank" className={styles.reFooter_icon_link}>
                                    <FontAwesomeIcon icon={faWhatsapp} />
                                </a>
                            </li>
                        </ul>
                    </div>
                    {/* <div className={styles.reFooter_section_contact}>
                    <div>
                        <div>
                            <p>
                                <span><a href="mailto:support@example.com">Terms &amp; Conditions</a></span>
                            </p>
                            <p>
                                <span><a href="tel:REDACTED">Privacy Policy</a></span>
                            </p>
                            
                        </div>
                    </div>
                    </div> */}
                </div>
            </div>
            <div className={styles.reFooter_copy}>
                <p>
                <span><span>&copy;</span> 2023, All rights reserved</span>
                <span className={styles.footer_disc}></span>
                </p>
            
            <p className={styles.reFooter_copy_toc}>
            <a href={toc} target="_blank" >Terms &amp; Conditions</a>
            <span className={styles.footer_disc}></span>
            <a href={privacy} target="_blank" >Privacy Policy</a>
            </p>
            </div>
        </footer>
    </>
  )
}

export default Footer;