import React, { useState } from 'react'
import Cards from '../Cards/cards';
import styles from './benefits.module.scss';
import Img1 from '../../assets/Image1.png';
import Img2 from '../../assets/Image2.png';
import Img3 from '../../assets/Image3.png';
import Img4 from '../../assets/Image4.png';


function Benefits() {
        const [curCardData, setCurCardData] = useState([
                {
                        imgSrc: Img1,
                        heading: 'Convenience',
                        description: 'We guarantee to pick up your items within your chosen time slot and return them to the post office or store before the return deadline.'
                }, {
                        imgSrc: Img2,
                        heading: 'Hassle-free Returns',
                        description: 'No boxing, taping, or printing required. We take care of everything so that you can relax.'
                }, {
                        imgSrc: Img3,
                        heading: 'Time Savings',
                        description: 'With Return Done, you don\'t have to spend time and energy packaging your items and driving to the post office yourself.'
                }, {
                        imgSrc: Img4,
                        heading: 'Professional Packaging',
                        description: 'We package your items with utmost care so that they are not damaged in transit and you can receive your deserved refund.'
                }
        ]);
        return (
                <>
                        <section className={styles.re_Benefits} id="reBenefits">
                                <h3>How we are Reimagining Returns</h3>
                                <div className={styles.re_Benefits_cards}>
                                        {
                                                curCardData.map((item, index) => (
                                                        <Cards
                                                                key={item.heading}
                                                                imgSrc={item.imgSrc}
                                                                heading={item.heading}
                                                                description={item.description}
                                                                shadow={false}
                                                        ></Cards>
                                                ))
                                        }

                                </div>
                        </section>
                        {/* <div className={styles.hrRule}>
                        </div> */}
                </>
        )
}

export default Benefits