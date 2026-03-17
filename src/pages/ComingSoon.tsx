import Footer from "../components/Footer";
import ComingSoonHero from "../components/ComingSoon/ComingSoonHero";
import ComingSoonNavbar from "../components/ComingSoon/ComingSoonNavbar";
import CareersIntro from "../components/Careers/CareersIntro";
import CareersForm from "../components/Careers/CareersForm";
import { Box } from "@mui/material";

export default function ComingSoon() {
  return (
    <Box sx={{backgroundColor: 'black'}}>
      <ComingSoonNavbar />
      <ComingSoonHero />

      <CareersIntro />

      <CareersForm />

      <Footer />
    </Box>
  );
}