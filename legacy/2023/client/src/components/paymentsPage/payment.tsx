import React from 'react'
import { date } from 'yup';

interface PaymentProps {
    submitData: {
        timeSlot: string;
        date: string;
        sNames: {
            receipt: {}[];
            item: number;
            name: string;
            storeType: boolean;
        }[];
        pAddress: string;
        phone: string;
        email: string;
        lName: string;
        fName: string;
        code: string;
    }
}
const Payment:React.FC<any> = ({submitData}) => {

    let calculatePrice = (stores: number)=>{
        if(stores <= 1){
            return 5;
        } else {
            let tempPrice = 5;
            for(let i = 1;i < stores;i++){
                tempPrice = tempPrice + 2
            }
            return tempPrice;
        }
    }

    let getDayName = (dateString: string | number | Date, locale: Intl.LocalesArgument)=>{
        let tempDate = new Date(dateString);
        console.log(tempDate)
        return tempDate.toLocaleString(locale, {weekday: 'long'}) +" "+ tempDate.getDate() +" "+ tempDate.getFullYear();
    }

    let numberOfStores = submitData.sNames.length;
    let paymentCost = calculatePrice(numberOfStores);
    let orderDate = getDayName(parseInt(submitData.date),'en-US')
    

  return (
    <>
        <div>Payment Cost: No of Stores: {numberOfStores} Cost: {paymentCost}</div>
        <div>Order Id: {submitData.code}</div>
        <div>
            PickUp Date :{orderDate}
            Order Slot : {submitData.timeSlot}
        </div>
    </>
  )
}

export default Payment