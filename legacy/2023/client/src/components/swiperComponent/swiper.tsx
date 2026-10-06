import React, { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper';
import Adidas_Logo from '../../assets/brand_logos/Adidas_Logo.png';
import Aeropostale from '../../assets/brand_logos/Aeropostale.png';
import Amazon from '../../assets/brand_logos/Amazon.png';
import Best_Buy from '../../assets/brand_logos/Best_Buy.png';
import CVS from '../../assets/brand_logos/CVS.png';
import Dicks_Sporting_Goods from '../../assets/brand_logos/Dicks_Sporting_Goods.png';
import DSW from '../../assets/brand_logos/DSW.png';
import Foot_Locker from '../../assets/brand_logos/Foot_Locker.png';
import Forever_21 from '../../assets/brand_logos/Forever_21.png';
import H_M from '../../assets/brand_logos/H_M.png';
import Home_Depot from '../../assets/brand_logos/Home_Depot.png';
import Nike from '../../assets/brand_logos/Nike.png';
import Nordstrom from '../../assets/brand_logos/Nordstrom.png';
import Primark from '../../assets/brand_logos/Primark.png';
import Puma from '../../assets/brand_logos/Puma.png';
import Sephora from '../../assets/brand_logos/Sephora.png';
import Target from '../../assets/brand_logos/Target.png';
import tj_maxx from '../../assets/brand_logos/tj_maxx.png';
import Uniqlo from '../../assets/brand_logos/Uniqlo.png';
import walgreens from '../../assets/brand_logos/walgreens.png';
import Walmart from '../../assets/brand_logos/Walmart.png';
import Zara from '../../assets/brand_logos/Zara.png';

// import 'swiper/swiper.scss';
import 'swiper/css';
import styles from './swiper.module.scss';

export default function SwiperCarousel() {
    const [brandLogos, setbrandLogos] = useState([
        {
            logoUrl:Adidas_Logo
        },
        {
            logoUrl:Aeropostale
        },
        {
            logoUrl:Amazon
        },
        {
            logoUrl:Best_Buy
        },
        {
            logoUrl:CVS
        },
        {
            logoUrl:Dicks_Sporting_Goods
        },
        {
            logoUrl:DSW
        },
        {
            logoUrl:Foot_Locker
        },
        {
            logoUrl:Forever_21
        },
        {
            logoUrl:H_M
        },
        {
            logoUrl:Home_Depot
        },
        {
            logoUrl:Nike
        },
        {
            logoUrl:Nordstrom
        },
        {
            logoUrl:Primark
        },
        {
            logoUrl:Puma
        },
        {
            logoUrl:Sephora
        },
        {
            logoUrl:Target
        },
        {
            logoUrl:tj_maxx
        },
        {
            logoUrl:Uniqlo
        },
        {
            logoUrl:walgreens
        },
        {
            logoUrl:Walmart
        },
        {
            logoUrl:Zara
        }
        
    ])
  return (
    <div className={styles.brand_carousel} id="reBrands">
        <h3>Whether you bought online or in-store, we got you covered</h3>
        <h3>We return from these brands and many more...</h3>
        {brandLogos.length > 0 && 
            <Swiper
            spaceBetween={0}
            slidesPerView={3}
            centeredSlides={true}
            autoplay={{
                delay: 1500,
                disableOnInteraction: false,
            }}
            loop={true}
            modules={[Autoplay]}
            breakpoints={{
                "@0.00": {
                  slidesPerView: 3,
                  spaceBetween: 0,
                },
              }}
            > {brandLogos.map((item,index)=>(
                        <SwiperSlide key={index}>
                            <img src={item.logoUrl} width={150}></img>
                        </SwiperSlide>
                        ))}
            </Swiper>
        }
        <div className={styles.hrRule}></div>
    </div>
    
  )
}
