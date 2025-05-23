import React, { useState } from "react";
import {
  Box,
  Popover,
  IconButton,
  ButtonGroup,
  Button,
  Tooltip,
  Typography,
} from "@mui/material";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";

const ShapeTools = ({ selectedShape, onShapeSelect, onFillChange, filled }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShapeSelect = (shape) => {
    onShapeSelect(shape);
    handleClose();
  };

  const handleFillToggle = () => {
    onFillChange(!filled);
  };

  const open = Boolean(anchorEl);

  const shapes = [
    {
      id: "rectangle",
      name: "Rectangle",
      icon: <CropSquareIcon />,
      filledIcon: <CheckBoxOutlineBlankIcon />,
    },
    {
      id: "circle",
      name: "Circle",
      icon: <RadioButtonUncheckedIcon />,
      filledIcon: <PanoramaFishEyeIcon />,
    },
    {
      id: "triangle",
      name: "Triangle",
      icon: <ChangeHistoryIcon />,
      filledIcon: <ChangeHistoryIcon />,
    },
  ];

  const selectedShapeObj =
    shapes.find((shape) => shape.id === selectedShape) || shapes[0];

  return (
    <>
      <Tooltip title="Shape Tools">
        <IconButton onClick={handleClick}>
          {filled ? selectedShapeObj.filledIcon : selectedShapeObj.icon}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="subtitle2" gutterBottom>
            Select Shape
          </Typography>

          <ButtonGroup variant="outlined" fullWidth sx={{ mb: 2 }}>
            {shapes.map((shape) => (
              <Tooltip key={shape.id} title={shape.name}>
                <Button
                  variant={
                    selectedShape === shape.id ? "contained" : "outlined"
                  }
                  onClick={() => handleShapeSelect(shape.id)}
                >
                  {filled ? shape.filledIcon : shape.icon}
                </Button>
              </Tooltip>
            ))}
          </ButtonGroup>

          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Fill Shape:
            </Typography>
            <IconButton
              color={filled ? "primary" : "default"}
              onClick={handleFillToggle}
              size="small"
            >
              <FormatColorFillIcon />
            </IconButton>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ShapeTools;
