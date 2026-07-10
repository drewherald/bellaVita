import Footer from "../components/Footer";
import ComingSoonHero from "../components/ComingSoon/ComingSoonHero";
import ComingSoonNavbar from "../components/ComingSoon/ComingSoonNavbar";
{/*import ChefFeature from "../components/Home/ChefFeature";
import GalleryRow from "../components/Home/GalleryRow";*/}
import AboutSection from "../components/Home/AboutSection";

import { Box } from "@mui/material";

export default function ComingSoon() {
  return (
    <Box sx={{backgroundColor: 'black'}}>
      <ComingSoonNavbar />
      <ComingSoonHero />
      {/*<ChefFeature />
      <GalleryRow />
*/}      <AboutSection />
      <Footer />
    </Box>
  );
}