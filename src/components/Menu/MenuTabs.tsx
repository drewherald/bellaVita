import { Box, Button } from "@mui/material";
import "../../assets/styles/Menu/MenuTabs.css";
import RedButton from "../RedButton";

const tabs = [
  "Dinner",
  "Cocktails",
  "Wine and Spirits",
  "Dessert",
  "Lunch",
  "Happy Hour"
];

export default function MenuTabs() {

  return (
    <Box className="menuTabsSection">

      <Box sx={{paddingBottom: '5svh'}}>
      <RedButton data={{text: 'Make Reservations', link: '/'}} />

      </Box>


      <Box className="tabsContainer">

        {tabs.map((tab,i)=>(
          <RedButton key={i} data={{text: `${tab}`, link: '/'}} />

        ))}

      </Box>

    </Box>
  );
}