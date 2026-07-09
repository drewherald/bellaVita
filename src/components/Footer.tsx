import { Box, IconButton, Link } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import logo from '../assets/photos/bellaVitaLogo.png'

export default function Footer() {
  return (
    <>
<hr style={{
  border: 'none',
  borderTop: '1px solid white',
  margin: 0
}} />
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
       
         
    <Link
      href="https://www.facebook.com/p/Bella-Vita-KY-61575435511631/"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: "white",
        textDecoration: "none",
        "&:visited": {
          color: "white",
        },
        "&:hover": {
          color: "#ddd",
        },
      }}
    >
      <IconButton sx={{ color: "inherit" }}>
        <FacebookIcon sx={{ fontSize: "5svh" }} />
      </IconButton>
    </Link>

        <Link
      href="https://www.instagram.com/bellavitaky/"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: "white",
        textDecoration: "none",
        "&:visited": {
          color: "white",
        },
        "&:hover": {
          color: "#ddd",
        },
      }}
    >
      <IconButton sx={{ color: "inherit" }}>
        <InstagramIcon sx={{ fontSize: "5svh" }} />
      </IconButton>
    </Link>


        <Link
      href="https://x.com/BellaVitaKY"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: "white",
        textDecoration: "none",
        "&:visited": {
          color: "white",
        },
        "&:hover": {
          color: "#ddd",
        },
      }}
    >
      <IconButton sx={{ color: "inherit" }}>
        <XIcon sx={{ fontSize: "5svh" }} />
      </IconButton>
    </Link>
      
      </Box>
    </Box>
    </>
  );
}