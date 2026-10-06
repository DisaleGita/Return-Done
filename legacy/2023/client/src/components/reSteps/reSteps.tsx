import React, { useState } from 'react'
import Cards from '../Cards/cards';
import styles from './reSteps.module.scss';
import Img1 from '../../assets/gifs/return_now_click.gif';
import Img2 from '../../assets/gifs/calendar.gif';
import Img3 from '../../assets/gifs/lotus-pose.gif';
import Img4 from '../../assets/gifs/money-bag.gif';


function ReSteps() {
        const [curCardData, setCurCardData] = useState([
                {
                        imgSrc: Img1,
                        heading: 'Click on Return Now',
                        description: 'Fill out our short form with your basic details and choose the stores and items you want to return.'
                }, {
                        imgSrc: Img2,
                        heading: 'Choose Pickup Slot',
                        description: 'Pick a date and time of your convenience when we can come and pick up your package from your doorstep.'
                }, {
                        imgSrc: Img3,
                        heading: 'Relax Now',
                        description: 'We will come to your house during your chosen pickup time slot to collect the package and verify the items to be returned.'
                }, {
                        imgSrc: Img4,
                        heading: 'Get Refunded',
                        description: 'We will work with the retailer to return the package so that your refund can be initiated at the earliest.'
                }
        ]);
        return (
                <section className={styles.re_Steps} id="reSteps">
                        <h3>Effortless Returns <span>Just 4 Steps Away</span></h3>
                        <div className={styles.re_Steps_cards}>
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
        )
}

export default ReSteps;