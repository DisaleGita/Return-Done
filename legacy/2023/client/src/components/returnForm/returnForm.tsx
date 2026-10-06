// import React, { useEffect, useState } from "react";
import { useEffect, useState } from 'react';
import "react-datepicker/dist/react-datepicker.css";

import styles from './returnForm.module.scss';

import PersonalDetailsForm from '../formComponents/personalDetailsForm';
import StoreDetailsForm from '../formComponents/storeDetailsForm';
import TimeSlotForm from '../formComponents/timeSlotForm';
import OrderSummary from '../formComponents/orderSummary';
import ReferenceForm from '../formComponents/referenceForm';

import { IDBPDatabase } from 'idb';
import AcceptTOC from '../formComponents/acceptTOC';


type Store = {
    storeName: string;
    item: number;
}

interface ReturnFormProps {
    updateStep: any,
    step: number,
    updateSubmitFormData: Function;

}

const ReturnForm: React.FC<ReturnFormProps> = ({ updateStep, step, updateSubmitFormData }) => {

    let createRandomSequence = () => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 6) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;

    }


    const newdate = new Date();
    newdate.setDate(newdate.getDate() + 1);
    // console.log(newdate)

    const [personalFormData, setPersonalFormData] = useState({});
    const [storeFormData, setStoreFormData] = useState({});
    const [timeSlotData, setTimeSlotData] = useState({});
    const [referenceFormData, setReferenceFormData] = useState({});

    const [storeFormMode, setStoreFormMode] = useState("init");
    const [slotFormMode, setSlotFormMode] = useState("init");
    const [referenceFormMode, setReferenceFormMode] = useState("init");
    const [orderSummaryMode, setOrderSummaryMode] = useState("init");

    const [orderPaymentBtn, setOrderPaymentBtn] = useState(false);
    const [checkTOCStatus,setCheckTOCStatus] = useState(false);

    let setPersonalData = (finalData: any) => {
        setPersonalFormData(finalData);
    }

    let setStoreData = (finalData: any) => {
        setStoreFormData(finalData);
    }

    let activateStoreForm = () => {
        setStoreFormMode("edit");
    }

    let updatePaymentBtn = () =>{
        console.log(orderPaymentBtn)
        setOrderPaymentBtn(false);
    }

    let activateTimeSlotForm = () => {
        setSlotFormMode("edit");
    }

    let activateOrderSummary = (summaryMode: string) => {
        setOrderSummaryMode(summaryMode);
    }

    let toggleTOCStatus = () =>{
        setCheckTOCStatus(!checkTOCStatus)
    }

    let activateReferencesForm = () => {
        setReferenceFormMode("edit");
    }
    let db: IDBPDatabase;

    const openDatabase = (dbName:string) => {
        const request = indexedDB.open(dbName, 1);
        return new Promise((resolve, reject) => {
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
          request.onupgradeneeded = (event:any) => {
            const db = event.target.result;
            const objectStore = db.createObjectStore('formdata', { keyPath: 'code' });
            // add additional configurations for the object store here, if necessary
          };
        });
      };
      
      const getObjectStore = async (dbName: string, storeName: string) => {
        const db:any = await openDatabase(dbName);
        const transaction = db.transaction([storeName], 'readwrite');
        return transaction.objectStore(storeName);
      };
      
      const addData = async (storeName: string, data: any) => {
        const objectStore = await getObjectStore('my-database', storeName);
        const request = objectStore.add(data);
        return new Promise((resolve, reject) => {
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
      };

    let initiateSubmit = () => {
        console.log(timeSlotData)
        let result = createRandomSequence();
        let finalJSONData = { ...personalFormData, ...storeFormData, ...timeSlotData, ...{ "code": result },...referenceFormData };
        // sendEmail(finalFormData);
        window.localStorage.setItem("user_session_key", result);
        console.log('initiate.....')
        addData('formdata',finalJSONData)
        window.open("https://buy.stripe.com/<payment-link-redacted>","_self");
        //test
        // history('/success');
        
    }

    useEffect(() => {
        // deleteDatabase()
    }, [])

    return (
        <>
            <section className={styles.reFormSubmit}>
                <div className={styles.register_form}>
                    {/* <form onSubmit={handleSubmit(onSubmit)} id="reSubmitForm"> */}
                    <div className={styles.left_form}>
                        <div className={styles.row_group}>
                            <PersonalDetailsForm mode="edit" getPersonalData={setPersonalData} toggleStoreForm={activateStoreForm} togglePaymentBtn={setOrderPaymentBtn}></PersonalDetailsForm>
                        </div>
                        <div className={styles.row_group}>
                            <StoreDetailsForm mode={storeFormMode} getStoreData={setStoreData} toggleTimeSlotForm={activateTimeSlotForm} toggleOrderSummary={activateOrderSummary} togglePaymentBtn={setOrderPaymentBtn}></StoreDetailsForm>
                        </div>
                        <div className={styles.row_group}>
                            <TimeSlotForm mode={slotFormMode} getTimeSlotData={setTimeSlotData} toggleReferencesForm={activateReferencesForm} togglePaymentBtn={setOrderPaymentBtn}></TimeSlotForm>
                        </div>
                        <div className={styles.row_group}>
                            <ReferenceForm mode={referenceFormMode} getReferenceFormData={setReferenceFormData} toggleOrderSummary={activateOrderSummary} togglePaymentBtn={setOrderPaymentBtn}></ReferenceForm>
                        </div>
                        <div className={styles.row_group}>
                            <AcceptTOC updateTOCStatus={toggleTOCStatus}></AcceptTOC>
                        </div>
                    </div>
                    <div className={`${styles.right_form1} ${styles.sidebar}`}>
                        <div className={styles.component}>
                            <div className={styles.content}>
                            <OrderSummary mode={orderSummaryMode} timeSlotData={timeSlotData} storeDetailsData={storeFormData} getOrderPaymentFlag={orderPaymentBtn} submitData={initiateSubmit} tocStatus={checkTOCStatus}></OrderSummary>
                            </div>
                        </div>
                        
                    </div>
                    {/* </form> */}
                </div>
            </section>

        </>
    );
};
export default ReturnForm;
