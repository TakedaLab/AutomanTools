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

  {
    "keys": ["KeyH"],
    "command": "bbox_move_left",
  },
  {
    "keys": ["KeyL"],
    "command": "bbox_move_right",
  },
]
