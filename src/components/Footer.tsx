import { Box, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import logo from '../assets/photos/bellaVitaLogo.png'

export default function Footer() {
  return (
    <Box
      sx={{
        bgcolor: "black",
        color: "white",
        textAlign: "center",
        py: 10
      }}
    >
      <img src={logo} alt="bella vita" style={{height: '20svh', padding: '5svh 0 10svh 0'}}/>

      <Box>
       {/* <IconButton sx={{ color: "white" }}>
          <FacebookIcon />
        </IconButton>
        <IconButton sx={{ color: "white" }}>
          <InstagramIcon />
        </IconButton>*/}
      </Box>
    </Box>
  );
}