import React, { useState } from 'react'
import Accordion from '../Accordion/accordion';
import Footer from '../reFooter/reFooter';
import Header from '../reHeader/header';
import styles from './faq.module.scss';

function FAQ() {
    const panels = [
        {
            label: 'What is the process of returning items directly from my doorstep?',
            content: 'We provide a doorstep pickup service for all the items you want to return. All you need to do is book a pickup online through the Return Initiation Form on our website and provide us with the details of the items you wish to return. Our team will then come and collect the items from your doorstep during the pickup time slot you choose.',
        },
        {
            label: 'What types of items can I return with Return Done? ',
            content: 'You can return any shopped item, bought online or in store, which is within the return deadline and in a returnable condition. This includes a wide range of items, including clothing, electronics, household goods, and more. However, there may be restrictions on certain items due to store policies or legal regulations.',
        },	
        {
            label: 'Are there any items that cannot be returned with Return Done? ',
            content: ' Certain items may have restrictions due to store policies, legal regulations, or safety considerations. Examples include perishable items, hazardous materials, and personalized or customized products. If you are unsure about the eligibility of a specific item, please reach out to our customer support for clarification.',
        },
        {
            label: 'Can I return items without packaging?',
            content: 'Yes, you can. Leave the worry of packaging and printing out your label on us. Our experts take care of it all. In fact, we encourage you to not pack the items so that our pickup specialist can easily verify the items and their condition at the time of pickup.',
        },
        {
            label: 'How long does the return process take?',
            content: ' We pick up items from your doorstep at your conveniently selected date and time slot. As soon as we have the package we get it to the retailer in a timely manner at the earliest without missing the deadline and get you your deserved refund ASAP.',
        },
        {
            label: 'Do I have to pay for the return service?',
            content: 'Yes, You just have to pay $9.99 per pickup and you can return items from up to 5 stores per pickup. You can save an additional $2 if you choose to return on our Return Day.',
        },
        {
            label: 'Can I return items from different stores in a single pickup? ',
            content: 'Yes, you can return items from up to 5 different stores in a single pickup. Simply provide the necessary details for each store in our Return Initiation Form and our team will ensure that the items are returned to their respective stores.',
        },
        {
            label: 'Can I track the progress of my return? ',
            content: 'Yes, we provide tracking updates throughout the return process. You will receive notifications via email to keep you informed about the status of your return.',
        },
        {
            label: 'Do I need to provide any proof of purchase for the item I am returning? ',
            content: 'Yes, you need to provide the online-generated prepaid shipping label provided by the seller in case of an online-bought item or a shopping receipt in case of an item bought in store.',
        },
        {
            label: 'How long do I need to wait for the refund? ',
            content: 'The refund process typically takes 7-10 business days from the date the item is received by the seller. This can vary between sellers. Please check your seller’s return policy. You can always contact us to know more about your refund.',
        },
        {
            label: 'What if I need to change or cancel my pickup? ',
            content: 'If you need to modify or cancel your pickup, please notify us at least 2 hours before your scheduled pickup slot. You can email us at support@example.com with your request, and our team will assist you.',
        },
        {
            label: 'What happens if the store refuses to accept the return? ',
            content: 'In the rare event that a store refuses to accept the return, we will contact you immediately to discuss alternative solutions. Our team will work with you to find the best possible resolution.',
        },
        {
            label: 'What if I miss the pickup slot? ',
            content: 'If you miss the scheduled pickup slot, please contact our customer support team as soon as possible. We will assist you in rescheduling your pickup for an additional pickup fee.',
        },
        {
            label: 'Is Return Done available in my area?',
            content: 'We are continually expanding our service to new areas. Currently, Return Done is available in the city of Chicago. You can visit our website or contact our customer support at support@example.com for the most up-to-date information.',
        },
        {
            label: 'Is my personal information and payment secure with Return Done? ',
            content: 'Yes, we take the security and privacy of your personal information seriously. We utilize industry-standard security measures to protect your data during transmission and storage. For payment processing, we have partnered with a secure and trusted payment gateway, Stripe, to ensure the confidentiality and integrity of your transactions.',
        },
        {
            label: 'What if I have additional special instructions for the return pickup? ',
            content: 'If you have any specific instructions or requirements for the return pickup, please email us at support@example.com after successfully placing a pickup request. Make sure you include your Request ID in the email. Our team will do their best to accommodate your requests and ensure a smooth pickup experience.',
        },
        {
            label: 'Is there a weight or size limit for the items I can return?',
            content: 'While there is no specific weight or size limit, please note that our team needs to be able to safely handle and transport the items during the pickup. If you have any concerns about the size or weight of your items, please reach out to our customer support for further assistance.',
        },
        {
            label: 'How can I contact Return Done for further assistance or inquiries? ',
            content: 'For any additional questions, concerns, or inquiries, you can reach out to our customer support team via email at support@example.com. Our team is available from 8 AM to 8 PM Monday to Sunday to assist you.',
        }
        ,
    ];
    const [accordionPanels, setAccordionPanels] = useState(panels);
    
  return (
    <>
    <Header></Header>
    <section className={styles.reFAQs} id="reFAQs">
        <h2>Frequently Asked Questions</h2>
        {accordionPanels.map((item,index)=>{
            return(
                <Accordion customClass={styles.faqAccordion} key={index} index={index} label={item.label} content={item.content} >
                </Accordion>
            )
        })}
    </section>
    <Footer></Footer>
    </>
  )
}

export default FAQ