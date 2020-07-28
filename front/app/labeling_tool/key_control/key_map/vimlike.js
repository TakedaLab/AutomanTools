export const keymapVimlike = [
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
    "keys": ["KeyK"],
    "command": "bbox_x_pos_increment",
  },
  {
    "keys": ["shift+KeyK"],
    "command": "bbox_x_pos_increment_big",
  },
  {
    "keys": ["KeyJ"],
    "command": "bbox_x_pos_decrement",
  },
  {
    "keys": ["shift+KeyJ"],
    "command": "bbox_x_pos_decrement_big",
  },
  {
    "keys": ["KeyH"],
    "command": "bbox_y_pos_increment",
  },
  {
    "keys": ["shift+KeyH"],
    "command": "bbox_y_pos_increment_big",
  },
  {
    "keys": ["KeyL"],
    "command": "bbox_y_pos_decrement",
  },
  {
    "keys": ["shift+KeyL"],
    "command": "bbox_y_pos_decrement_big",
  },
  {
    "keys": ["KeyP"],
    "command": "bbox_z_pos_increment",
  },
  {
    "keys": ["shift+KeyP"],
    "command": "bbox_z_pos_increment_big",
  },
  {
    "keys": ["KeyN"],
    "command": "bbox_z_pos_decrement",
  },
  {
    "keys": ["shift+KeyN"],
    "command": "bbox_z_pos_decrement_big",
  },


    // size
  {
    "keys": ["alt+KeyK"],
    "command": "bbox_x_size_increment",
  },
  {
    "keys": ["alt+shift+KeyK"],
    "command": "bbox_x_size_increment_big",
  },
  {
    "keys": ["alt+KeyJ"],
    "command": "bbox_x_size_decrement",
  },
  {
    "keys": ["alt+shift+KeyJ"],
    "command": "bbox_x_size_decrement_big",
  },
  {
    "keys": ["alt+KeyH"],
    "command": "bbox_y_size_increment",
  },
  {
    "keys": ["alt+shift+KeyH"],
    "command": "bbox_y_size_increment_big",
  },
  {
    "keys": ["alt+KeyL"],
    "command": "bbox_y_size_decrement",
  },
  {
    "keys": ["alt+shift+KeyL"],
    "command": "bbox_y_size_decrement_big",
  },
  {
    "keys": ["alt+KeyP"],
    "command": "bbox_z_size_increment",
  },
  {
    "keys": ["alt+shift+KeyP"],
    "command": "bbox_z_size_increment_big",
  },
  {
    "keys": ["alt+KeyN"],
    "command": "bbox_z_size_decrement",
  },
  {
    "keys": ["alt+shift+KeyN"],
    "command": "bbox_z_size_decrement_big",
  },
]

