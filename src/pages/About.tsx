import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import AboutHero from "../components/About/AboutHero";
import LocationInfo from "../components/About/LocationInfo";
import StorySection from "../components/About/StorySection";
import MapSection from "../components/About/MapSection";
import ValetSection from "../components/About/ValetSection";
import ReservationCTA from "../components/About/ReservationCTA";

export default function About() {

  return (
    <>
      <Navbar />

      <AboutHero />

      <LocationInfo />

      <StorySection />

      <MapSection />

      <ValetSection />

      <ReservationCTA />

      <Footer />
    </>
  )
}