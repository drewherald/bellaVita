import { Box, Typography } from "@mui/material";
import hero from "../../assets/photos/home/privateDining.png";
import "../../assets/styles/About/ReservationCTA.css";
import RedButton from "../RedButton";

export default function ReservationCTA(){

  return(
    <>
            <hr style={{color: 'white', width: '1px', margin: '0'}}/>

    <Box
      className="reservationCTA"
      sx={{backgroundImage:`url(${hero})`}}
    >

      <Box className="reservationOverlay"/>

      <Box className="reservationContent">

        <Typography variant="h4">
          Reservations
        </Typography>

        <Typography className="reservationText" sx={{padding: '20px 0 30px 0'}}>
          Book your table and settle in for a relaxed Italian meal,
          shared with good company.
        </Typography>

              <RedButton data={{ text: "Reserve a table", link: "/" }} />


      </Box>

    </Box>
            <hr style={{color: 'white', width: '1px', margin: '0'}}/>
</>
  )
}