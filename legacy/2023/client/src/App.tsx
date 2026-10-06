import './App.scss';
import { Routes, Route } from 'react-router-dom';

//components
import Header from "./components/reHeader/header";
import Banner from "./components/reBanner/banner";
import Benefits from './components/reBenfits/benefits';
// import ReturnForm from './components/returnForm/returnForm';
import FormPage from './components/formPage/formPage';
import Footer from './components/reFooter/reFooter';
import Faq from './components/faq/faq';
import SwiperCarousel from './components/swiperComponent/swiper';
import ReSteps from './components/reSteps/reSteps';
import {sendEmail} from './services/emailService';
import SuccessPage from './components/SuccessPage/successPage';
import Pricing from './components/rePricing/pricing';
import Testimonials from './components/Testimonials/testimonials';
// import TermsAndConditions from './components/TermsAndConditions/termsAndConditions';
// import PrivacyPolicy from './components/PrivacyPolicy/privacyPolicy';

function App() {
  return (
    <>
    <div className="returnDone">
      {/* <Link to="/">Home</Link>
      <Link to="/about">About</Link> */}
      <Routes>
        <Route path="/" element={
        <>
          <Header></Header>
          <Banner></Banner>
          {/* <button onClick={sendEmail}>Click me</button> */}
          <SwiperCarousel></SwiperCarousel>
          <ReSteps></ReSteps>
          <Benefits></Benefits>
          <Testimonials></Testimonials>
          <Pricing></Pricing>
          {/* <Faq></Faq> */}
          <Footer></Footer>
        </>
        } />
        <Route path="/submitReturn" element={<>
          <FormPage></FormPage>
        </>
      } />
      <Route path="/success" element={<>
          <SuccessPage></SuccessPage>
        </>
      } />
      <Route path="/faqs" element={<>
          <Faq></Faq>
        </>
      }/>
      {/* <Route path="/termsConditions" element={<>
          <TermsAndConditions></TermsAndConditions>
        </>
      }/>
      <Route path="/privacyPolicy" element={<>
          <PrivacyPolicy></PrivacyPolicy>
        </>
      }/> */}
      
      </Routes>
    </div>
    </>
  );
}

export default App;
