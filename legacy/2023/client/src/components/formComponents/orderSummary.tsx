import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import styles from './formComponents.module.scss';
import ContentLoader from 'react-content-loader';

import padlock from '../../assets/padlock.png';
import discount from '../../assets/discount.png';

interface OrderSummaryProps {
    mode: string,
    submitData: any
    getOrderPaymentFlag: any
    timeSlotData: any
    storeDetailsData: any
    tocStatus: any
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ mode, submitData, getOrderPaymentFlag, timeSlotData, storeDetailsData, tocStatus }) => {
    const [formMode, setformMode] = useState(mode);
    const [returnDayPromo, setReturnDayPromo] = useState(false);

    const [timeSlotDate, setTimeSlotDate] = useState<String | undefined>(undefined);
    const [storeCount, setStoreCount] = useState(0);

    const [checkIsReturnDay,setCheckIsReturnDay] = useState(false);
    console.log(storeDetailsData)
    const getDateTime = (date: string | undefined) => {
        if(date != undefined){
            let tempDate = new Date(parseInt(date));
        return tempDate.getMonth() + "/" + tempDate.getDate() + "/" + tempDate.getFullYear();
        }
    }

    console.log("formMode",formMode == "init" && !getOrderPaymentFlag)

    useEffect(() => {
        setformMode(mode);
    }, [mode]);

    useEffect(() => {
        let date = timeSlotData.pickupDate;
        setTimeSlotDate(getDateTime(date?.toString())) ;
        setReturnDayPromo(timeSlotData.returnDaySlot)
        let tempDate = new Date(parseInt(date));
        if(tempDate?.getDay() == 6) setCheckIsReturnDay(true) 
            else setCheckIsReturnDay(false)
        console.log(timeSlotData);
    }, [timeSlotData]);

    useEffect(() =>{
        setStoreCount(storeDetailsData.sNames?.length)
    },[storeDetailsData])
    return (
        <>
            <div className={styles.order_summary}>
                <h3>Order Summary</h3>
                <div className={styles.form_group}>
                    <div className={styles.block_layer_parent}>
                        {formMode == "init" && 
                            <div className={styles.contentLoader_style} >
                                <ContentLoader viewBox="0 0 400 160">
                                    <rect x="0" y="17" rx="0" ry="0" width="100%" height="250" />
                                </ContentLoader>
                            </div>
                        }
                        {formMode !== 'init' &&
                            <section>
                                <div className={`${styles.row_group} ${styles.order_block}`}>
                                    <div>No of Stores</div>
                                    <div>{storeCount}</div>
                                </div>
                                <div className={`${styles.row_group} ${styles.order_block}`}>
                                    <div>Pick Up Date</div>
                                    <div>{timeSlotDate}</div>
                                </div>
                                <div className={`${styles.hrRule} ${styles.summary_rule}`}></div>
                                <div className={`${styles.row_group} ${styles.order_total} ${styles.order_block}`}>
                                    <div>Total</div>
                                    <div>
                                        {(returnDayPromo || checkIsReturnDay) &&
                                        <>
                                            <div className={styles.slashed}><span>Return Day discount applied</span><span>9.99</span></div>
                                            <div className={styles.returnDay_price}>7.99</div>
                                        </>
                                        }
                                        {(!returnDayPromo && !checkIsReturnDay) &&
                                        <>
                                            <div className={styles.returnDay_price}>9.99</div>
                                        </>
                                        }
                                    </div>
                                </div>
                            </section>
                        }
                    </div>
                    <div className={styles.btn_summary}>
                        <button type="submit"
                            onClick={() => submitData()}
                            disabled={(formMode == "init" || formMode == "show" || !getOrderPaymentFlag || !tocStatus)} className={`${styles.primaryButton} ${styles.btn_summary_btn} ${(formMode == "init" || formMode == "show"  || !getOrderPaymentFlag || !tocStatus) ? styles.disabled : ''}`}>
                            Proceed to Pay
                        </button>
                        <div className={styles.btn_summary_toc}>
                        <div><img width={25} height={25} src={padlock}></img></div> <div>You will be redirected to our payment partner Stripe for secure checkout.</div>
                        </div>
                        <div className={styles.btn_summary_toc}>
                        <div><img width={25} height={25} src={discount}></img></div> <div>  You will have the option to enter a promo code on the Stripe checkout page.</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

OrderSummary.propTypes = {}

export default OrderSummary