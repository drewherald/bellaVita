import Navbar from "../components//Navbar";
import MenuHero from "../components/Menu/MenuHero";
import MenuCards from "../components/Menu/MenuCards";
import MenuTabs from "../components/Menu/MenuTabs";
import MenuViewer from "../components/Menu/MenuViewer";
import Footer from "../components/Footer";

export default function Menu() {
  return (
    <>
      <Navbar />
      <MenuHero />
      <MenuCards />
      <MenuTabs />
      <MenuViewer />
      <Footer />
    </>
  );
}