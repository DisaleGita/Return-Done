import React, { useState } from 'react';
import ReturnForm from '../returnForm/returnForm';
import Header from '../reHeader/header';
import Payment from '../paymentsPage/payment';
import Footer from '../reFooter/reFooter';

import styles from './formPage.module.scss';

function FormPage() {
    const [returnStep, setReturnStep] = useState(1);
    const [submitFormData, setSubmitFormData] = useState<any[]>([]);

    let updateSubmitFormData = (data: React.SetStateAction<any[]>)=>{
        setSubmitFormData(data);
    }

    let updateReturnStep = (step: React.SetStateAction<number>)=>{
        // console.log('called.....')
        setReturnStep(step)
    }

    const sampleData = {
        "timeSlot": "12to2",
        "date": "1678942800000",
        "sNames": [
            {
                "receipt": [
                    {}
                ],
                "item": 2,
                "name": "dasd",
                "storeType": false
            },
            {
                "receipt": [
                    {}
                ],
                "item": 2,
                "name": "dasd",
                "storeType": false
            },
            {
                "receipt": [
                    {}
                ],
                "item": 2,
                "name": "dasd",
                "storeType": false
            }
        ],
        "pAddress": "dadsad",
        "phone": "3333333333",
        "email": "dsd2@dfsss",
        "lName": "dsad",
        "fName": "dasd",
        "code": "NDGTZ0"
    }

  return (<section className={styles.reFormPage}>
    <Header></Header>
    <h2>
        Return Initiation Form
    </h2>
    <div>
        {returnStep == 1 && 
            <div className='reStep reStep_1'>
                <div>
                    <ReturnForm updateSubmitFormData={updateSubmitFormData} updateStep={updateReturnStep} step = {returnStep}></ReturnForm>
                </div>
        </div>
        }
        {returnStep == 2 && 
            <div className='reStep reStep_2'>
                <Payment submitData = {submitFormData}></Payment>
            </div>
        }
    </div>
    <Footer></Footer>
  </section>
  )
}

export default FormPage;