import React, { useContext } from 'react';
import Hero from '../../components/Hero/Hero';
import Features from '../../components/Features/Features';
import StatesSection from '../../components/StatesSection/StatesSection';
import CTASection from '../../components/CTASection/CTASection';
import PortalSelector from '../../components/PortalSelector/PortalSelector';
import './Home.css';

const Home = () => (
  <div className="home">
    <Hero />
    <PortalSelector />
    <Features />
    <StatesSection />
    <CTASection />
  </div>
);

export default Home;
