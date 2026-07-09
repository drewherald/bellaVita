import { Box, Typography } from "@mui/material";
import chef from "../../assets/photos/home/steakPlate.png";
import RedButton from "../RedButton";
import "../../assets/styles/Home/ChefFeature.css";

export default function ChefFeature() {
  return (
    <Box className="chef-feature">
      <Box className="chef-feature-content">
        <Typography className="chef-feature-text">
          Handcrafted Italian dishes, rich flavors, and timeless recipes —
          made to be shared, savored, and remembered.
        </Typography>

        <span className="menuButton"><RedButton data={{ text: "Menu", link: "/menu" }} /></span>
      </Box>

      <Box
        component="img"
        src={chef}
        className="chef-feature-image"
      />
    </Box>
  );
}