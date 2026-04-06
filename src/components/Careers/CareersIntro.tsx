import { Box, Typography } from "@mui/material"
import "../../assets/styles/Careers/careersIntro.css"

export default function CareersIntro(){

  return(

    <Box className="careersIntro">

      <Typography variant="h2" >
        Work With Us
      </Typography>
       <Typography variant="h5" className="title" sx={{marginTop: '0'}}>
       <i> {`Become Part of our Famiglia`}</i>
      </Typography>

      <Typography className="paragraph">
        Bella Vita is a new Italian restaurant focused on great food,
        an amazing atmosphere, and exceptional service!
      </Typography>

      <Typography className="paragraph">
       If you want to work in an amazing environment where teamwork and leadership take precedence, then this job is for you! 

We are looking for individuals who are passionate about the food industry and take pride in their work and can build relationships.

Our goal is to build a strong team that is reliable, cares about service and can work in a fast-paced team environment.

If this is you and you have experience, then bring your smile and personality to our upcoming job fair.
      </Typography>

      <Typography className="hiring">
        <b>Now Hiring All Positions</b><br/>
         Managers · Servers · Bartenders · Hosts · Kitchen Staff
      </Typography>

      <Typography variant="h5" className="joinTitle">
        Join the Bella Vita Team
      </Typography>

      <Typography className="subtitle">
        Grazie.
      </Typography>

    </Box>

  )
}