export const keymapDefault = [
  //view
  {
    "keys": ["KeyM"],
    "command": "change_tool_mode"
  },
  {
    "keys": ["shift+ShiftLeft", "shift+ShiftRight", "ShiftLeft", "ShiftRight", "Space"],
    "command": "change_edit_mode"
  },
  {
    "keys": ["Digit0"],
    "command": "reset_camera",
  },
  {
    "keys": ["Digit6"],
    "command": "rotate_camera_rear",
  },
  {
    "keys": ["Digit7"],
    "command": "rotate_camera_left",
  },
  {
    "keys": ["Digit8"],
    "command": "rotate_camera_front",
  },
  {
    "keys": ["Digit9"],
    "command": "rotate_camera_right",
  },

  // templates	
  {	
    "keys": ["alt+Digit1"],	
    "command": "template_add_kcar",	
  },
  {	
    "keys": ["alt+Digit2"],	
    "command": "template_add_sedan",	
  },
  {	
    "keys": ["alt+Digit3"],	
    "command": "template_add_minivan",	
  },
  {	
    "keys": ["alt+Digit4"],	
    "command": "template_add_small_sized_track",	
  },
  {	
    "keys": ["alt+Digit5"],	
    "command": "template_add_middle_sized_track",	
  },
  {	
    "keys": ["alt+Digit6"],	
    "command": "template_add_large_sized_track",	
  },
  {	
    "keys": ["alt+Digit7"],	
    "command": "template_add_mortorcycle",	
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
    "keys": ["Delete", "Backspace", "KeyD"],
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
    "keys": ["KeyJ"],
    "command": "select_next_bbox",
  },
  {
    "keys": ["KeyK"],
    "command": "select_prev_bbox",
  },
  {
    "keys": ["Escape"],
    "command": "deselect_bbox",
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
    "keys": ["alt+shift+ArrowUp"],
    "command": "bbox_x_size_increment",
  },
  {
    "keys": ["alt+ArrowUp"],
    "command": "bbox_x_size_increment_big",
  },
  {
    "keys": ["alt+shift+ArrowDown"],
    "command": "bbox_x_size_decrement",
  },
  {
    "keys": ["alt+ArrowDown"],
    "command": "bbox_x_size_decrement_big",
  },
  {
    "keys": ["alt+shift+ArrowLeft"],
    "command": "bbox_y_size_increment",
  },
  {
    "keys": ["alt+ArrowLeft"],
    "command": "bbox_y_size_increment_big",
  },
  {
    "keys": ["alt+shift+ArrowRight"],
    "command": "bbox_y_size_decrement",
  },
  {
    "keys": ["alt+ArrowRight"],
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
  {
    "keys": ["shift+KeyH"],
    "command": "bbox_set_height",
  },
]

