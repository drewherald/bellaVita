import { Box } from "@mui/material";
import logo from '../assets/photos/bellaVitaLogo.png'
import { Link } from "react-router-dom";
import NavbarLinks from "./NavbarLinks";

export default function Navbar() {
  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        top: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: '20px 0',
        width: "100svw",
        color: "white",
        zIndex: 2,
        backgroundColor: 'black',
      }}
    >
      <Box component={Link} to="/" sx={{width: { xs: 'auto', sm: '15svw' }, padding: '0 20px', display: 'flex', justifyContent: 'flex-start'}}>
        <Box component="img" src={logo} alt="bella vita" sx={{maxWidth: { xs: '90px', sm: '7.5svw' }}}/>
      </Box>
      <NavbarLinks />
      <Box aria-hidden="true" sx={{width: '15svw', padding: '0 20px', display: { xs: 'none', sm: 'block' }}} />
    </Box>
  );
}
