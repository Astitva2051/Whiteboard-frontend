import React from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DeleteIcon from "@mui/icons-material/Delete";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff";
import TimelineIcon from "@mui/icons-material/Timeline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import PanToolIcon from "@mui/icons-material/PanTool";
import ColorPicker from "./ColorPicker";

const tools = [
  { id: "pen", icon: <CreateIcon />, tooltip: "Pen Tool" },
  { id: "line", icon: <TimelineIcon />, tooltip: "Line Tool" },
  { id: "arrow", icon: <ArrowForwardIcon />, tooltip: "Arrow Tool" },
  { id: "rectangle", icon: <CropSquareIcon />, tooltip: "Rectangle Tool" },
  { id: "circle", icon: <RadioButtonUncheckedIcon />, tooltip: "Circle Tool" },
  { id: "paint", icon: <FormatColorFillIcon />, tooltip: "Fill Tool" },
  { id: "text", icon: <TextFieldsIcon />, tooltip: "Text Tool" },
  { id: "eraser", icon: <AutoFixOffIcon />, tooltip: "Eraser Tool" },
  { id: "drag", icon: <PanToolIcon />, tooltip: "Drag Tool" },
];

const WhiteboardToolbar = ({
  selectedTool,
  setSelectedTool,
  selectedColor,
  setSelectedColor,
  selectedWidth,
  setSelectedWidth,
  onClearCanvas,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const lastColor = React.useRef("#000000");

  const handleToolSelect = (event, newTool) => {
    if (newTool === null) return;
    if (newTool === "eraser") {
      if (selectedTool !== "eraser") {
        lastColor.current = selectedColor;
      }
      setSelectedColor("#ffffff");
    } else if (selectedTool === "eraser") {
      setSelectedColor(lastColor.current);
    }
    setSelectedTool(newTool);
  };

  const handleWidthChange = (event, newValue) => {
    setSelectedWidth(newValue);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        flexDirection: "column",
        width: 90,
        height: "calc(100vh - 64px)",
        overflowY: "auto",
        borderRadius: 0,
        boxSizing: "border-box",
        p: 1,
      }}
    >
      {/* Tool Selection */}
      <Typography variant="caption" sx={{ mb: 1, textAlign: "center" }}>
        Tools
      </Typography>
      <ToggleButtonGroup
        orientation="vertical"
        value={selectedTool}
        exclusive
        onChange={handleToolSelect}
        sx={{ width: "100%" }}
      >
        {tools.map((tool) => (
          <Tooltip key={tool.id} title={tool.tooltip} placement="right">
            <ToggleButton value={tool.id} aria-label={tool.tooltip}>
              {tool.icon}
            </ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>

      <Divider sx={{ my: 1 }} />

      {/* Undo/Redo/Clear */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          mb: 2,
        }}
      >
        <Tooltip title="Undo" placement="right">
          <span>
            <IconButton color="primary" onClick={onUndo} disabled={!canUndo}>
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo" placement="right">
          <span>
            <IconButton color="primary" onClick={onRedo} disabled={!canRedo}>
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear Canvas" placement="right">
          <IconButton color="error" onClick={onClearCanvas}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Color Picker */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="caption" sx={{ mb: 0.5 }}>
          Color
        </Typography>
        <Tooltip title="Current Color" placement="right">
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: selectedColor,
              border: "2px solid #ccc",
              mb: 1,
              opacity:
                selectedTool === "eraser" || selectedTool === "drag" ? 0.5 : 1,
              cursor:
                selectedTool === "eraser" || selectedTool === "drag"
                  ? "not-allowed"
                  : "pointer",
            }}
          />
        </Tooltip>
        <ColorPicker
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          disabled={selectedTool === "eraser" || selectedTool === "drag"}
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Width Slider */}
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Typography variant="caption" sx={{ mb: 1 }}>
          Width
        </Typography>
        <Slider
          orientation="vertical"
          value={selectedWidth}
          onChange={handleWidthChange}
          min={1}
          max={20}
          sx={{ height: 100 }}
          disabled={selectedTool === "drag" || selectedTool === "eraser"}
        />
      </Box>
    </Paper>
  );
};

export default WhiteboardToolbar;
