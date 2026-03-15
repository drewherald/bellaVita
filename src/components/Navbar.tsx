import { Box, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import logo from '../assets/photos/bellaVitaLogo.png'
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <Box
      sx={{
        top: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: '20px 0',
        width: "100svw",
        color: "white",
        zIndex: 2,
        backgroundColor: 'black'
      }}
    >
      <Link to="/" style={{width: '15svw', padding: '0 20px', display: 'flex', justifyContent: 'flex-start'}}>
        <img src={logo} alt="bella vita" style={{maxWidth: '7.5svw'}}/>
      </Link>
      <Box display="flex" gap={4}>
        {["Home", "Menu", "About", "Gallery", "Reserve"].map((item) => (
           <Link to={item == "Home" ? '/' : `/${item}`} key={item} style={{ cursor: "pointer", textDecoration: 'none', color: 'white' }}>
            {item}
          </Link>
        ))}
      </Box>

      <Box  gap={2} sx={{width: '15svw', padding: '0 20px', display:"flex", justifyContent: 'end'}}>
        <IconButton sx={{ color: "white" }}>
          <FacebookIcon />
        </IconButton>
        <IconButton sx={{ color: "white" }}>
          <InstagramIcon />
        </IconButton>
      </Box>
    </Box>
  );
}