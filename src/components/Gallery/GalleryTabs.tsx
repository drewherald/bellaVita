import { Box, Typography } from "@mui/material";
import "../../assets/styles/Menu/MenuTabs.css";
import RedButton from "../RedButton";

const tabs = [
  "Appetizers",
  "Entrees",
  "Salads",
  "Desserts",
  "Sides",
  "Cocktails"
];

export default function GalleryTabs() {

  return (
    <Box className="menuTabsSection">

      <Box sx={{paddingBottom: '5svh'}}>
      <Typography sx={{color: 'white'}} variant="h2" >Gallery</Typography>
      </Box>


      <Box className="tabsContainer">

        {tabs.map((tab,i)=>(
          <RedButton key={i} data={{text: `${tab}`, link: '/'}} />

        ))}

      </Box>

    </Box>
  );
}