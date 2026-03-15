import { Box, Button } from "@mui/material";
import hero from "../../assets/photos/home/heroImage.png";
import logo from '../../assets/photos/bellaVitaLogo.png'
import RedButton from "../RedButton";

export default function Hero() {
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
            <img src={logo} alt="bella vita"/>

        <Box mt={4} display="flex" gap={3} justifyContent="center">
          <RedButton data={{text: 'View Menu', link: '/'}} />
          <RedButton data={{text: 'Reservations', link: '/'}} />
        </Box>
      </Box>
    </Box>
  );
}