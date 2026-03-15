import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/LocationInfo.css";

export default function LocationInfo(){

  return(
    <Box className="locationSection">

      <Typography className="addressTitle">
        7863 Old Union Road,<br/>
        Union, KY 41091
      </Typography>

      <Typography className="contactText">
        123.456.7891<br/>
        info@bellavita.com
      </Typography>

      <hr className="divider"/>

      <Box className="hoursGrid">

        <Box>
          <Typography className="hoursTitle">Monday – Thursday</Typography>
          <Typography>4pm-10pm</Typography>
        </Box>

        <Box>
          <Typography className="hoursTitle">Saturday</Typography>
          <Typography>10am-11pm</Typography>
        </Box>

        <Box>
          <Typography className="hoursTitle">Friday</Typography>
          <Typography>4pm-10pm</Typography>
        </Box>

        <Box>
          <Typography className="hoursTitle">Sunday</Typography>
          <Typography>10am-10pm</Typography>
        </Box>

      </Box>

      <Typography className="hoursNote">
        Brunch menu is served on weekends until 2pm.
      </Typography>

      <Typography className="hoursNote">
        We welcome walk-ins to join us at the bar where we serve the full menu.
      </Typography>

    </Box>
  )
}