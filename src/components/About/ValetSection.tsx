import { Box, Typography } from "@mui/material";
import "../../assets/styles/About/ValetSection.css";

export default function ValetSection(){

  return(
    <Box className="valetSection">

      <Typography className="valetTitle">
        VALET PARKING
      </Typography>

      <Typography>
        Valet Parking is available at <b>7863 Old Union Road.</b>
      </Typography>

      <Typography className="valetHours">
        Monday - Friday: 3:45pm - close<br/>
        Saturdays & Sundays: 9:45am - close
      </Typography>

    </Box>
  )
}