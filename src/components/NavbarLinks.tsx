import { useId, useState } from "react";
import { Box, IconButton, Menu, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link, useLocation } from "react-router-dom";

const links = ["Home", "Menu", "Events", "About", "Apply"].map((label) => ({
  label,
  to: label === "Home" ? "/" : `/${label.toLowerCase()}`,
}));

function MobileMenu() {
  const id = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const closeMenu = () => setAnchorEl(null);

  return (
    <Box sx={{ padding: "0 20px" }}>
      <IconButton
        id={`${id}-button`}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => setAnchorEl(open ? null : event.currentTarget)}
        sx={{ color: "white", width: 44, height: 44 }}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          list: { "aria-labelledby": `${id}-button` },
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              backgroundColor: "black",
              color: "white",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          },
        }}
      >
        {links.map(({ label, to }) => (
          <MenuItem
            component={Link}
            key={label}
            to={to}
            onClick={closeMenu}
            sx={{ minHeight: 48, px: 3, "&:hover, &.Mui-focusVisible": { backgroundColor: "rgba(255, 255, 255, 0.12)" } }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default function NavbarLinks() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();

  if (isMobile) {
    return <MobileMenu key={location.key} />;
  }

  return (
    <Box display="flex" gap={4}>
      {links.map(({ label, to }) => (
        <Link key={label} to={to} style={{ cursor: "pointer", textDecoration: "none", color: "white" }}>
          {label}
        </Link>
      ))}
    </Box>
  );
}
