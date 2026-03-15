import { Box, Typography } from "@mui/material";
import chef from "../../assets/photos/home/steakPlate.png";
import RedButton from "../RedButton";

export default function ChefFeature() {
  return (
    <Box
      sx={{
        display: "flex",
        position: 'relative'
      }}
    >
      <Box p={8} sx={{  
        position: 'absolute',
        color: 'white',
        width: '30svw',
        top: '30svh',
        left: '5svw'}} 
        display="flex" flexDirection="column" justifyContent="center">
        <Typography mb={3} sx={{fontSize: '1.5rem'}}>
          Handcrafted Italian dishes, rich flavors, and timeless recipes —
          made to be shared, savored, and remembered.
        </Typography>

       
        <RedButton data={{text: 'Gallery', link: '/'}} />

      </Box>

      <Box
        component="img"
        src={chef}
        sx={{ width: "100%", objectFit: "cover" }}
      />
    </Box>
  );
}