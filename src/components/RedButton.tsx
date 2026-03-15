import React from "react";
import { Button } from "@mui/material";

export interface RedButtonProps {
  data: {
    text: string;
    link: string;
  };
}

const RedButton: React.FC<RedButtonProps> = ({ data }) => {
  const { text, link } = data;

  return (
    <Button
            variant="contained"
             component="a"
             id={text} aria-label={text}
            href={link}
            sx={{
              backgroundColor: "#710715",
              fontWeight: '600',
              width: 'fit-content',
              border: '1px solid white',
              fontSize: '1rem',
              padding: '5px 25px',
              textTransform: "none",
              "&:hover": { backgroundColor: "#8e1f1f" },
            }}
          >
            {text}
    </Button>
  );
};

export default RedButton;
