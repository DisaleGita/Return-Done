import React, { useState } from 'react'
import styles from './testimonials.module.scss'
import { Autoplay } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react'

function Testimonials() {
    const [testimonials, setTestimonials] = useState<{ image: string; name: string; content: string }[]>([
        // Redacted for the public archive. The original 2023 site showed short
        // testimonials from real early customers, with their names and photos.
        // They were shared with us for the live site, not for a public repo.
    ])
    return (
        <section className={styles.testimonials} id="reTestimonials">
            <h3>What our users say about us</h3>
            <section className={styles.testimonials_section}>
                <Swiper
                    height={100}
                    slidesPerView={3}
                    autoplay={{
                        delay: 3000
                    }}
                    breakpoints={{
                        0: {
                            // width: 576,
                            slidesPerView: 1,
                          },
                        991: {
                            // width: 576,
                            slidesPerView: 3,
                          },
                      }}
                    loop={true}
                    modules={[Autoplay]}
                > {testimonials.map((item,index)=>(
                    <SwiperSlide key={index}>
                        <section className={styles.testimonials_card}>
                            <div className={styles.testimonials_card_body}>
                                <div className={styles.testimonials_card_content}>
                                    <div className={styles.testimonials_card_content_body}>
                                        {/* <span className={styles.quote}>"</span> */}
                                        <blockquote>
                                           {item.content}
                                        </blockquote>
                                        {/* <span className={styles.quote}>"</span> */}
                                    </div>
                                    <div className={styles.testimonials_card_content_author}>
                                    <div className={styles.testimonials_card_img}>
                                        <img src={item.image}></img>
                                    </div>
                                    <div>
                                    {item.name}
                                    </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </SwiperSlide>
                    ))}
                </Swiper>

            </section>
        </section>

    )
}

export default Testimonials