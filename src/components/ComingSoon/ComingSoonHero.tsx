import { Box, Typography } from "@mui/material";
import hero from "../../assets/photos/home/heroImg.jpg";
import logo from '../../assets/photos/bellaVitaLogo.png'
import RedButton from "../RedButton";
import '../../assets/styles/ComingSoon/ComingSoonHero.css'

export default function ComingSoonHero() {
  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${hero})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "white"
      }}
    >
        <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          zIndex: '1'
        }}
      />

      <Box sx={{zIndex: '2'}}>
            <img className="bellaVitaHeroLogoCS" src={logo} alt="bella vita"/>
            <Typography variant="h5" sx={{paddingTop: '3svh'}}> 9914 Old Union Road,<br/>
        Union, KY 41091</Typography>
        <Box mt={4} display="flex" gap={3} justifyContent="center">
          <RedButton data={{text: 'Menu', link: '/menu'}} />
          <RedButton data={{text: 'Our Story', link: '/about'}} />
        </Box>
      </Box>
    </Box>
  );
}