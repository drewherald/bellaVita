import { Box, Typography } from "@mui/material";
import "../../assets/styles/Menu/MenuHero.css";
import hero from "../../assets/photos/menu/foodAD.png";

export default function MenuHero() {
  return (
    <Box
      className="menuHero"
      sx={{ backgroundImage: `url(${hero})`}}
    >
      <Typography variant="h3" className="heroTitle">
        Food & Drink
      </Typography>
    </Box>
  );
}