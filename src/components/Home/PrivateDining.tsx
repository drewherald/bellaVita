import { Box, Typography, Button } from "@mui/material";
import dining from "../../assets/photos/home/privateDining.png"
import RedButton from "../RedButton";

export default function PrivateDining() {
  return (
    <>
        <hr style={{color: 'white', width: '1px', margin: '0'}}/>

    <Box sx={{ position: "relative" }}>
  <Box
    sx={{
      height: "60vh",
      backgroundImage: `url(${dining})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      color: "white",
      textAlign: "center",
      position: "relative"
    }}
  >
    {/* overlay */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)"
      }}
    />

    {/* content */}
    <Box sx={{ position: "relative", zIndex: 2 }}>
      <Typography variant="h3" mb={2}>
        Private Dining
      </Typography>

      <RedButton data={{ text: "Learn More", link: "/" }} />
    </Box>
  </Box>
</Box>
    <hr style={{color: 'white', width: '1px', margin: '0'}}/>
</>
  
  );
}