import React from 'react';
import styles from './headerStyles.module.scss';
import { Link, useLocation } from 'react-router-dom';
import reHeader from "../../assets/relogo_transparent.png";
import $ from 'jquery'

const Header = () => {
  let curRoute = useLocation().pathname;

  let moveToLocation = () => (event: any) => {
    event.preventDefault();
    let pos = $(event.target).data('position');
    console.log(pos)
    document.getElementById(pos)?.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
  }
  return (
    <header className={styles.re_header}>
      <div className={styles.re_header_logo}>
        <a href="/">
          <img src={reHeader}></img>
        </a>
      </div>
      <div className={styles.re_header_quickLinks}>
        <ul>
          {curRoute == "/" && 
            <>
              <li>
            <a href="javascript:;" data-position="reBrands" onClick={moveToLocation()} >Where we return</a>
          </li>
          <li>
            <a href="javascript:;" data-position="reSteps" onClick={moveToLocation()}>How it works</a>
          </li>
          <li>
            <a href="javascript:;" data-position="reBenefits" onClick={moveToLocation()} >Why Choose us</a>
          </li>
          <li>
            <a href="javascript:;" data-position="reTestimonials" onClick={moveToLocation()} >Testimonials</a>
          </li>
          <li>
            <a href="javascript:;" data-position="rePricing" onClick={moveToLocation()} >Pricing</a>
          </li>
            </>
          }
          {curRoute != "/" && 
            <li className={styles.tab_visible}>
              <Link to="/" className={`${styles.successPage_link_btn}`}>Home</Link>
            </li>
          }
          {curRoute != "/faqs" && 
            <li className={styles.tab_visible}>
            <Link to="/faqs" className={`${styles.successPage_link_btn}`} target="_blank">FAQs</Link>
          </li>
          }
          

          {curRoute != "/submitReturn" && curRoute != "/success" &&
            <li className={styles.header_return_btn}>
              <button className={styles.re_btn}>
                <Link to="/submitReturn" className={styles.reBanner_link_btn}>
                  {curRoute != "/success" &&
                    <span>Return NOW!</span>
                  }
                </Link>
              </button>
            </li>
          }
        </ul>
      </div>
    </header>

  )
}

export default Header