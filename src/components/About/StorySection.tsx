import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/StorySection.css";
import gm from '../../assets/photos/about/gm.jpg'
import sous from '../../assets/photos/about/sousChef.jpg'
import chef from '../../assets/photos/about/chef.jpg'
export default function StorySection() {

  return (
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

          {/*<img src={chef} className="chefPic"></img>*/}
        </Box>


        <Typography variant="h3" className="storyTitleSub">
          A Word From Our General Manager
        </Typography>
        <Box className='kitchenWrapper'>

          <Typography className="kitchenText">
            I’m Anthony Cooper, General Manager of Bella Vita, and
            I have dedicated my life to the restaurant industry. For
            over three decades, I’ve had the privilege of working in
            nearly every position imaginable—from the kitchen to
            behind the bar, from serving tables and training teams to
            managing entire restaurant operations. Every role has
            shaped my understanding of what makes a restaurant truly
            special: exceptional food, genuine hospitality, a
            passionate team, and an experience that leaves guests
            wanting to return.
            <br /><br />

            Bella Vita is far more than a restaurant to me—it’s the
            realization of a dream built on years of experience,
            passion, and an unwavering love for hospitality. From the
            very beginning, I’ve had the privilege of helping bring
            this vision to life, contributing to everything from our
            service philosophy and guest experience to our wine
            selection, cocktail program, and the countless details that
            make Bella Vita uniquely ours.
            <br /><br />

            I believe the best restaurants aren’t remembered simply
            for the meals they serve, but for the way they make
            people feel. My mission is to create an environment
            where every guest feels genuinely welcomed, personally
            cared for, and leaves feeling a little better than when they
            arrived. Whether you’re celebrating a milestone, enjoying
            a quiet dinner, or gathering with family and friends, I
            hope Bella Vita becomes a place you think of as your
            own.
            <br /><br />


            It is an honor to welcome you into our home, and I look
            forward to sharing this journey with you.
            Welcome to Bella Vita.
            Eat Well. Drink Well. Celebrate.
            Mangia Bene. Bevi Bene. Festeggia.
          </Typography>

          <img src={gm} className="chefPic"></img>


        </Box>

        <Typography variant="h3" className="storyTitleSub">
          Meet the Team
        </Typography>
        <Box className='kitchenWrapper'>

            <img src={chef} className="chefPicInvert"></img>

          <Typography className="kitchenText">
            My name is Philip Gentry and I’m beyond ecstatic to begin the journey of bringing fine Italian
            cuisine to Union. My whole life, my passion, my reason to be, has revolved around food. Eating,
            cooking, tasting, experimenting, adventuring and exploring; it all comes back to this pure and
            simple notion. Food and family are what make life beautiful and good. I feel such a great honor
            in being a part of the celebrations, love, and joy that people share in restaurants every day.
            Thank you to everyone in our community who are eager to have us be a part. We are proud to
            be able to serve you and bring a bit of la bella vita to you.
          </Typography>

          <img src={chef} className="chefPicMobile"></img>
        
        </Box>

       
        <Box className='kitchenWrapper'>

          <Typography className="kitchenText">
            Hi I’m Chef Brock, born and raised in Cincinnati, OH and I am the executive sous chef here at Bella Vita. My love for cooking was inspired by my grandmothers and aunts. On any given day you could catch them cooking up something delicious or watching the Food Network. Growing up I never knew I would be a Chef but I knew I loved to eat!
            <br/> <br/>
            I've been in the industry for 14 years: I started off as a line cook and worked my way up to executive chef. Throughout the course of my career I have worked in the some of the most prestigious restaurants in Cincinatti such as Jean-Robert’s Table, Boca, and Jeff Ruby's. My experience ranges from French, Italian, and Fine Dining to running my own catering business.
            I enjoy cooking because it never gets old and there’s always something new, not to mention the countless number of hard working and passionate people I’ve met over the years in this industry. We have some wonderful people here at Bella Vita who have incredible skill sets and experiences that will ensure every guest leaves feeling special!
          </Typography>
          <img src={sous} className="chefPic"></img>
        </Box>

      </Box>

    </Box>
  )
}