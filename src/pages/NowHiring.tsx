import Footer from "../components/Footer";
import { Box } from "@mui/material";
import CareersIntro from "../components/Careers/CareersIntro";
import CareersForm from "../components/Careers/CareersForm";
import Navbar from "../components/Navbar";

export default function NowHiring() {
  return (
    <Box sx={{backgroundColor: 'black'}}>
      <Navbar />
      <CareersIntro />
      <CareersForm />
      <Footer />
    </Box>
  );
}