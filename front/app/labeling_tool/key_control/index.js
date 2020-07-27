import { default_key_map as key_map } from './key_map/default'

export const addKeyCommand = (command, callback) => {
  // add event listner to document
  key_map.forEach((obj_bind) => {
    if(obj_bind.command !== command){
      
    }else{
      obj_bind.keys.forEach((obj_key) => {
        const lits = obj_key.split("+")
        const m = {
          altKey:   lits.includes("alt"),
          ctrlKey:  lits.includes("ctrl"),
          shiftKey: lits.includes("shift"),
          metaKey:  lits.includes("meta"),
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
  key_map.forEach((obj_bind) => {
    if(obj_bind.command !== command){
      
    }else{
      obj_bind.keys.forEach((obj_key) => {
        const lits = obj_key.split("+")
        const m = {
          altKey:   lits.includes("alt"),
          ctrlKey:  lits.includes("ctrl"),
          shiftKey: lits.includes("shift"),
          metaKey:  lits.includes("meta"),
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
