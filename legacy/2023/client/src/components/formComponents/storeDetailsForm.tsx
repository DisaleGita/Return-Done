import React, { useEffect } from 'react'
import styles from './formComponents.module.scss';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useState } from 'react';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import tipIcon from '../../assets/icons/tipIcon.png';

interface StoreDetailsProps {
    mode: string,
    getStoreData: any
    toggleTimeSlotForm: any
    toggleOrderSummary: any
    togglePaymentBtn: any
}

const StoreDetailsForm: React.FC<StoreDetailsProps> = ({ mode, getStoreData, toggleTimeSlotForm, toggleOrderSummary, togglePaymentBtn }) => {
    type storeDetailForm = {
        sNames: {
            name: string;
            item: number;
            storeType: string;
            returnDeadLine: Date | null;
            receipt: any[] | null;
        }[];
    }

    type Name = {
        name: string;
        items: number;
    };

    type Store = {
        storeName: string;
        item: number;
    }

    type FileFields = {
        id: number;
        file: any[]
    };

    const storeDetailsScheme = Yup.object().shape({
        sNames: Yup.array().of(
            Yup.object().shape({
                name: Yup.string().required('Store Name is required'),
                storeType: Yup.string().required("This field is required"),
                item: Yup.number()
                    .typeError("Item must be a number")
                    .positive("Item must be a positive number")
                    .integer("Item must be an integer")
                    .required("Item is required"),
                // returnDeadLine: Yup.string().required("This field is required"),
                // receipt: Yup
                //     .mixed()
                //     .test("fileSize", "No File uploaded", (value: any) => {
                //         // console.log(value?.length)
                //         if (value.length == 0) return false; // no file provided
                //         else return true
                //     }),
                // .required("File is required"),
            })
        ),
    });

    /*personal Details form */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<storeDetailForm>({
        resolver: yupResolver(storeDetailsScheme),
        defaultValues: {
            sNames: [{
                name: "", item: 0,
                storeType: "", returnDeadLine: null
            }],
        }
    });

    const { fields, append, remove } = useFieldArray({
        name: "sNames",
        rules: {
            required: "Please append at least 1 item"
        },
        control,
    });

    const [formMode, setformMode] = useState(mode);
    const [storePurchase, setStorePurchase] = useState("instore");
    const [returnDate, setReturnDate] = useState<any[]>([]);


    useEffect(() => {
        setformMode(mode)
    }, [mode])

    let getFileList = (index: number) => {

        let tempFileList = [...fileUploadList];
        let tempFile: any[] = []
        tempFileList.forEach((files) => {
            if (files.id == index) {
                tempFile.push(files.file[0])
            }
        })
        console.log(tempFile);
        return tempFile;
    }

    const onSubmit = (data: storeDetailForm) => {
        console.log(data)
        let tempList = []
        // data.sNames.receipt  = fileUploadList;
        data.sNames.forEach((store, index) => {
            tempList = getFileList(index);
            data.sNames[index].receipt = tempList;
        })
        setformMode("read");
        getStoreData(data);
        toggleTimeSlotForm();
        toggleOrderSummary("show")
        togglePaymentBtn(true);
    }

    const getDateTime = (date: string | undefined) => {
        if(date != undefined){
            let tempDate = new Date(parseInt(date));
        return tempDate.getMonth() + "/" + tempDate.getDate() + "/" + tempDate.getFullYear();
        }
    }

    const [fileUploadList, setfileUploadList] = useState<any[]>([]);

    let fileHandler = (index: number) => (event: any) => {
        let tempFile = Array.from(event.target.files ?? []);
        // setfileUploadList({tempFile});
        let fileIndex = 0;
        let tempFileList = [...fileUploadList]
        tempFileList.forEach((item) => {
            if (index == item.id) {
                fileIndex++;
            }
        })
        setfileUploadList(targetFiles => [
            ...targetFiles, { id: index, fileIndex: fileIndex, file: tempFile }
        ])
    }
    let removeStoreFiles = (storeIndex: any) => {
        console.log('storeIndex', storeIndex);
        let tempFileList = [...fileUploadList];
        tempFileList = tempFileList.filter((file) => {
            if (file.id == storeIndex) {
                return false
            }
            return true;
        });
        let tempStoreIndex = 0
        tempFileList = tempFileList.map((file) => {
            file.id = tempStoreIndex;
            tempStoreIndex++;
            return file;
        })
        setfileUploadList(tempFileList)
        remove(storeIndex);
        // fields.map((elem) =>{
        //     console.log(elem)
        // })
    }

    let removeUploadFile = (storeIndex: any, fileIndex: any) => (event: any) => {
        event.preventDefault();
        // event.target.value = null;
        console.log(storeIndex, fileIndex)
        let tempFileList = [...fileUploadList];
        tempFileList = tempFileList.filter((file) => {
            if (file.id == storeIndex && file.fileIndex == fileIndex) {
                return false
            }
            return true;
        })
        console.log(tempFileList)
        //updateFileIndex list
        let tempFileIndex = 0
        tempFileList = tempFileList.map((file) => {
            if (file.id == storeIndex) {
                file.fileIndex = tempFileIndex;
                tempFileIndex++;
                return file;
            }

            return file;
        })
        setfileUploadList(tempFileList)
    }

    const newdate = new Date();
    newdate.setDate(newdate.getDate() + 1);

    return (
        <>
            <div className={`${styles.store_details} ${styles.form_accordion}`}>
                <div className={styles.form_accordion_head}>
                    <h3>
                        Store and Item Details
                    </h3>
                    {/* <div>
                        Add the Name of the stores/ecommerce sites you wish to return items to
                    </div> */}
                    <div>
                        {formMode == "read" &&
                            <a href="javascript:;" onClick={() => {setformMode("edit");togglePaymentBtn(false);}}>+Edit</a>
                        }
                    </div>
                </div>
                {mode == "edit" && (
                    <form onSubmit={handleSubmit(onSubmit)} id="reStoreDetails" className={`${formMode == "read" ? styles.form_readOnly : ''}`}>
                        <div className={styles.form_accordion_body}>
                            <div className={styles.store_group}>
                                {fields.map((field, index) =>
                                    <section className={styles.store_group} key={field.id}>
                                        <div className={styles.store_group_header}>
                                            <h4>Store {index + 1}</h4>
                                            {fields.length > 1 && formMode == "edit" &&
                                                <button className={`${styles.btn_link}`} type="button" onClick={() => {
                                                    removeStoreFiles(index);
                                                }}>
                                                    - Remove Store
                                                </button>
                                            }
                                        </div>
                                        <div className={styles.row_group}>
                                            <div className={styles.form_group}>
                                                <label htmlFor={`storeName` + index}>
                                                   Store Name <span className={styles.required}>*</span>
                                                </label>
                                                <input id={`storeName` + index}
                                                    {...register(`sNames.${index}.name`, { required: true, }
                                                    )}
                                                    className={`form-control ${errors.sNames && errors.sNames[index]?.name ? 'is-invalid' : ''}`}
                                                    readOnly={formMode == "read"}
                                                    tabIndex={formMode == "read" ? -1 : 0}
                                                    placeholder="Amazon"
                                                />
                                                {errors.sNames && errors.sNames[index]?.name && (
                                                    <div className="invalid-feedback">
                                                        {errors.sNames[index]?.name?.message}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.form_group}>
                                                <label htmlFor={`noOfItems` + index}>
                                                    No of Items from Store <span className={styles.required}>*</span>
                                                </label>
                                                <input
                                                    id={`noOfItems` + index}
                                                    type="number"
                                                    {...register(`sNames.${index}.item`, { required: true, })}
                                                    className={`form-control ${errors.sNames && errors.sNames[index]?.item ? 'is-invalid' : ''}`}
                                                    readOnly={formMode == "read"}
                                                    tabIndex={formMode == "read" ? -1 : 0}
                                                />
                                                {errors.sNames && errors.sNames[index]?.item && (
                                                    <div className="invalid-feedback">
                                                        {errors.sNames[index]?.item?.message}
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                        <div className={`${styles.storeType_group} ${errors.sNames && errors.sNames[index]?.storeType ? 'is-invalid' : ''}`}>
                                            {formMode == "edit" &&
                                                <>
                                                <div className={styles.label_group}>
                                                    <label>Purchase Type <span className={styles.required}>*</span></label>
                                                    <div className={styles.checkbox_group}>
                                                    <div className={styles.form_group}>
                                                        <input
                                                            id={`inStore` + index}
                                                            type="radio"
                                                            {...register(`sNames.${index}.storeType`)}
                                                            className={`form-control ${errors.sNames && errors.sNames[index]?.storeType ? 'is-invalid' : ''}`}
                                                            value="InStore"
                                                            // checked={true}
                                                            onChange={() => setStorePurchase("In Store")}
                                                        />
                                                        <label htmlFor={`inStore` + index}>
                                                            In Store
                                                        </label>
                                                    </div>
                                                    <div className={`${styles.form_group}`}>
                                                        <input
                                                            id={`online` + index}
                                                            type="radio"
                                                            {...register(`sNames.${index}.storeType`)}
                                                            className={`form-control ${errors.sNames && errors.sNames[index]?.storeType ? 'is-invalid' : ''}`}
                                                            // checked={storePurchase == "online"}
                                                            // checked={false}
                                                            value="Online"
                                                            onChange={() => setStorePurchase("Online")}
                                                        />
                                                        <label htmlFor={`online` + index}>
                                                            Online
                                                        </label>
                                                    </div>
                                                    </div>
                                                
                                                </div>
                                                </>
                                            }
                                            {errors.sNames && errors.sNames[index]?.storeType && (
                                                <div className="invalid-feedback">
                                                    {errors.sNames[index]?.storeType?.message}
                                                </div>
                                            )}
                                        </div>
                                        {formMode == "read" &&
                                            <div className={styles.row_group}>
                                                <div className={styles.form_group}>
                                                    <label htmlFor={`inStore` + index}>
                                                    Purchase Type
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control`}
                                                        readOnly
                                                        value={storePurchase}
                                                        tabIndex={-1}
                                                    />
                                                </div>
                                            </div>
                                        }
                                        <div className={`${styles.row_group} ${styles.tips_parent} ${errors.sNames && errors.sNames[index]?.returnDeadLine ? 'is-invalid' : ''}`}>
                                            <div className={`${styles.form_group} ${styles.read_group}`}>
                                                
                                            <label htmlFor="returnDeadLine">Return Deadline Date</label>
                                            <Controller
                                                render={(pickUpDateRef) => (
                                                    <DatePicker
                                                        selected={
                                                            pickUpDateRef.field.value ? new Date(Number(pickUpDateRef.field.value)) : undefined
                                                        }
                                                        onChange={(date: Date) => {pickUpDateRef.field.onChange(date?.getTime())}}
                                                        dateFormat={"MMMM d, yyyy"}
                                                        startDate={pickUpDateRef.field.value=null}
                                                        minDate={new Date()}
                                                        placeholderText=""
                                                        isClearable={formMode == 'edit  '}
                                                        readOnly={formMode == 'read'}
                                                    />
                                                )}
                                                control={control}
                                                {...register(`sNames.${index}.returnDeadLine`)}
                                                // rules={{ required: true }}
                                            />
                                        </div>
                                            {formMode == "edit" &&
                                                <div className={`${styles.form_group}`}>
                                                <div className={styles.form_tips}>
                                                    <div className={styles.form_tips_item}>
                                                        <h4><span>
                                                            <img width="25" height="25" src={tipIcon}></img>
                                                        </span> Tip
                                                        </h4>
                                                        <div>
                                                        If you don't have the Return Label or the Return Deadline Date ready with you, you can always email them to us later at support@returndone.com before the pickup time slot.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            }
                                        </div>
                                        {errors.sNames && errors.sNames[index]?.returnDeadLine && (
                                            <div className="invalid-feedback">
                                                {errors.sNames && errors.sNames[index]?.returnDeadLine?.message}
                                            </div>
                                        )}
                                        <div>
                                            <>
                                                {formMode == "edit" &&
                                                    <label>
                                                        Upload Return Label
                                                        <input
                                                            type="file"
                                                            {...register(`sNames.${index}.receipt`)}
                                                            onChange={fileHandler(index)}
                                                            className={`form-control ${errors.sNames && errors.sNames[index]?.receipt ? 'is-invalid' : ''}`}
                                                        />
                                                        {errors.sNames && errors.sNames[index]?.receipt && (
                                                            <div className="invalid-feedback">
                                                                {errors.sNames[index]?.receipt?.message}
                                                            </div>
                                                        )}
                                                    </label>
                                                }
                                                <div>
                                                    {fileUploadList.map((item, id) => {
                                                        if (item.id == index)
                                                            return (
                                                                <div className={styles.upload_details}>
                                                                    <div>
                                                                        {item.file[0].name}
                                                                    </div>
                                                                    {formMode == "edit" &&
                                                                        <button
                                                                            className={styles.removeFile}
                                                                            type="button"
                                                                            onClick={removeUploadFile(item.id, item.fileIndex)}
                                                                        >-</button>
                                                                    }
                                                                </div>
                                                            );
                                                    })}
                                                </div>
                                            </>
                                        </div>
                                        <p>{errors.sNames?.root?.message}</p>
                                    </section>
                                )}
                                {formMode == "edit" &&
                                    <button type="button" className={`${styles.btn_link}`} onClick={() => {
                                        append(
                                            {
                                                name: "",
                                                item: 0,
                                                storeType: "",
                                                receipt: null,
                                                returnDeadLine: null
                                            });
                                    }}>+ Add Store</button>
                                }
                            </div>
                        </div>
                        <div>
                            {formMode == "edit" &&
                                <button className={`${styles.primaryButton} ${styles.next_btn}`}>
                                    Next
                                </button>
                            }
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}

export default StoreDetailsForm;