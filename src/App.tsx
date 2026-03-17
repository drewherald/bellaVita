import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import './App.css'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ScrollToTop from "./components/ScrollToTop";
import Menu from "./pages/Menu";
import About from "./pages/About";
import Gallery from "./pages/Gallery";
import ComingSoon from "./pages/ComingSoon";


const THEME = createTheme({
   typography: {
    "fontFamily": `"Alegreya", "Helvetica", "Arial", sans-serif`,
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500
   }
});

function App() {

  return (
    <>
      <ThemeProvider theme={THEME}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<ComingSoon />} />
       {/* <Route path="/menu" element={<Menu />} />*/}
        <Route path="/about" element={<About />} />
      {/*  <Route path="/gallery" element={<Gallery />} />*/}



      </Routes>
      </ThemeProvider>
    </>
  )
}

export default App
