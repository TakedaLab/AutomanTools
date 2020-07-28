import { keymap } from './key_map/index'

const modifiers = {
  altKey: "alt",
  ctrlKey: "ctrl",
  shiftKey: "shift",
  metaKey: "meta"
}

export const addKeyCommand = (command, callback) => {
  // add event listner to document
  keymap.forEach((objBind) => {
    if(objBind.command !== command){
      
    }else{
      objBind.keys.forEach((objKey) => {
        const lits = objKey.split("+")
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
  keymap.forEach((objBind) => {
    if(objBind.command !== command){
      
    }else{
      objBind.keys.forEach((objKey) => {
        const lits = objKey.split("+")
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
