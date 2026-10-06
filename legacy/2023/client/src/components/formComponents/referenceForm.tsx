import React, { useEffect, useState } from 'react'
import styles from './formComponents.module.scss';
import { FormGroup, Label, Input } from 'reactstrap';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller } from 'react-hook-form';

interface ReferenceFormProps {
    mode: string,
    getReferenceFormData: any,
    toggleOrderSummary: any,
    togglePaymentBtn: any,
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({ mode, getReferenceFormData, toggleOrderSummary, togglePaymentBtn}) => {
    type referenceFormData = {
        referenceOther: string;
        references: any;
    }

    const personalDetailsSchema = Yup.object().shape({
        references: Yup
        .array()
        .min(1, 'Please select at least one reference')
        .required('Please select at least one reference'),
        referenceOther: Yup.string().
        test("otherReferences", "This field is required", (value: any) => {
            // console.log(value?.length)
            if (otherActive && value == "") return false; // no file provided
            else return true
        }),
    });


    /*personal Details form */
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<referenceFormData>({
        resolver: yupResolver(personalDetailsSchema),
        defaultValues: {

        }
    });

    useEffect(() => {
        setformMode(mode)
      }, [mode])


    const onSubmit = (data: referenceFormData) => {
        console.log(data);
        let tempData = data.references;
        let referenceText = tempData.join();
        if(otherActive){
            if(tempData[tempData.length - 1].toLowerCase() == 'other'){
                referenceText = referenceText.replace("Other",data.referenceOther);
            }
            // tempData.push(tempData.referenceOther);
        }
        
        console.log(referenceText);

        getReferenceFormData({"references":referenceText});
        setformMode('read');
        toggleOrderSummary("active")
        togglePaymentBtn(true);
        
    }
    const [referencesMode, setReferenceMode] = useState([false,false,false,false,false,false,false,false,false,false]);
    const [otherActive, setOtherActive] = useState(false);

    const handleCheck = (index:any) => {
        let tempReferences = referencesMode;
        tempReferences[index] = !tempReferences[index]
        setReferenceMode(tempReferences)
        if(index == 9){
            setOtherActive(referencesMode[index])
        }
    };

    const [textValue, setTextValue] = useState('');

    const handleTextChange = (event:any) => {
        setTextValue(event.target.value);
      };

    const [formMode, setformMode] = useState(mode);
    const references = [
        "Word of Mouth",
        "Instagram",
        "LinkedIn",
        "FaceBook",
        "Whatsapp",
        "Email",
        "NewsLetter",
        "Flyer",
        "Poster",
        "Other"
    ]
    return (
        <>
            <div className={`${styles.reference_details} ${styles.form_accordion}`}>
                <div className={styles.form_accordion_head}>
                    <h3>
                        How did you hear about us?
                    </h3>
                    <div>
                        {formMode == "read" &&
                            <a href="javascript:;" onClick={() => {setformMode("edit");toggleOrderSummary("edit");togglePaymentBtn(false);}}>+Edit</a>
                        }
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} id="rePersonalDetails" className={`${formMode == "read" ? styles.form_readOnly : ''}`}>
                    <div className={styles.form_accordion_body}>
                        {formMode == "edit" && 
                            <div className={styles.row_group}>
                            <div className={styles.form_group}>
                                {references.map((option,index) => (
                                    <>
                                        <label htmlFor={option} key={option+index} className={styles.form_check_label}>
                                            <input id={option}
                                                type="checkbox"
                                                {...register('references')}
                                                className={`form-check-input ${errors.references ? 'is-invalid' : ''}`}
                                                // checked={referencesMode == option}
                                                value={option}
                                                onChange={()=>handleCheck(index)}
                                            ></input>
                                            {option}
                                            <span className={styles.checkmark}></span>
                                        </label>
                                    </>
                                ))}
                                {errors.references && 
                                <div className={`${errors.references ? 'is-invalid' : ''}`}>

                                    <div className="invalid-feedback">
                                        Please select at least one reference
                                    </div>
                                </div>
                                }
                            </div>
                        </div>
                        }
                        {(otherActive && formMode == "edit" ) &&
                             <div className={styles.row_group}>
                             <div className={styles.form_group}>
                                 <label htmlFor="reFName">Please Specify <span className={styles.required}>*</span></label>
                                 <input id="reFName"
                                     type="text"
                                     {...register('referenceOther')}
                                     className={`form-control ${errors.referenceOther ? 'is-invalid' : ''}`}
                                     onChange={handleTextChange}
                                     value={textValue}
                                 />
                                 <div className="invalid-feedback">{errors.referenceOther?.message}</div>
                             </div>
                         </div>
                        }
                    </div>
                    {formMode == "read" && 
                        <div className={styles.row_group}>
                        <div className={`${styles.form_group} ${styles.referencesParent}`}>
                        {references.map((option,index) => (
                           <>
                               {(referencesMode[index] && index!== 9) &&
                                   <div
                                    className={styles.referenceLabel}
                                   >
                                    {option}</div>
                               }
                               {(index == 9 && referencesMode[index]) &&
                                   <div className={styles.referenceLabel}>
                                       {textValue}
                                   </div>
                               }
                           </>
                        ))}
                       </div>
                   </div>
                    }   
                    <div>
                        {formMode == "edit" && (
                            <>
                                <button className={`${styles.primaryButton} ${styles.next_btn}`}>
                                    Next
                                </button>
                            </>
                        )
                        }
                    </div>
                </form>
            </div>
        </>
    )
}

export default ReferenceForm;