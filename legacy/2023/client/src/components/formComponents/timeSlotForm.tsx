import React, { useEffect, useRef, useState } from 'react'
import styles from './formComponents.module.scss';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parse } from 'path';

interface TimeSlotProps {
    mode: string
    toggleReferencesForm: any
    getTimeSlotData: any
    togglePaymentBtn: any
}

const TimeSlotForm: React.FC<TimeSlotProps> = ({ mode, toggleReferencesForm, getTimeSlotData, togglePaymentBtn}) => {

    type timeSlotForm = {
        pickupDate: Date | null;
        timeSlot: string;
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        zip: number;
        returnDaySlot: boolean;

    }

    const timeSlotSchema = Yup.object().shape({
        // returnDaySlot: Yup.string().required('This is required'),
        pickupDate: Yup.string().required("This field is required"),
        timeSlot: Yup.string().required("This field is required"),
        addressLine1: Yup.string()
            .required('Address Line 1 is required'),
        // addressLine2: Yup.string()
        //     .required('Address Line 2 is required'),
        city: Yup.string()
            .required('City is required'),
        state: Yup.string()
            .required('State is required')
            .test("validState", "Not a Valid State", (value) => {
                if (states.find((state) => state.label == inputValue))
                    return true;
                else
                    return false;
            }),
        zip: Yup.number()
            .required("Zip code is required")
            .test("len", "Zip code must be exactly 5 digits", (val) =>
                val?.toString().length === 5
            )
    });

    /*Timeslot form Details form */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
        clearErrors
    } = useForm<timeSlotForm>({
        resolver: yupResolver(timeSlotSchema),
        defaultValues: {

        }
    });

    const newdate = new Date();
    newdate.setDate(newdate.getDate() + 1);
    // console.log(newdate)

    const [formMode, setformMode] = useState(mode);
    const [timeSlot, setTimeSlot] = useState('');
    const [slots, setSlots] = useState([0, 0, 0, 0, 0, 0])
    const timeSlotRef = useRef<any>(null)
    const [timeSlotSelectedDate, setTimeSlotSelectedDate] = useState<any>(null);

    useEffect(() => {
        setformMode(mode)
    }, [mode])

    let initiateSlots = (date: number | undefined) => {
        if (date != undefined) {
            // let selDate = getDateTime(date.toString());
            // let selDate = date + (4*60*60*1000);
            let curDate: string | undefined = new Date().getTime().toString();
            let curHour = new Date().getHours();
            curDate = getDateTime(curDate.toString());
            let selDate = getDateTime(date.toString())
            if (selDate != curDate) {
                setSlots([1, 1, 1, 1, 1, 1])
            } else {
                // curHour = new Date(curDate).getHours()
                console.log('same day', curHour)
                //slots key: 4,5,6,7,8,9
                let curHourKey = Math.floor(curHour/ 2);
                console.log(curHourKey);
                if (curHourKey >= 8) {
                    setSlots([0, 0, 0, 0, 0, 0])
                } else if (curHourKey == 7) {
                    setSlots([0, 0, 0, 0, 0, 1])
                } else if (curHourKey == 6) {
                    setSlots([0, 0, 0, 0, 1, 1])
                } else if (curHourKey == 5) {
                    setSlots([0, 0, 0, 1, 1, 1])
                } else if (curHourKey == 4) {
                    setSlots([0, 0, 1, 1, 1, 1])
                } else if (curHourKey == 3) {
                    setSlots([0, 1, 1, 1, 1, 1])
                } else if (curHourKey <= 2) {
                    setSlots([1, 1, 1, 1, 1, 1])
                }
            }
        }
    }

    const getDateTime = (date: string | undefined) => {
        if (date != undefined) {
            let tempDate = new Date(parseInt(date));
            return tempDate.getMonth() + "/" + tempDate.getDate() + "/" + tempDate.getFullYear();
        }
    }

    const [inputValue, setInputValue] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [dropEdit, setDropEdit] = useState(false);
    const [returnDayStatus,setReturnDayStatus] = useState(false);

    function handleInputChange(event: { target: { value: React.SetStateAction<string>; }; }) {
        setInputValue(event.target.value);
        setDropEdit(true);
    }

    function handleStateClick(state: { value: any; label: any; }) {
        setSelectedState(state.label);
        setInputValue(state.label);
        setDropEdit(false);
    }

    const filteredStates = states.filter((state) =>
        state.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    function handleFieldFocus(event: { target: { name: any; }; }) {
        const fieldName = event.target.name;
        clearErrors(fieldName);
    }

    function handleKeyStroke(event:any ) {
        if(event.keyCode == 13){
            event.preventDefault()
        }
    }

    let clearTimeSlotDate = ()=>{
        console.log(timeSlotRef.current)
        setTimeSlotSelectedDate(null);
        setSlots([0, 0, 0, 0, 0, 0])
    }

    const onSubmit = (data: timeSlotForm) => {
        console.log(data)
        data.returnDaySlot = returnDayStatus;
        setDropEdit(false);
        setformMode("read");
        toggleReferencesForm("active")
        data.state = inputValue;
        getTimeSlotData(data);
        togglePaymentBtn(true);
    }

    return (
        <>
            <div className={`${styles.register_form__time_slot} ${styles.form_accordion} ${styles.timeSlot_details}`}>
                <div className={styles.form_accordion_head}>
                    <h3>
                        Pickup Details
                    </h3>
                    <div>
                        {formMode == "read" &&
                            <a href="javascript:;" onClick={() => {setformMode("edit");togglePaymentBtn(false);}}>+Edit</a>
                        }
                    </div>
                </div>
                {mode == "edit" && (
                    <form onSubmit={handleSubmit(onSubmit)} id="rePersonalDetails" className={`${formMode == "read" ? styles.form_readOnly : ''}`}>
                        <div>
                        {formMode == "edit" &&
                            <div className={styles.switchElement}>
                            <div className={styles.container}>
                                    Save $2 when you choose to return on our Return Day (Saturday)
                                <div className={styles.toggle_switch}>
                                    <input type="checkbox" className={styles.checkbox}
                                        {...register('returnDaySlot')} id="returnDaySlot"
                                        onChange={() => {clearTimeSlotDate();setReturnDayStatus(!returnDayStatus);}}
                                        checked={returnDayStatus}
                                        />
                                    <label className={styles.label} htmlFor="returnDaySlot">
                                        <span className={styles.inner} />
                                        <span className={styles.switch} />
                                    </label>
                                </div>
                                {errors.returnDaySlot && (
                                    <div className="invalid-feedback">
                                        {errors.returnDaySlot?.message}
                                    </div>
                                )}
                            </div>
                            </div>
                        }
                        </div>
                        <div className={`${styles.row_group}`}>
                            <div className={`${styles.form_group} ${errors.timeSlot ? 'is-invalid' : ''}`}>
                                <label htmlFor="pickupDate">Pickup Date <span className={styles.required}>*</span></label>
                                <Controller
                                    render={(pickUpDateRef) => (
                                        <DatePicker
                                        selected={
                                            timeSlotSelectedDate
                                        }
                                        onChange={(date: Date) => {setTimeSlotSelectedDate(date?.getTime());pickUpDateRef.field.onChange(date?.getTime());initiateSlots(date?.getTime())}}
                                            dateFormat={"MMMM d, yyyy"}
                                            startDate={null}
                                            minDate={new Date()}
                                            placeholderText=""
                                            filterDate={date => {
                                                // Disable weekends (Saturday and Sunday)
                                                if(returnDayStatus){return date.getDay() == 6;}
                                                return true;
                                            }}
                                            // isClearable={formMode == 'edit  '}
                                            readOnly={formMode == 'read'}
                                        />
                                    )}
                                    control={control}
                                    {...register('pickupDate')}
                                    rules={{ required: true }}
                                />
                                {errors.pickupDate && (
                                    <div className="invalid-feedback">
                                        {errors.pickupDate?.message}
                                    </div>
                                )}
                            </div>
                        </div>
                        {formMode == "edit" &&
                            <>
                                <div className={`${styles.form_group} ${styles.timeSlot_group} ${errors.timeSlot ? 'is-invalid' : ''}`}>
                                    <div className={styles.label_group}>
                                        <label>Pickup Time Slot <span className={styles.required}>*</span></label>
                                        <div className={styles.checkbox_group}>
                                             <div className={`${styles.timeSlot_group_item} ${slots[0] == 0 ? styles.disabled : ''}`}>
                                    <input id="8to10" value="8 AM - 10 AM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("8 AM - 10 AM")}
                                        checked={timeSlot == "8 AM - 10 AM"}
                                        disabled={slots[0] == 0}
                                    ></input>
                                    <label htmlFor="8to10">
                                        8 AM - 10 AM
                                    </label>
                                </div>
                                <div className={`${styles.timeSlot_group_item} ${slots[1] == 0 ? styles.disabled : ''}`}>
                                    <input id="10to12" value="10 AM -  12 PM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("10 AM -  12 PM")}
                                        checked={timeSlot == "10 AM -  12 PM"}
                                        disabled={slots[1] == 0}
                                    ></input>
                                    <label htmlFor="10to12">
                                        10 AM -  12 PM
                                    </label>
                                </div>
                                <div className={`${styles.timeSlot_group_item} ${slots[2] == 0 ? styles.disabled : ''}`}>
                                    <input id="12to2" value="12 PM - 2 PM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("12 PM - 2 PM")}
                                        checked={timeSlot == "12 PM - 2 PM"}
                                        disabled={slots[2] == 0}
                                    ></input>
                                    <label htmlFor="12to2">
                                        12 PM - 2 PM
                                    </label>
                                </div>
                                <div className={`${styles.timeSlot_group_item} ${slots[3] == 0 ? styles.disabled : ''}`}>
                                    <input id="2to4" value="2 PM - 4 PM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("2 PM - 4 PM")}
                                        checked={timeSlot == "2 PM - 4 PM"}
                                        disabled={slots[3] == 0}
                                    ></input>
                                    <label htmlFor="2to4">
                                        2 PM - 4 PM
                                    </label>
                                </div>
                                <div className={`${styles.timeSlot_group_item} ${slots[4] == 0 ? styles.disabled : ''}`}>
                                    <input id="4to6" value="4 PM - 6 PM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("4 PM - 6 PM")}
                                        checked={timeSlot == "4 PM - 6 PM"}
                                        disabled={slots[4] == 0}
                                    ></input>
                                    <label htmlFor="4to6">
                                        4 PM - 6 PM
                                    </label>
                                </div>
                                <div className={`${styles.timeSlot_group_item} ${slots[5] == 0 ? styles.disabled : ''}`}>
                                    <input id="6to8" value="6 PM - 8 PM" type="radio" {...register('timeSlot')}
                                        className={`form-control ${errors.timeSlot ? 'is-invalid' : ''}`}
                                        onChange={() => setTimeSlot("6 PM - 8 PM")}
                                        checked={timeSlot == "6 PM - 8 PM"}
                                        disabled={slots[5] == 0}
                                    ></input>
                                    <label htmlFor="6to8">
                                        6 PM - 8 PM
                                    </label>
                                </div>
                                        </div>
                                    </div>
                                {errors.timeSlot && (
                                    <div className="invalid-feedback">
                                        {errors.timeSlot?.message}
                                    </div>
                                )}
                            </div>
                            </>
                        }
                        {formMode == "read" &&
                            <div className={styles.row_group}>
                                <div className={styles.form_group}>
                                    <label htmlFor='reFNamen'>Pickup Time Slot <span className={styles.required}>*</span></label>
                                    <input id="reFName"
                                        type="text"
                                        className='form-control'
                                        value={timeSlot}
                                    />
                                </div>
                            </div>
                        }
                        <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                <label htmlFor='addressLine1'>Address Line 1 <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    id="addressLine1"
                                    {...register('addressLine1')}
                                    className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.addressLine1?.message}</div>
                            </div>
                            <div className={styles.form_group}>
                                <label htmlFor='addressLine2'>Address Line 2</label>
                                <input
                                    type="text"
                                    id="addressLine2"
                                    {...register('addressLine2')}
                                    className={`form-control ${errors.addressLine2 ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.addressLine2?.message}</div>
                            </div>
                        </div>
                        <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                <label htmlFor='reCity'>City <span className={styles.required}>*</span></label>
                                <input
                                    id="reCity"
                                    type="text"
                                    {...register('city')}
                                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.city?.message}</div>
                            </div>
                            <div className={styles.form_group}>
                                <label htmlFor="state-dropdown">State <span className={styles.required}>*</span></label>
                                <div className={styles.state_dropdown_container}>
                                    <input
                                        type="text"
                                        id="state-dropdown"
                                        {...register('state')}
                                        name="state"
                                        onFocus={handleFieldFocus}
                                        className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                                        placeholder="Enter state"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        // onKeyDown={handleKeyStroke}
                                    />
                                    {(inputValue && dropEdit) && (
                                        <div className={styles.state_dropdown_menu}>
                                            {filteredStates.map((state) => (
                                                <div
                                                    key={state.value}
                                                    className={styles.state_dropdown_item}
                                                    onClick={() => handleStateClick(state)}
                                                >
                                                    {state.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="invalid-feedback">{errors.state && <p>{errors.state.message}</p>}</div>
                                </div>
                                <input
                                    type="hidden"
                                    id="state-dropdown-value"
                                    name="state-dropdown-value"
                                    value={selectedState}
                                />
                            </div>
                        </div>
                        <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                <label htmlFor='zipCode'>Zip Code <span className={styles.required}>*</span></label>
                                <input
                                    id="zipCode"
                                    type="number"
                                    {...register('zip')}
                                    className={`form-control ${errors.zip ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.zip?.message}</div>
                            </div>
                        </div>
                        <div>
                            {formMode == "edit" &&
                                <button className={`${styles.primaryButton} ${styles.next_btn}`}>
                                    Next
                                </button>
                            }
                            <>
                            </>
                        </div>
                    </form>
                )}
            </div>
        </>
    )
}

const states = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "DC", label: "District Of Columbia" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
];

export default TimeSlotForm;