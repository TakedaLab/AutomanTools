import { keymap_default as keymap } from './key_map/default'

const modifiers = {
  altKey: "alt",
  ctrlKey: "ctrl",
  shiftKey: "shift",
  metaKey: "meta"
}

export const addKeyCommand = (command, callback) => {
  // add event listner to document
  keymap.forEach((obj_bind) => {
    if(obj_bind.command !== command){
      
    }else{
      obj_bind.keys.forEach((obj_key) => {
        const lits = obj_key.split("+")
        // TODO: only shift
        const m = {
          altKey:   lits.includes(modifiers.altKey),
          ctrlKey:  lits.includes(modifiers.ctrlKey),
          shiftKey: lits.includes(modifiers.shiftKey),
          metaKey:  lits.includes(modifiers.metaKey),
          code:     lits[lits.length - 1]
        }
        document.addEventListener("keydown", (e) => {
          execCommand(e, m, callback)
        }, false)
      })
    }
  })
}

export const execKeyCommand = (command, e, callback) => {
  // exec key command
  keymap.forEach((obj_bind) => {
    if(obj_bind.command !== command){
      
    }else{
      obj_bind.keys.forEach((obj_key) => {
        const lits = obj_key.split("+")
        const m = {
          altKey:   lits.includes(modifiers.altKey),
          ctrlKey:  lits.includes(modifiers.ctrlKey),
          shiftKey: lits.includes(modifiers.shiftKey),
          metaKey:  lits.includes(modifiers.metaKey),
          code:     lits[lits.length - 1]
        }
        execCommand(e, m, callback)
      })
    }
  })
}

const execCommand = (e, m, f) => {
  if(
    (e.altKey === m.altKey)
    && (e.ctrlKey === m.ctrlKey)
    && (e.shiftKey === m.shiftKey)
    && (e.metaKey === m.metaKey)
    && (e.code === m.code)
  ){
    f()
  }
}
