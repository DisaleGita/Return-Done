import React, { useEffect, useState } from 'react'
import styles from './bannerStyles.module.scss';
import splashImage from "../../assets/Image1.jpg";
import reBanner from "../../assets/reBanner.png";
import reBannerMobile from "../../assets/reBanner_mobile.png";
import { Link } from 'react-router-dom';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import $ from 'jquery'
// import variables from '../variables.scss';


export default function Banner() {
  let words = [
    "Your Impulsive Buys",
    "Misfit Clothing",
    "Damaged Goods",
    "Defective Items",
    "Pointless Purchases",
    "Unwanted Gifts",
    "Overpriced Buys",
    "Incorrect Packages"
  ]

  let initiateRoll = () => {
    console.log('call')
    let i = 0;
    setInterval(() => {

      $('#rollWords').fadeOut(function () {
        $(this).html(words[i = (i + 1) % words.length]).fadeIn()
      })
    }, 2000)
  }

  useEffect(() => {
    initiateRoll();
    // jQueryCode()
  }, [])

  return (
    <>
      <div className={styles.reBanner}>
        <div id="imageParallax" className={`${styles.reBanner_container} ${styles.aspect16_9} ${styles.imageParallax}`}>
          {/* <img src={reBanner}></img> */}
          {/* <div className='overlay'></div> */}
          {/* <div className={styles.reBanner_inner}> */}
            <picture>
              <source media="(min-width:600px)" srcSet={reBanner} />
              <source media="(max-width:599px)" srcSet={reBannerMobile} />
              <img src={reBanner} alt=""></img>
            </picture>
          {/* </div> */}
          <div className={styles.banner_artifact}>
                <Link to="/submitReturn" className={styles.reBanner_link_btn}>
                    <span>Return Now <FontAwesomeIcon icon={faArrowRight} /></span>
                </Link>
          </div>
        </div>
      </div>
      <div className={styles.reRolling_text}>
        <h2>
          We return <span id="rollWords">Your Impulsive Buys</span> for you.
        </h2>
      </div>
      <>

      </>
    </>
  )
}