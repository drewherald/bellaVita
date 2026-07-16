import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/StorySection.css";
import chef from '../../assets/photos/about/chef.jpg'
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
     It all started with a small family on the southside of Chicago with a deep history that
goes back to Calabria, Italy. A middle-class upbringing where hard work was important,
family values meant something and dinner took place every day at 5:00 pm. We all
looked forward to the nights when mom would cook because her recipes go back
generations. Frank Sinatra, Dean Martin and Motown played in the kitchen while mom
made homemade gravy (sauce) and meatballs. The smell was something I will never
forget!
 </Typography>
<Typography>
Combining both an Italian and Chicago upbringing along with a strong background of
success in the hospitality and restaurant businesses, we wanted to bring that rich
history to Northern Kentucky where we currently reside.
 </Typography>
   <Typography variant="h3" className="storyTitleSub">
        Bella Vita Today
      </Typography>
<Typography>
Which brings us to today and Bella Vita! We wanted to create a place where great food,
amazing service and a welcoming environment are at the forefront of your experience.
Our goal is to take you back to the moments of great gatherings that you remember in
essence……..“The Good Life” which is…… <i>Bella Vita</i>!
 </Typography>

<Typography variant="h3" className="storyTitleSub">
        The Kitchen
      </Typography>
 <Box className='kitchenWrapper'>
   
<Typography className="kitchenText">
Led by Chef Phillip Gentry, Bella Vita’s cuisine will be focused on authentic Italian
cuisine as well as a few tantalizing enhancements. Chef Gentry: <i>“I couldn’t be more
excited to lead the culinary team at Bella Vita.! Food has been my life for as long as I
can remember. Between cooking shows, culinary summer camp, and working alongside
my father’s hip in the kitchen, I knew, from the age of nine, I’d be a Chef. My career has
led me to many great adventures and exciting ways that I have fulfilled and nourished
that dream. I’ve traveled, I’ve led teams, I’ve taught, I’ve learned. I’ve spent time in
many kitchens, wearing many different hats, and taking many responsibilities. But
through all my experiences, one constant has rung through; my love for really good
food, and its ability to bring people together. </i>The way I say it is: <i>“I make the food you
want to eat,” so come join in, we saved you a seat!</i></Typography>

<img src={chef} className="chefPic"></img>
</Box>
      </Box>

    </Box>
  )
}