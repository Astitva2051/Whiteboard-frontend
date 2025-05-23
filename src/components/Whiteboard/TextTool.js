import React, { useState } from "react";
import {
  Box,
  Popover,
  IconButton,
  TextField,
  Button,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";

const TextTool = ({
  fontSize,
  onFontSizeChange,
  fontFamily,
  onFontFamilyChange,
  fontStyle,
  onFontStyleChange,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [fontSizeInput, setFontSizeInput] = useState(fontSize);

  const fontFamilies = [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Courier New, monospace", label: "Courier New" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Verdana, sans-serif", label: "Verdana" },
    { value: "Impact, fantasy", label: "Impact" },
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFontSizeChange = (event, newValue) => {
    setFontSizeInput(newValue);
    onFontSizeChange(newValue);
  };

  const handleFontSizeInputChange = (event) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setFontSizeInput(value);
      onFontSizeChange(value);
    }
  };

  const handleFontFamilyChange = (event) => {
    onFontFamilyChange(event.target.value);
  };

  const toggleBold = () => {
    const newStyle = { ...fontStyle };
    newStyle.bold = !newStyle.bold;
    onFontStyleChange(newStyle);
  };

  const toggleItalic = () => {
    const newStyle = { ...fontStyle };
    newStyle.italic = !newStyle.italic;
    onFontStyleChange(newStyle);
  };

  const toggleUnderline = () => {
    const newStyle = { ...fontStyle };
    newStyle.underline = !newStyle.underline;
    onFontStyleChange(newStyle);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Text Tool">
        <IconButton onClick={handleClick}>
          <TextFieldsIcon />
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
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle1" gutterBottom>
            Text Options
          </Typography>

          {/* Font Size */}
          <Box sx={{ mb: 2 }}>
            <Typography id="font-size-slider" gutterBottom variant="body2">
              Font Size
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Slider
                value={fontSizeInput}
                onChange={handleFontSizeChange}
                min={8}
                max={72}
                aria-labelledby="font-size-slider"
                sx={{ mr: 2, flexGrow: 1 }}
              />
              <TextField
                value={fontSizeInput}
                onChange={handleFontSizeInputChange}
                variant="outlined"
                size="small"
                type="number"
                InputProps={{
                  inputProps: {
                    min: 8,
                    max: 72,
                    style: { padding: "4px 8px" },
                  },
                }}
                sx={{
                  width: 66,
                  "& input": { textAlign: "center", fontSize: "0.875rem" },
                }}
              />
            </Box>
          </Box>

          {/* Font Family */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="font-family-label">Font Family</InputLabel>
            <Select
              labelId="font-family-label"
              id="font-family-select"
              value={fontFamily}
              label="Font Family"
              onChange={handleFontFamilyChange}
              size="small"
            >
              {fontFamilies.map((font) => (
                <MenuItem key={font.label} value={font.value}>
                  <Typography style={{ fontFamily: font.value }}>
                    {font.label}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Font Style */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Tooltip title="Bold">
              <IconButton
                color={fontStyle.bold ? "primary" : "default"}
                onClick={toggleBold}
              >
                <FormatBoldIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                color={fontStyle.italic ? "primary" : "default"}
                onClick={toggleItalic}
              >
                <FormatItalicIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
              <IconButton
                color={fontStyle.underline ? "primary" : "default"}
                onClick={toggleUnderline}
              >
                <FormatUnderlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleClose}
            sx={{ mt: 1 }}
          >
            Apply
          </Button>
        </Box>
      </Popover>
    </>
  );
};

export default TextTool;
