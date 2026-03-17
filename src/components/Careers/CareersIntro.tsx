import { Box, Typography } from "@mui/material"
import "../../assets/styles/Careers/careersIntro.css"

export default function CareersIntro(){

  return(

    <Box className="careersIntro">

      <Typography variant="h2" className="title">
        Work With Us
      </Typography>

      <Typography className="paragraph">
        Bella Vita is a new Italian restaurant focused on great food,
        atmosphere, and guest experience.
      </Typography>

      <Typography className="paragraph">
        We're building a strong team and looking for people who are
        reliable, positive, and take pride in what they do.
      </Typography>

      <Typography className="hiring">
        <b>Now Hiring All Positions</b><br/>
        Servers · Bartenders · Hosts · Kitchen Staff
      </Typography>

      <Typography variant="h5" className="joinTitle">
        Join the Bella Vita Team
      </Typography>

      <Typography className="subtitle">
        Fill out the form and we'll be in touch.
      </Typography>

    </Box>

  )
}