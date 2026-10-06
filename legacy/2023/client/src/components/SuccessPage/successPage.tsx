import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { sendEmail } from '../../services/emailService';
import Header from '../reHeader/header';
import Footer from '../reFooter/reFooter';

import tipIcon from '../../assets/icons/tipIcon.png';

import styles from './successPage.module.scss';
let sampleData = {
  "fName": "Test",
  "lName": "Name",
  "email": "test@tdtdt2.com",
  "phone": "2233322333",
  "sNames": [
    {
      "receipt": {
        "0": {}
      },
      "returnDeadLine": "1687928400000",
      "item": 3,
      "storeType": "InStore",
      "name": "Store1"
    }
  ],
  "zip": 33223,
  "state": "Kansas",
  "city": "dada",
  "addressLine2": "line2",
  "addressLine1": "Lin1",
  "timeSlot": "10 AM -  12 AM",
  "pickupDate": "1687755600000",
  "code": "WLSSZP",
  "references": "LinkedIn,FaceBook"
}
function SuccessPage() {
  const navigate = useNavigate();
  const [dbData, setDbData] = useState<any>('');
  const [storeItems, setStoreItems] = useState(0);
  useEffect(() => {
    let sessionKey = window.localStorage.getItem('user_session_key') || null;
    if(sessionKey == null){
        navigate("/");
    } else {
        checkStore(sessionKey)
    }
  }, [])
  async function checkStore(sessionKey: string) {
    try {
      let data: any = await getKeyFromIndexedDBStore("formdata", sessionKey);
      if (data == undefined) {
        navigate("/");
      } else {
        setDbData(data)
        console.log(data)
        setDbData(data);
        let finalFormData = createNewFormData(data);
        sendEmail(finalFormData);
        removeStore(sessionKey)

      }
    }
    catch (error) {
      navigate("/");
    }
  }

  async function removeStore(sessionKey: string) {
    try {
      await removeRecordFromIndexedDBStore("formdata", sessionKey);
      console.log('Record removed successfully');
    } catch (error) {
      console.error(error);
    }
  }


  const getDateTime = (date: string) => {
    if(date != null){
      let tempDate = new Date(parseInt(date));
      return tempDate.getMonth() + "/" + tempDate.getDate() + "/" + tempDate.getFullYear();
    } else 
     return "";
    

  }

  function removeRecordFromIndexedDBStore(storeName: string, key: string) {
    return new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.open('my-database', 1);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const deleteRequest = store.delete(key);

        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete record from store'));
        };

        deleteRequest.onsuccess = () => {
          resolve();
        };
      };
    });
  }


  const createNewFormData = (data: any) => {
    const formData: any = new FormData();
    let pickUpDate = getDateTime(data.pickupDate);
    let count = 0
    data.sNames.forEach((store: any, index: string) => {
      count = count + store.item;
      formData.append("StoreNames[" + index + "].item", store.item);
      formData.append("StoreNames[" + index + "].storeType", store.storeType);
      formData.append("StoreNames[" + index + "].name", store.name);
      formData.append("StoreNames[" + index + "].storeDeadlineDate", getDateTime(store.returnDeadLine));
      Array.from(store.receipt).forEach((receipt: any) => {
        formData.append("Receipt", receipt);
      });

    });
    // console.log(count,"count")
    setStoreItems(count);
    formData.append("code",data.code)
    formData.append("pickUpDate", pickUpDate);
    // formData.append("deadlineDate", returnDeadLine);
    formData.append("reference", data.references);
    formData.append("addressLine1", data.addressLine1);
    formData.append("addressLine2", data.addressLine2);
    formData.append("city", data.city);
    formData.append("state", data.state);
    formData.append("zip", data.zip);
    formData.append("FirstName", data.fName);
    formData.append("LastName", data.lName);
    formData.append("Email", data.email);
    formData.append("PhoneNumber", data.phone);
    formData.append("timeSlot", data.timeSlot);
    return formData;
  }

  function getKeyFromIndexedDBStore(storeName: string, key: string) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open('my-database', 1);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
        return false;
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(key);

        getRequest.onerror = () => {
          //   reject(new Error('Failed to get key from store'));
          return false;
        };

        getRequest.onsuccess = () => {
          const data = getRequest.result;
          console.log(data)
          resolve(data);
          return data
          //   navigate("/");
        };
      };
    });
  }

  return (
    <>
      <Header></Header>
      <div className={styles.successPage}>
        <h3>
          Thank you for placing your pickup request
        </h3>
        <p>
          A confirmation email has been sent to <a href={`mailTo:${dbData.email}`}>{dbData.email}</a>
        </p>
        <div className={styles.successPage_table_row}>
          <div className={styles.successPage_table_left}>
          <div className={styles.successPage_row}>
                <p className={styles.rowName}>Request ID:</p>
                <p className={styles.rowValue}>{dbData.code}</p>
              </div>
              <div className={styles.successPage_row}>
                <p className={styles.rowName}>Number of Items:</p>
                <p className={styles.rowValue}>{storeItems}</p>
              </div>
              <div className={styles.successPage_row}>
                <p className={styles.rowName}>Pickup Date:</p>
                <p className={styles.rowValue}>{getDateTime(dbData.pickupDate)}</p>
              </div>
              <div className={styles.successPage_row}>
                <p className={styles.rowName}>Pickup Time Slot:</p>
                <p className={styles.rowValue}>{dbData.timeSlot}</p>
              </div>
          </div>
          <div className={styles.successPage_table_right}>
            <div className={`${styles.successPage_table}`}>
              <div className={`${styles.successPage_row} ${styles.successPage_address}`}>
                <p className={styles.rowName}>Pickup Address</p>
                <p className={styles.rowValue}>{dbData.addressLine1} </p>
                <p>{dbData.addressLine2 && <span>{dbData.addressLine2} ,</span>} {dbData.city} </p>
                <p>{dbData.state}, {dbData.zip}</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p>
            Please ensure that you are physically present during your chosen pickup slot to allow us to verify the return items accurately.
          </p>
          <p>
            If you need to cancel or reschedule your pickup, kindly send an email to <a href='mailTo:support@returndone.com'>support@returndone.com</a> at least 2 hours prior to your scheduled pickup slot.
          </p>
        </div>
        <div>
        <div className={styles.successPage_link_parent}>
            <Link to="/submitReturn" className={styles.successPage_link_btn}>Schedule another PickUp</Link>
        </div>  
        </div>
        <div className={styles.successPage_tips}>
          <div className={styles.successPage_tips_item}>
            <h4><span>
              <img width="25" height="25" src={tipIcon}></img>
            </span> Tip 1
            </h4>
            <div>
            Skip the hassle of packing your items before pickup. At Return Done, we check the condition of all items at the time of pickup. Moreover, we take care of taping, printing, and packaging so that you can relax.
            </div>
          </div>
          <div className={styles.successPage_tips_item}>
            <h4><span>
              <img width="25" height="25" src={tipIcon}></img>
            </span> Tip 2
            </h4>
            <div>
            If you did not provide a return deadline date or upload your return labels in the Return Initiation Form, you can email them to us at <a href='mailTo:support@returndone.com'>support@returndone.com</a> along with your request ID at least 2 hours before the start of your pickup time slot.
            </div>
          </div>
          <div className={styles.successPage_tips_item}>
            <h4><span>
              <img width="25" height="25" src={tipIcon}></img>
            </span> Tip 3
            </h4>
            <div>
            Choose to return on our Return Day (Saturday) to save an additional $2 on all your returns.
            </div>
          </div>
          
        </div>
      </div>
      <Footer></Footer>
    </>
  )
}

export default SuccessPage