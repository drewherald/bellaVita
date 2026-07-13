import { Box } from "@mui/material";
import "../../assets/styles/Menu/MenuCards.css";
import Menu1 from '../../assets/photos/menu/_Bella Vita Menu Designs-1.jpg'
import Menu2 from '../../assets/photos/menu/_Bella Vita Menu Designs-2.jpg'
import Menu3 from '../../assets/photos/menu/_Bella Vita Brunch Menu (1).jpg'
import Menu4 from '../../assets/photos/menu/Bella Vita Cocktail, Beer & Dessert Menus-1.jpg'


export default function MenuCards() {
  return (
    <Box className="menuCardsContainer">

      <Box className="menuCard">
        <img src={Menu1} alt='menu' style={{maxWidth: '95%'}}/>
      </Box>

      <Box className="menuCard">
        <img src={Menu2} alt='menu' style={{maxWidth: '95%'}}/>
      </Box>
      

        <Box className="menuCard">
        <img src={Menu3} alt='menu' style={{maxWidth: '95%'}}/>
      </Box>

      <Box className="menuCard">
        <img src={Menu4} alt='menu' style={{maxWidth: '95%'}}/>
      </Box>

    </Box>
  );
}