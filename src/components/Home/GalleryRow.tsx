import { Box } from "@mui/material";

import pasta from "../../assets/photos/food/pasta.png";
import salad from "../../assets/photos/food/salad.png";
import cocktail from "../../assets/photos/food/spritz.png";

const images = [pasta, cocktail, salad, pasta, cocktail];

export default function GalleryRow() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        gap: 2,
        bgcolor: "black",
        p: 4
      }}
    >
      {images.map((img, i) => (
        <Box
          key={i}
          component="img"
          src={img}
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            borderRadius: 3
          }}
        />
      ))}
    </Box>
  );
}