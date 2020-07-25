// MODIFIERS
// ---------
// - alt
// - ctrl
// - meta
// - shift
//
// KEY NAMES
// ---------
// Refer keyCode definition
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode

export const default_key_map = [
  //view
  {
    "keys": ["shift"],
    "command": "change_edit_mode"
  },

  // history
  {
    "keys": ["ctrl+KeyZ", "meta+KeyZ"],
    "command": "history_undo"
  },
  {
    "keys": ["ctrl+shift+KeyZ", "meta+shift+KeyZ"],
    "command": "history_redo"
  },
  
  // frame
  {
    "keys": ["ArrowRight"],
    "command": "frame_next",
  },
  {
    "keys": ["ArrowLeft"],
    "command": "frame_prev",
  },


  // bbox control
  {
    "keys": ["Delete", "Backspace"],
    "command": "bbox_remove",
  },
  {
    "keys": ["ctrl+KeyC", "meta+KeyC"],
    "command": "bbox_copy",
  },
  {
    "keys": ["ctrl+KeyV", "meta+KeyV"],
    "command": "bbox_paste",
  },

  // move
  {
    "keys": ["KeyH"],
    "command": "bbox_shift_left",
  },
  {
    "keys": ["shift+KeyH"],
    "command": "bbox_shift_left_big",
  },
  {
    "keys": ["KeyL"],
    "command": "bbox_shift_right",
  },
  {
    "keys": ["shift+KeyL"],
    "command": "bbox_shift_right_big",
  },
  {
    "keys": ["KeyK"],
    "command": "bbox_shift_top",
  },
  {
    "keys": ["shift+KeyK"],
    "command": "bbox_shift_top_big",
  },
  {
    "keys": ["KeyJ"],
    "command": "bbox_shift_bottom",
  },
  {
    "keys": ["shift+KeyJ"],
    "command": "bbox_shift_bottom_big",
  },

  // size
  {
    "keys": ["alt+KeyH"],
    "command": "bbox_width_decrease",
  },
  {
    "keys": ["alt+shift+KeyH"],
    "command": "bbox_width_decrease_big",
  },
  {
    "keys": ["alt+KeyL"],
    "command": "bbox_width_increase",
  },
  {
    "keys": ["alt+shift+KeyL"],
    "command": "bbox_width_increase_big",
  },
  {
    "keys": ["alt+KeyK"],
    "command": "bbox_height_increase",
  },
  {
    "keys": ["alt+shift+KeyK"],
    "command": "bbox_height_increase_big",
  },
  {
    "keys": ["alt+KeyJ"],
    "command": "bbox_height_decrease",
  },
  {
    "keys": ["alt+shift+KeyJ"],
    "command": "bbox_height_decrease_big",
  },
]
