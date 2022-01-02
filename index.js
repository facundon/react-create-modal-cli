#! /usr/bin/env node

import chalk from "chalk"
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs"
const log = console.log

// ---------------ENVS------------------------

const CONTEXT_PATH = "./context/ModalsContext.tsx"
const TYPE_PATH = "./@types/modals.ts"
const COMPONENT_PATH = "./components/modals"
const RENDER_PATH = "./components/pages/HomePage.tsx"

// ---------------UTILS------------------------
const capitalize = (string) => {
   return string.charAt(0).toUpperCase() + string.slice(1)
}

const addStr = (str, index, stringToAdd) =>
   str.substring(0, index) + stringToAdd + str.substring(index, str.length)

const endIndex = (str, findStr) => str.indexOf(findStr) + findStr.length

const getBaseModal = (
   modalName
) => `import { FunctionComponent, useCallback } from "react"
import { BaseDialog } from "../../atoms"
import { useModals } from "../../../hooks"

interface ${capitalize(modalName)}ModalProps {}

const ${capitalize(modalName)}Modal: FunctionComponent<${capitalize(
   modalName
)}ModalProps> = () => {
   const { modalsState, closeModal } = useModals()
   const close${capitalize(
      modalName
   )}Modal = useCallback(() => closeModal("${modalName}"), [closeModal])

   return (
      <BaseDialog
         open={modalsState.${modalName}.isOpen}
         onClose={close${capitalize(modalName)}Modal}
         title="Titulo"
         withCloseButton
         backdropClose
         fullWidth
      >
      </BaseDialog>
   )
}

export default ${capitalize(modalName)}Modal`

//---------------Functions--------------------

function addModalToReducerInit(modalName) {
   log(chalk.yellow("Adding to reducer"))
   const data = readFileSync(CONTEXT_PATH, {
      encoding: "utf-8",
   })
   const insertIndex = endIndex(data, "useReducer(modalsReducer, {")
   const stringToAdd = `
   ${modalName}: { isOpen: false, initProps: {} },`
   const result = addStr(data, insertIndex, stringToAdd)
   writeFileSync(CONTEXT_PATH, result, { encoding: "utf-8" })
}

function addModalToType(modalName) {
   log(chalk.yellow("Adding types"))
   const data = readFileSync(TYPE_PATH, { encoding: "utf-8" })
   const insertIndex = endIndex(data, "ModalsState = {")
   const stringToAdd = `
   ${modalName}: ModalData`
   const result = addStr(data, insertIndex, stringToAdd)
   writeFileSync(TYPE_PATH, result, { encoding: "utf-8" })
}

function createModalComponent(modalName) {
   log(chalk.yellow("Creating component"))
   const dirName = COMPONENT_PATH + `/${capitalize(modalName)}Modal`
   mkdirSync(dirName)
   writeFileSync(`${dirName}/index.tsx`, getBaseModal(modalName))

   const data = readFileSync(COMPONENT_PATH + "/index.ts", {
      encoding: "utf-8",
   })
   const stringToAdd = `export { default as ${capitalize(
      modalName
   )}Modal } from "./${capitalize(modalName)}Modal"`
   writeFileSync(COMPONENT_PATH + "/index.ts", data.concat(stringToAdd))
}

function renderModal(modalName) {
   log(chalk.yellow("Adding to render"))
   let data = readFileSync(RENDER_PATH, { encoding: "utf-8" })
   const insertImportIndex = data.indexOf('} from "../modals"')
   const importStringToAdd = `   ${capitalize(modalName)}Modal
   `
   data = addStr(data, insertImportIndex, importStringToAdd)

   const insertComponentIndex = data.indexOf("</>")
   const componentStringToAdd = `
      <${capitalize(modalName)}Modal />`
   const result = addStr(data, insertComponentIndex, componentStringToAdd)
   writeFileSync(RENDER_PATH, result, { encoding: "utf-8" })
}

// --------------- Main -------------------

const modalName = process.argv[2]

function addModalToProject(modalName) {
   if (!modalName) {
      log(chalk.red.bold("Error"), chalk.red("Must provide a modal name"))
      process.exit(1)
   }
   try {
      if (existsSync(COMPONENT_PATH + `/${modalName}Modal`)) {
         log(chalk.yellow("Modal already exists"))
         process.exit(0)
      }
      log(chalk.cyan.bold("Adding"), chalk.cyan(`${modalName}...`))
      addModalToReducerInit(modalName)
      addModalToType(modalName)
      createModalComponent(modalName)
      renderModal(modalName)
      log(chalk.green.bold(`${modalName} added succesfully`))
   } catch (err) {
      log(chalk.bgRed.white.bold("Execution Error"), chalk.bgRed.white(err))
      process.exit(1)
   }
}

addModalToProject(modalName)
