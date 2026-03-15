import { Box, Typography } from "@mui/material";
import hero from "../../assets/photos/about/aboutHero.png";
import "../../assets/styles/About/AboutHero.css";

export default function AboutHero(){

  return(
    <Box
      className="aboutHero"
      sx={{backgroundImage:`url(${hero})`}}
    >

      <Typography variant="h3" className="aboutHeroTitle">
        About
      </Typography>

    </Box>
  )
}