import { Box, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import { Link } from "react-router-dom";
import logo from '../../assets/photos/bellaVitaLogo.png'

export default function HomeNavbar() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        padding: '20px 0',
        width: "100svw",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        zIndex: 2,
                fontFamily: `"Alegreya", "Helvetica", "Arial", sans-serif`

      }}
    >
      <Box sx={{width: '15svw', padding: '0 20px', display: 'flex', justifyContent: 'flex-start',}}>
              <img src={logo} alt="bella vita" style={{maxWidth: '7.5svw',  opacity: '0'}}/>
      </Box>
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