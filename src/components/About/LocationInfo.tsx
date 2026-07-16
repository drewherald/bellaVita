import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/LocationInfo.css";
import { Link } from "react-router-dom";

export default function LocationInfo(){

  return(
    <Box className="locationSection">

      <Typography className="addressTitle">
        9914 Old Union Road,<br/>
        Union, KY 41091
      </Typography>

      <Typography className="contactText">
        <a href="tel:+18595340499" style={
   { textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer'}
  }>859-534-0499</a>  <br/>
        <Link style={{color: 'white', textDecoration: 'none'}} to="mailto:info@bellavitaky.com">info@bellavitaky.com</Link>
      </Typography>

      <hr className="divider"/>

      <Typography sx={{fontWeight: '500'}} variant="h5">
        Hours of Operation
      </Typography>
      <br/>

      <Box className="hoursGrid">

        <Box>
          <Typography className="hoursTitle">Wednesday – Thursday</Typography>
          <Typography>4 pm - 9 pm, Bar Open to 10 pm</Typography>
        </Box>

        <Box>
           <Typography className="hoursTitle">Friday-Saturday</Typography>
          <Typography>4 pm - 10 pm, Kitchen & Bar</Typography>
        </Box>

        <Box>
          <Typography className="hoursTitle">Sunday Brunch</Typography>
          <Typography>Coming Soon!</Typography>
        </Box>

        <Box>
          <Typography className="hoursTitle">Sunday Dinner</Typography>
          <Typography>4 pm - 9 pm</Typography>
        </Box>

      </Box>

    {/*  <Typography className="hoursNote">
        Brunch menu is served on weekends until 2pm.
      </Typography>

      <Typography className="hoursNote">
        We welcome walk-ins to join us at the bar where we serve the full menu.
      </Typography>*/}

    </Box>
  )
}