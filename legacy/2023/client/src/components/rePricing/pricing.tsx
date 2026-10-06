import React from 'react'
import { Link } from 'react-router-dom';
import ImgPricing from '../../assets/pricing_section.png';
import styles from './pricing.module.scss'

function Pricing() {
  return (
    <section id="rePricing">
    <div className={styles.rePricing}>
    <h3>
    Exclusive Pricing Plan
      </h3>
      <div className={styles.rePricing}>
        <img src={ImgPricing} alt="Use PromoCode MAY40 at checkout"></img>
    </div>
    </div>
    <div className={styles.pricing}>
                                {/* <h2>What is Lorem Ipsum?</h2> */}
                                <h3> Life is too short to do your returns yourself</h3>
                                <h3> Focus on more important things and leave the returns to us.</h3>
                                        <p>
                                                <button className={styles.reBanner_btn}>
                                                  <Link to="/submitReturn" className={styles.reBanner_link_btn}>Return NOW!</Link>
                                                </button>
                                        </p>
                                
                        </div>
    </section>
  )
}

export default Pricing;