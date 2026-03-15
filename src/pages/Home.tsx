import Hero from "../components/Home/Hero";
import ChefFeature from "../components/Home/ChefFeature";
import GalleryRow from "../components/Home/GalleryRow";
import AboutSection from "../components/Home/AboutSection";
import PrivateDining from "../components/Home/PrivateDining";
import Footer from "../components/Footer";
import HomeNavbar from "../components/Home/HomeNavbar";

export default function Home() {
  return (
    <>
      <HomeNavbar />
      <Hero />
      <ChefFeature />
      <GalleryRow />
      <AboutSection />
      <PrivateDining />
      <Footer />
    </>
  );
}