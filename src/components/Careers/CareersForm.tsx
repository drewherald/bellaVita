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
  const [loading, setLoading] = useState<Boolean>(false)
  const [submitted, setSubmitted] = useState<Boolean>(false)

  const formStartTime = useRef<number>(Date.now())

  const [error, setError] = useState("")

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[0-9()\-\s+]{7,20}$/
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/

  const spamWords = ['viagra', 'casino', 'crypto', 'loan', 'bitcoin']


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

  ...(resume && {
    file: base64File,
    fileName: resume.name,
    fileType: resume.type
  })
})
  })

  

  const result = await response.json()
  return result.url
}


const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!form.current) return

  setError("")
  setLoading(true)

  const formData = new FormData(form.current)

  const name = formData.get("name")?.toString().trim() || ""
  const email = formData.get("email")?.toString().trim() || ""
  const phone = formData.get("phone")?.toString().trim() || ""
  const experience = formData.get("experience")?.toString().trim() || ""
  const honeypot = formData.get("company")

  const timeTaken = Date.now() - formStartTime.current

  // 🚨 Honeypot trap
  if (honeypot) {
    console.warn("Bot detected via honeypot")
    setLoading(false)
    return
  }

  // 🚨 Time trap (< 3 sec = bot)
  if (timeTaken < 3000) {
    setError("Submission too fast. Please try again.")
    setLoading(false)
    return
  }

  // ✅ Validation
  if (!name || !nameRegex.test(name)) {
    setError("Please enter a valid name.")
    setLoading(false)
    return
  }

  if (!emailRegex.test(email)) {
    setError("Please enter a valid email.")
    setLoading(false)
    return
  }

  if (!phoneRegex.test(phone)) {
    setError("Please enter a valid phone.")
    setLoading(false)
    return
  }

  if (/https?:\/\//i.test(experience)) {
    setError("Links are not allowed in experience.")
    setLoading(false)
    return
  }

  const lowerMessage = experience.toLowerCase()
  for (let word of spamWords) {
    if (lowerMessage.includes(word)) {
      setError("Spam detected.")
      setLoading(false)
      return
    }
  }

  try {
    // ✅ Upload resume to Google Drive
const resumeUrl = await sendToGoogle(formData)

    // ✅ Send email
    const templateParams = {
      name,
      email,
      phone,
      position: formData.get("position"),
      availability: formData.get("availability"),
      experience,
      resume_link: resumeUrl
    }

    await emailjs.send(
      VITE_EMAILJS_SERVICE_ID,
      VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      VITE_EMAILJS_PUBLIC_KEY
    )

    form.current.reset()
    setResume(null)
    setSubmitted(true)
    formStartTime.current = Date.now()

  } catch (err) {
    console.error(err)
    setError("Something went wrong")
  }

  setLoading(false)
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
          sx={{backgroundColor: '#710715'}}
        >
          <MenuItem sx={{backgroundColor: '#710715'}} value="Manager">Manager</MenuItem>
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

      { loading === false ? <><Button
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
        </Button> </>: <></>}

      </form>

      {loading === true && !submitted &&        <Typography sx={{color:"white", mt:1}}>Submitting...</Typography>}

      {submitted &&  <Typography sx={{color:"green", mt:1}}>Application Submitted!</Typography>}

{error && (
  <Typography sx={{ color: "red", mt: 1 }}>
    {error}
  </Typography>
)}
      <Typography className="altApply">
        Prefer to apply directly?<br/>
        Email:         <Link style={{color: 'white', textDecoration: 'none'}} to="mailto:info@bellavita.com">info@bellavita.com</Link>
      </Typography>

    </Box>
  )
}