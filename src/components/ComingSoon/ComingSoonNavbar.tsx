import { Box } from "@mui/material";
import logo from '../../assets/photos/bellaVitaLogo.png'
import NavbarLinks from "../NavbarLinks";

export default function ComingSoonNavbar() {
  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        position: "absolute",
        top: 0,
        padding: '20px 0',
        width: "100svw",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        zIndex: 2
      }}
    >
      <Box aria-hidden="true" sx={{width: '15svw', padding: '0 20px', display: 'flex', justifyContent: 'flex-start'}}>
        <img src={logo} alt="" style={{maxWidth: '7.5svw', opacity: '0'}}/>
      </Box>
      <NavbarLinks />
      <Box aria-hidden="true" sx={{width: '15svw', padding: '0 20px', display: { xs: 'none', sm: 'block' }}} />
    </Box>
  );
}
