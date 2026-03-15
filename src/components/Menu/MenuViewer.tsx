import { Box, Typography } from "@mui/material";
import "../../assets/styles/Menu/MenuViewer.css";

export default function MenuViewer() {
  return (
    <Box className="menuViewerContainer">

      <Box className="menuViewer">
        <Typography variant="h4">Menu</Typography>
      </Box>

      <Box className="menuNotes">

        <p>• Can Be Made with Gluten Free Ingredients  ‡ Contains Nuts  ◊ Contains Alcohol</p>

        <p>
        *These items are cooked to order. Consuming raw or undercooked meats,
        poultry, seafood, shellfish, or eggs may increase your risk of foodborne illness.
        </p>

        <p>
        Please advise your server of any dietary restrictions or food allergies.
        Not all ingredients are listed and we cannot guarantee our food is completely
        free of any allergens.
        </p>

      </Box>

    </Box>
  );
}