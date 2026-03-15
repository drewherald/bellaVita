import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GalleryTabs from "../components/Gallery/GalleryTabs";
import ReservationCTA from "../components/About/ReservationCTA";

export default function Gallery() {

  return (
    <>
      <Navbar />

       <GalleryTabs />

       <ReservationCTA />

      <Footer />
    </>
  )
}