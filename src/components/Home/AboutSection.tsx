import { Box, Typography } from "@mui/material";
//import restaurant from "../../assets/photos/home/heroImg.jpg";
import RedButton from "../RedButton";
import "../../assets/styles/Home/AboutSection.css"
import salad from "../../assets/photos/menu/foodAD.png";

export default function AboutSection() {
  return (
    <Box
      className="about-section"
/*      sx={{ backgroundImage: `url(${restaurant})` }}*/>
      {/* overlay */}
      <img src={salad} className="saladPic"/>
      <Box className="about-section-overlay" />

      <Box className="about-section-content">
        <Typography className="about-section-text">
          Nestled in Union, Kentucky, Bella Vita offers an inviting place to
          slow down and enjoy Italian dishes inspired by tradition.
        </Typography>
        <span className="aboutButtonAbtSec"><RedButton data={{ text: "About", link: "/about" }} /></span>
      </Box>
    </Box>
  );
}