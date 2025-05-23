import React, { useState } from "react";
import { Box, Popover, IconButton, Button, TextField } from "@mui/material";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";

const ColorPicker = ({ selectedColor, onColorChange, disabled }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [customColor, setCustomColor] = useState(selectedColor);

  // Predefined colors
  const colors = [
    "#000000", // Black
    "#ffffff", // White
    "#ff0000", // Red
    "#00ff00", // Green
    "#0000ff", // Blue
    "#ffff00", // Yellow
    "#ff00ff", // Magenta
    "#00ffff", // Cyan
    "#ff8000", // Orange
    "#8000ff", // Purple
    "#0080ff", // Light Blue
    "#ff0080", // Pink
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorSelect = (color) => {
    onColorChange(color);
    handleClose();
  };

  const handleCustomColorChange = (e) => {
    setCustomColor(e.target.value);
  };

  const handleCustomColorApply = () => {
    onColorChange(customColor);
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        sx={{
          width: "100%",
          color: selectedColor === "#ffffff" ? "#000000" : selectedColor,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <FormatColorFillIcon />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 2, width: 200 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              mb: 2,
            }}
          >
            {colors.map((color) => (
              <Box
                key={color}
                onClick={() => handleColorSelect(color)}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  border: "1px solid #ccc",
                  cursor: "pointer",
                  borderRadius: "4px",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                  ...(selectedColor === color && {
                    border: "2px solid #000",
                    transform: "scale(1.1)",
                  }),
                }}
              />
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <TextField
              label="Custom Color"
              variant="outlined"
              size="small"
              fullWidth
              value={customColor}
              onChange={handleCustomColorChange}
              sx={{ mb: 1 }}
            />
            <Box
              sx={{
                width: "100%",
                height: 30,
                backgroundColor: customColor,
                border: "1px solid #ccc",
                mb: 1,
              }}
            />
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={handleCustomColorApply}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ColorPicker;
