import React, { useState } from 'react'
import styles from './formComponents.module.scss';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

interface PersonalDetailsFormProps {
    mode: string,
    getPersonalData: any,
    toggleStoreForm: any,
    togglePaymentBtn: any,
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ mode, getPersonalData, toggleStoreForm, togglePaymentBtn }) => {
    type personalDetailForm = {
        fName: string;
        lName: string;
        email: string;
        phone: number;
    }

    const personalDetailsSchema = Yup.object().shape({
        fName: Yup.string().required('FirstName is required'),
        lName: Yup.string().required('LastName is required'),
        email: Yup.string()
            .required('Email is required')
            .email('Email is invalid'),
        phone: Yup.string()
            .required('Phone is required')
            .length(10, 'Phone must be at least 10 characters')
    });

    /*personal Details form */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<personalDetailForm>({
        resolver: yupResolver(personalDetailsSchema),
        defaultValues: {

        }
    })

    const onSubmit = (data: personalDetailForm) => {
        console.log(data);
        setformMode("read");
        getPersonalData(data);
        toggleStoreForm();
        togglePaymentBtn(true);
    }
    const [formMode, setformMode] = useState(mode);
    return (
        <>
            <div className={`${styles.personal_details} ${styles.form_accordion}`}>
                <div className={styles.form_accordion_head}>
                    <h3>
                        Personal Details
                    </h3>
                    <div>
                        {formMode == "read" &&
                            <a href="javascript:;" onClick={() => {setformMode("edit"); togglePaymentBtn(false)}}>+Edit</a>
                        }
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} id="rePersonalDetails" className={`${formMode == "read" ? styles.form_readOnly : ''}`}>
                    <div className={styles.form_accordion_body}>
                        <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                <label htmlFor="reFName">First Name <span className={styles.required}>*</span></label>
                                <input id="reFName"
                                    type="text"
                                    {...register('fName')}
                                    className={`form-control ${errors.fName ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.fName?.message}</div>
                            </div>

                            <div className={styles.form_group}>
                                <label htmlFor='reLName'>Last Name <span className={styles.required}>*</span></label>
                                <input
                                    id="reLName"
                                    type="text"
                                    {...register('lName')}
                                    className={`form-control ${errors.lName ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.lName?.message}</div>
                            </div>
                        </div>

                        <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                <label htmlFor='reEmail'>Email <span className={styles.required}>*</span></label>
                                <input
                                    id="reEmail"
                                    type="text"
                                    {...register('email')}
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.email?.message}</div>
                            </div>

                            <div className={styles.form_group}>
                                <label htmlFor='rePhone'>Phone <span className={styles.required}>*</span></label>
                                <input
                                    id="rePhone"
                                    type="number"
                                    {...register('phone')}
                                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                    readOnly={formMode == "read"}
                                    tabIndex={formMode == "read" ? -1 : 0}
                                />
                                <div className="invalid-feedback">{errors.phone?.message}</div>
                            </div>
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
            </div>
        </>
    )
}

export default PersonalDetailsForm;