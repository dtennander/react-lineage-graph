import { Dispatch, createContext, useContext, useReducer, useState } from "react"
import { Node } from "./LineageRender"

type Context = {
  pickedNode: Node | null;
  setNode: Dispatch<Node | null>;
}

const LineageContext = createContext<Context>({
  pickedNode: null,
  setNode: () => { },
})

export const LineageProvider = ({ children }) => {
  const [pickedNode, dispatch] = useState<Node | null>(null)
  console.log("pickedNode", pickedNode)
  return (
    <LineageContext.Provider value={{ pickedNode, setNode: dispatch }}>
      {children}
    </LineageContext.Provider>
  )
}

export const useNode = () => {
  const { pickedNode, setNode } = useContext(LineageContext)
  return [pickedNode, <N extends Node,>(n: N | null) => {
    console.log(n)
    setNode(n)
  }] as const
}
