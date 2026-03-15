import { Box, Typography } from "@mui/material";
import "../../assets/styles/Menu/MenuCards.css";

export default function MenuCards() {
  return (
    <Box className="menuCardsContainer">

      <Box className="menuCard">
        <Typography variant="h5">Menu</Typography>
      </Box>

      <Box className="menuCard">
        <Typography variant="h5">Menu</Typography>
      </Box>

    </Box>
  );
}