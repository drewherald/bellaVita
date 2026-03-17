import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/StorySection.css";

export default function StorySection(){

  return(
    <Box className="storySection">

      <Typography variant="h3" className="storyTitle">
        Our Roots
      </Typography>

     {/* <Box className="storyImage">
        <Typography>Maybe pic of chef/team here</Typography>
      </Box>*/}

      <Box className="storyText">

<Typography>
       It all started with a small family on the Southside of Chicago with a deep history that
 goes back to Calabria, Italy. A middle-class upbringing where hard work was important,
 family values meant something and dinner took place every day at 5:00 pm. We all
 looked forward to the nights when mom would cook Italian because the recipes go back
 generations and it was always a special night. Frank Sinatra, the Rat Pack or Motown
played in the kitchen while mom made homemade gravy (sauce) and meatballs. The
smell was something I will never forget! Back then, a lot of the fathers in the neighborhood worked at the Steel Mills in Gary, Indiana. On the weekends, the families
 in the neighborhood would always get together – everyone outside, cooking, breaking
 bread, drinking wine (the adults of course) and enjoying life and each other!
 </Typography>
<Typography>
Combing the family history of Italy and growing up in Chicago, the days of listening to
 Tony Ocean at Jilly’s in downtown Chicago and eating at Tufano’s Vernon Park Tap as a
 youngster and still today. We wanted to bring some of that rich history and flavor to
 Northern Kentucky.
 </Typography>
   <Typography variant="h3" className="storyTitleSub">
        Bella Vita Today
      </Typography>
<Typography>
Which brings us to today and Bella Vita! We wanted to create a place where great food,
amazing service and a welcoming environment hopefully take you back to the moments
 of great gatherings that you remember in essence “The Good Life” which is Bella Vita!
 </Typography>
   <Typography variant="h3" className="storyTitleSub">
        The Kitchen
      </Typography>
<Typography>
Led by Chef Phillip Gentry, Bella Vita’s cuisine will be focused on our food and the
 experience while you’re here! Chef Gentry, “I couldn’t be more excited to lead the
 culinary team at Bella Vita.! Food has been my life for as long as I can remember.
Between cooking shows, culinary summer camp, and working alongside my father’s hip
 in the kitchen, I knew, from the age of nine, I’d be a Chef. My career has led me to many
 great adventures and exciting ways that I have fulfilled and nourished that dream. I’ve
 traveled, I’ve led teams, I’ve taught, I’ve learned. I’ve spent time in many kitchens,
wearing many different hats, and taking many responsibilities. But through all my
experiences, one constant has rung through; my love for really good food, and its ability
to bring people together. 
The way I say it is “<i>I make the food you want to eat</i>,”  so come
join in, we saved you a seat!</Typography>
      </Box>

    </Box>
  )
}