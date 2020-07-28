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
//
// KEY MAPPING
// -----------
// `keys` accepts:
// ((alt|ctrl|meta|shift)\+)*(<keyCode>)
//
// MISC
// ----
// This key map definition was designed based on Sublime Text Key Bindings:
// https://www.sublimetext.com/docs/3/key_bindings.html
//

export const keymapDefault = [
  //view
  {
    "keys": ["shift+ShiftLeft", "shift+ShiftRight", "ShiftLeft", "ShiftRight"],
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
    "keys": ["KeyN"],
    "command": "frame_next",
  },
  {
    "keys": ["KeyB"],
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
    "keys": ["shift+ArrowUp"],
    "command": "bbox_x_pos_increment",
  },
  {
    "keys": ["ArrowUp"],
    "command": "bbox_x_pos_increment_big",
  },
  {
    "keys": ["shift+ArrowDown"],
    "command": "bbox_x_pos_decrement",
  },
  {
    "keys": ["ArrowDown"],
    "command": "bbox_x_pos_decrement_big",
  },
  {
    "keys": ["shift+ArrowLeft"],
    "command": "bbox_y_pos_increment",
  },
  {
    "keys": ["ArrowLeft"],
    "command": "bbox_y_pos_increment_big",
  },
  {
    "keys": ["shift+ArrowRight"],
    "command": "bbox_y_pos_decrement",
  },
  {
    "keys": ["ArrowRight"],
    "command": "bbox_y_pos_decrement_big",
  },
  {
    "keys": [],
    "command": "bbox_z_pos_increment",
  },
  {
    "keys": [],
    "command": "bbox_z_pos_increment_big",
  },
  {
    "keys": [],
    "command": "bbox_z_pos_decrement",
  },
  {
    "keys": [],
    "command": "bbox_z_pos_decrement_big",
  },


    // size
  {
    "keys": ["alt+ArrowUp"],
    "command": "bbox_x_size_increment",
  },
  {
    "keys": ["alt+shift+ArrowUp"],
    "command": "bbox_x_size_increment_big",
  },
  {
    "keys": ["alt+ArrowDown"],
    "command": "bbox_x_size_decrement",
  },
  {
    "keys": ["alt+shift+ArrowDown"],
    "command": "bbox_x_size_decrement_big",
  },
  {
    "keys": ["alt+ArrowLeft"],
    "command": "bbox_y_size_increment",
  },
  {
    "keys": ["alt+shift+ArrowLeft"],
    "command": "bbox_y_size_increment_big",
  },
  {
    "keys": ["alt+ArrowRight"],
    "command": "bbox_y_size_decrement",
  },
  {
    "keys": ["alt+shift+ArrowRight"],
    "command": "bbox_y_size_decrement_big",
  },
  {
    "keys": [],
    "command": "bbox_z_size_increment",
  },
  {
    "keys": [],
    "command": "bbox_z_size_increment_big",
  },
  {
    "keys": [],
    "command": "bbox_z_size_decrement",
  },
  {
    "keys": [],
    "command": "bbox_z_size_decrement_big",
  },
]

