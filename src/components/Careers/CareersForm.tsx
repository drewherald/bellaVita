import { useRef, useState } from "react"
import emailjs from "@emailjs/browser"
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography
} from "@mui/material"
  const VITE_EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const VITE_EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  const VITE_EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  const VITE_GOOGLE_SCRIPT = import.meta.env.VITE_GOOGLE_SCRIPT

import "../../assets/styles/Careers/careersForm.css"
import { Link } from "react-router-dom"

export default function CareersForm(){

  const form = useRef<HTMLFormElement>(null)

  const [resume, setResume] = useState<File | null>(null)

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    setResume(e.target.files[0])
  }
}

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

const sendToGoogle = async (formData: FormData) => {
  let base64File = ""

  if (resume) {
    base64File = await convertToBase64(resume)

    // remove "data:...base64," prefix
    base64File = base64File.split(",")[1]
  }

  const response = await fetch(VITE_GOOGLE_SCRIPT, {
    method: "POST",
    body: JSON.stringify({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      position: formData.get("position"),
      availability: formData.get("availability"),
      experience: formData.get("experience"),

      file: base64File,
      fileName: resume?.name,
      fileType: resume?.type
    })
  })

  const result = await response.json()
  return result.url
}


 const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!form.current) return

  const formData = new FormData(form.current)

  try {
    // ✅ STEP 4: Upload to Google Drive
    const resumeUrl = resume ? await sendToGoogle(formData) : "No resume uploaded"

    // ✅ STEP 5: Send Email with link
    const templateParams = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      position: formData.get("position"),
      availability: formData.get("availability"),
      experience: formData.get("experience"),
      resume_link: resumeUrl
    }

    await emailjs.send(
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      VITE_EMAILJS_PUBLIC_KEY
    )

    alert("Application submitted!")
    form.current.reset()
    setResume(null)

  } catch (err) {
    console.error(err)
    alert("Something went wrong")
  }
}

  return(

    <Box className="formSection" id="form">

      <form ref={form} onSubmit={sendEmail}>

        <TextField
          name="name"
          label="Full name"
          fullWidth
          required
          className="field"
        />

        <TextField
          name="email"
          label="Email"
          fullWidth
          required
          className="field"
        />

        <TextField
          name="phone"
          label="Phone"
          fullWidth
          required
          className="field"
        />

        <TextField
          name="position"
          select
          label="Position applying for"
          fullWidth
          className="field"
        >

          <MenuItem value="Server">Server</MenuItem>
          <MenuItem value="Bartender">Bartender</MenuItem>
          <MenuItem value="Host">Host</MenuItem>
          <MenuItem value="Kitchen Staff">Kitchen Staff</MenuItem>

        </TextField>

        <TextField
          name="availability"
          label="Availability"
          fullWidth
          className="field"
        />

        <TextField
          name="experience"
          label="Experience"
          multiline
          rows={2}
          fullWidth
          className="field"
        />

        <Button
  variant="contained"
  component="label"
  className="resumeUpload"
  sx={{backgroundColor: '#710715',

      fontWeight: '600',
              width: 'fit-content',
              border: '1px solid white',
              fontSize: '1rem',
              padding: '5px 25px',
              textTransform: "none",
               "&:hover": { backgroundColor: "#8e1f1f" },
  }}
>
  Upload Resume
  <input
    type="file"
    hidden
    accept=".pdf,.doc,.docx"
    onChange={handleFileChange}
  />
</Button>
<br/>
{resume && (
  <Typography sx={{color:"white", mt:1}}>
    {resume.name}
  </Typography>
)}

        <Button
          type="submit"
          className="applyButton"

            sx={{backgroundColor: '#710715',

      fontWeight: '600',
              width: 'fit-content',
              border: '1px solid white',
              fontSize: '1rem',
              padding: '5px 41px',
              textTransform: "none",
              "&:hover": { backgroundColor: "#8e1f1f" },
  }}
        >
          Apply Now
        </Button>

      </form>

      <Typography className="altApply">
        Prefer to apply directly?<br/>
        Email:         <Link style={{color: 'white', textDecoration: 'none'}} to="mailto:info@bellavita.com">info@bellavita.com</Link>
      </Typography>

    </Box>
  )
}