import { Box, Typography, Button } from "@mui/material";
import restaurant from "../../assets/photos/home/heroImage.png";
import RedButton from "../RedButton";

export default function AboutSection() {
  return (
    <Box
      sx={{
        position: "relative",
        height: "70vh",
        backgroundImage: `url(${restaurant})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        color: "white",
        p: 10
      }}
    >
       {/* overlay */}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: '1'

      }}
    />
      <Box sx={{zIndex: '2', maxWidth: '30svw'}}>
        <Typography sx={{fontSize: '1.5rem'}} mb={3}>
          Nestled in Union, Kentucky, Bella Vita offers an inviting place to
          slow down and enjoy Italian dishes inspired by tradition.
        </Typography>

                <RedButton data={{text: 'About', link: '/'}} />

      </Box>
    </Box>
  );
}